-- watched_urls: tracks URLs to monitor for event changes
create table if not exists watched_urls (
  id              bigserial primary key,
  url             text not null,
  phone_number    text not null,
  label           text not null,
  last_events_text text,
  last_hash       text,
  last_checked    timestamptz,
  last_changed    timestamptz,
  created_at      timestamptz default now(),
  go_slug         text,
  image_url       text,
  scrape_config   jsonb default '{}',
  scrape_notes    text
);

-- Migrate existing tables (safe to run multiple times)
alter table watched_urls add column if not exists scrape_config jsonb default '{}';
alter table watched_urls add column if not exists scrape_notes text;
-- scrape_config supports:
--   waitFor (int ms)     — wait for JS rendering before scraping
--   onlyMainContent (bool) — strip nav/footer; default false (false catches more event content)
--   includeTags (string[]) — CSS selectors to include, e.g. ["main", ".events-list"]
--   excludeTags (string[]) — CSS selectors to exclude, e.g. [".cookie-banner"]
--   extractSlice (int)   — max chars passed to Claude for extraction; default 20000

-- Seed: The Pigs Head
insert into watched_urls (url, phone_number, label)
values (
  'https://www.thepigshead.com/',
  '447956215839',
  'The Pigs Head'
)
on conflict do nothing;
