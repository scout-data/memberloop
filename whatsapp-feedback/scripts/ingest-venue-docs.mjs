/**
 * ingest-venue-docs.mjs
 *
 * Chunks scraped venue content from .firecrawl/ files, generates
 * OpenAI embeddings, and inserts to the venue_documents table via
 * direct postgres connection (bypasses PostgREST schema cache).
 *
 * Usage:
 *   node scripts/ingest-venue-docs.mjs                    # all configured venues
 *   node scripts/ingest-venue-docs.mjs --slug jockey-club # one venue only
 */

import { Client } from "pg";
import OpenAI from "openai";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");

// Load .env.local — try project root then parent (git repo root)
for (const envPath of [join(root, ".env.local"), join(root, "../.env.local")]) {
  try {
    const env = readFileSync(envPath, "utf8");
    for (const line of env.split("\n")) {
      const [k, ...rest] = line.split("=");
      if (k && rest.length) process.env[k.trim()] = rest.join("=").trim();
    }
  } catch {}
}

const POSTGRES_URL = process.env.POSTGRES_URL;
const OPENAI_KEY   = process.env.OPENAI_API_KEY;

if (!POSTGRES_URL) { console.error("Missing POSTGRES_URL in .env.local"); process.exit(1); }
if (!OPENAI_KEY)   { console.error("Missing OPENAI_API_KEY in .env.local"); process.exit(1); }

const openai = new OpenAI({ apiKey: OPENAI_KEY });

const args    = process.argv.slice(2);
const slugArg = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;

// ─── Venue → files mapping ────────────────────────────────────────────────────

const VENUE_SOURCES = {
  "jockey-club": {
    files: [
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-events-tickets.md"),                               url: "https://www.thejockeyclub.co.uk/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-sandown-events-tickets.md"),                       url: "https://www.thejockeyclub.co.uk/sandown/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-kempton-events-tickets.md"),                       url: "https://www.thejockeyclub.co.uk/kempton/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-cheltenham-events-tickets.md"),                    url: "https://www.thejockeyclub.co.uk/cheltenham/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-aintree-events-tickets.md"),                       url: "https://www.thejockeyclub.co.uk/aintree/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-newmarket-events-tickets.md"),                     url: "https://www.thejockeyclub.co.uk/newmarket/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-epsom-events-tickets.md"),                         url: "https://www.thejockeyclub.co.uk/epsom/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-haydock-events-tickets.md"),                       url: "https://www.thejockeyclub.co.uk/haydock/events-tickets/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-sandown-events-tickets-ministry-of-sound-classical.md"), url: "https://www.thejockeyclub.co.uk/sandown/events-tickets/ministry-of-sound-classical/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-haydock-events-tickets-pete-tong.md"),             url: "https://www.thejockeyclub.co.uk/haydock/events-tickets/pete-tong/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-newmarket-events-tickets-newmarket-nights-aitch.md"), url: "https://www.thejockeyclub.co.uk/newmarket/events-tickets/newmarket-nights/aitch/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-cheltenham-events-tickets-the-showcase.md"),       url: "https://www.thejockeyclub.co.uk/cheltenham/events-tickets/the-showcase/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-aintree-events-tickets-grand-national.md"),        url: "https://www.thejockeyclub.co.uk/aintree/events-tickets/grand-national/" },
      { path: join(root, "../../.firecrawl/jockeyclub-about.md"),                                                 url: "https://www.thejockeyclub.co.uk/about-us/" },
      { path: join(root, "../../.firecrawl/jockeyclub-exec.md"),                                                  url: "https://www.thejockeyclub.co.uk/about-us/our-structure/our-executive/" },
      { path: join(root, "../../.firecrawl/thejockeyclub.co.uk-events-tickets-rewards4racing.md"),                url: "https://www.thejockeyclub.co.uk/events-tickets/rewards4racing/" },
    ],
  },
};

// ─── Chunking ─────────────────────────────────────────────────────────────────

const CHUNK_SIZE    = 600;
const CHUNK_OVERLAP = 100;

function cleanMarkdown(md) {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^(Skip to|Close|Before you continue|Powered by|reCAPTCHA).*/gim, "")
    .replace(/cookie.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text) {
  const chunks = [];
  const sections = text.split(/(?=^#{1,3} )/m);

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 50) continue;

    if (trimmed.length <= CHUNK_SIZE) {
      chunks.push(trimmed);
    } else {
      const paras = trimmed.split(/\n\n+/);
      let current = "";
      for (const para of paras) {
        if (!para.trim()) continue;
        if ((current + "\n\n" + para).length > CHUNK_SIZE && current) {
          chunks.push(current.trim());
          const lines = current.trim().split("\n\n");
          current = (lines.slice(-1)[0] ?? "") + "\n\n" + para;
        } else {
          current = current ? current + "\n\n" + para : para;
        }
      }
      if (current.trim().length > 50) chunks.push(current.trim());
    }
  }

  return chunks.filter(c => c.length > 50);
}

// ─── Embed ────────────────────────────────────────────────────────────────────

async function embedBatch(texts) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map(d => d.embedding);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function ingestVenue(pg, slug, config) {
  console.log(`\n📄  Ingesting venue: ${slug}`);

  await pg.query("DELETE FROM public.venue_documents WHERE venue_slug = $1", [slug]);
  console.log("  🗑️  Cleared existing documents");

  const allChunks = [];

  for (const { path, url } of config.files) {
    if (!existsSync(path)) {
      console.log(`  ⚠️  File not found: ${path}`);
      continue;
    }
    const raw     = readFileSync(path, "utf8");
    const cleaned = cleanMarkdown(raw);
    const chunks  = chunkText(cleaned);
    console.log(`  📃  ${path.split("/").pop()} → ${chunks.length} chunks`);
    for (const content of chunks) {
      allChunks.push({ content, source_url: url });
    }
  }

  if (!allChunks.length) { console.log("  ❌ No chunks generated"); return; }
  console.log(`\n  Total chunks: ${allChunks.length}`);

  const BATCH = 50;
  let embedded = 0;

  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch   = allChunks.slice(i, i + BATCH);
    const texts   = batch.map(c => c.content);
    const vectors = await embedBatch(texts);

    // Build parameterised multi-row INSERT
    const placeholders = [];
    const params       = [];
    let   idx          = 1;
    for (let j = 0; j < batch.length; j++) {
      placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}::vector)`);
      params.push(slug, batch[j].content, batch[j].source_url, `[${vectors[j].join(",")}]`);
    }

    await pg.query(
      `INSERT INTO public.venue_documents (venue_slug, content, source_url, embedding) VALUES ${placeholders.join(",")}`,
      params
    );

    embedded += batch.length;
    console.log(`  🧠  ${embedded}/${allChunks.length} embedded`);
  }

  console.log(`  ✅  ${slug} done — ${embedded} documents`);
}

async function main() {
  console.log("🚀  venue-docs ingest\n");

  // Parse manually — pg's built-in URL parser drops dots from usernames (postgres.ref → postgres)
  const u  = new URL(POSTGRES_URL);
  const pg = new Client({
    host:     u.hostname,
    port:     parseInt(u.port) || 5432,
    database: u.pathname.replace(/^\//, ""),
    user:     decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl:      { rejectUnauthorized: false },
  });
  await pg.connect();

  try {
    const venues = slugArg
      ? { [slugArg]: VENUE_SOURCES[slugArg] }
      : VENUE_SOURCES;

    for (const [slug, config] of Object.entries(venues)) {
      if (!config) { console.error(`Unknown slug: ${slug}`); continue; }
      await ingestVenue(pg, slug, config);
    }
  } finally {
    await pg.end();
  }

  console.log("\n✅  All done");
}

main().catch(e => { console.error(e); process.exit(1); });
