-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for fuzzy text search on artist/venue names


-- ─── Artists ──────────────────────────────────────────────────────────────────
-- Enriched once via Last.fm + web search fallback, reused across all events

CREATE TABLE artists (
  name                TEXT PRIMARY KEY,
  lastfm_url          TEXT,
  genre_tags          TEXT[],            -- from Last.fm tags, ordered by weight
  description         TEXT,              -- Last.fm bio (cleaned)
  similar_artists     TEXT[],            -- Last.fm similar artists
  listeners           BIGINT,            -- Last.fm listener count (popularity proxy)
  image_url           TEXT,
  enriched_at         TIMESTAMPTZ,
  enrichment_source   TEXT               -- 'lastfm' | 'web_search' | 'none'
);

CREATE INDEX artists_genre_tags_idx ON artists USING GIN (genre_tags);


-- ─── Venues ───────────────────────────────────────────────────────────────────
-- Enriched once from venue website

CREATE TABLE venues (
  uuid                TEXT PRIMARY KEY,  -- GigPig venue UUID
  name                TEXT NOT NULL,
  website             TEXT,
  description         TEXT,              -- scraped from venue website
  venue_type          TEXT,              -- 'pub' | 'restaurant' | 'dedicated_music' | 'bar' | 'theatre' | 'outdoor'
  vibe_tags           TEXT[],            -- ['intimate', 'lively', 'seated', 'late_night', 'outdoor', 'free']
  capacity_tier       TEXT,              -- 'small' (<100) | 'medium' (100-500) | 'large' (500+)
  town                TEXT,
  county              TEXT,
  postcode            TEXT,
  latitude            FLOAT,
  longitude           FLOAT,
  enriched_at         TIMESTAMPTZ
);

CREATE INDEX venues_town_idx ON venues (town);
CREATE INDEX venues_vibe_tags_idx ON venues USING GIN (vibe_tags);


-- ─── Events ───────────────────────────────────────────────────────────────────

CREATE TABLE events (
  id                  BIGINT PRIMARY KEY,   -- GigPig event ID
  title               TEXT NOT NULL,        -- "Ben Williams performing at Albert's Shed"
  artist_name         TEXT REFERENCES artists (name),
  artist_image        TEXT,
  venue_uuid          TEXT REFERENCES venues (uuid),
  venue_name          TEXT,                 -- denormalised for convenience
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ,
  details_url         TEXT,
  -- Embedding input: composite text built from artist + venue enrichment
  embedding_text      TEXT,
  embedding           VECTOR(1536),
  synced_at           TIMESTAMPTZ DEFAULT NOW(),
  raw                 JSONB                 -- full GigPig response
);

CREATE INDEX events_start_time_idx ON events (start_time);
CREATE INDEX events_artist_name_idx ON events (artist_name);
CREATE INDEX events_venue_uuid_idx ON events (venue_uuid);
CREATE INDEX events_embedding_idx ON events USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);


-- ─── User profiles ────────────────────────────────────────────────────────────
-- Keyed by WhatsApp phone number (E.164 format, e.g. +447463589130)

CREATE TABLE user_profiles (
  phone_number        TEXT PRIMARY KEY,
  display_name        TEXT,
  -- Structured preference profile (updated after each conversation turn)
  genre_affinities    JSONB,             -- [{genre, weight, source}]
  home_area           TEXT,
  work_area           TEXT,
  preferred_towns     TEXT[],
  max_travel          TEXT,              -- 'local' | 'citywide' | 'anywhere'
  prefers_evenings    BOOLEAN,
  prefers_weekends    BOOLEAN,
  prefers_weekdays    BOOLEAN,
  late_night_ok       BOOLEAN,
  social_mode         TEXT,              -- 'solo' | 'couple' | 'small_group' | 'large_group'
  has_kids            BOOLEAN,
  budget_signal       TEXT,              -- 'free_only' | 'budget' | 'mid' | 'splurge'
  venue_size_pref     TEXT,              -- 'intimate' | 'mid' | 'large'
  indoor_outdoor_pref TEXT,              -- 'indoor' | 'outdoor' | 'either'
  seated_standing_pref TEXT,             -- 'seated' | 'standing' | 'either'
  mentioned_artists   TEXT[],
  mentioned_venues    TEXT[],
  inferred_interests  TEXT[],
  profile_confidence  FLOAT DEFAULT 0,   -- 0-1, how complete/confident the profile is
  raw_profile         JSONB,             -- full Claude-extracted object, latest snapshot
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_active         TIMESTAMPTZ DEFAULT NOW()
);


-- ─── Conversation messages ────────────────────────────────────────────────────

CREATE TABLE messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number        TEXT NOT NULL,
  role                TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content             TEXT NOT NULL,
  wa_message_id       TEXT,              -- WhatsApp Cloud API message ID
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_phone_number_idx ON messages (phone_number, created_at DESC);


-- ─── Recommendation log ───────────────────────────────────────────────────────
-- Tracks every event shown to a user so we never repeat

CREATE TABLE recommendation_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number        TEXT NOT NULL,
  event_id            BIGINT REFERENCES events (id),
  recommended_at      TIMESTAMPTZ DEFAULT NOW(),
  push_type           TEXT NOT NULL CHECK (push_type IN ('chat_response', 'proactive_push')),
  -- Feedback signals (populated later)
  link_clicked        BOOLEAN,
  user_replied        BOOLEAN,
  reply_sentiment     TEXT              -- 'positive' | 'negative' | 'neutral'
);

CREATE INDEX rec_log_phone_idx ON recommendation_log (phone_number, recommended_at DESC);
CREATE INDEX rec_log_event_idx ON recommendation_log (event_id);


-- ─── Push log ─────────────────────────────────────────────────────────────────
-- One row per proactive push session (wraps multiple recommendations)

CREATE TABLE push_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number        TEXT NOT NULL,
  sent_at             TIMESTAMPTZ DEFAULT NOW(),
  event_ids           BIGINT[],          -- events included in this push
  ai_message          TEXT,              -- the natural language message sent
  trigger_type        TEXT              -- 'manual' | 'scheduled'
);


-- ─── Matching function ────────────────────────────────────────────────────────
-- Find semantically similar events, excluding already-seen ones, future only

CREATE OR REPLACE FUNCTION match_events(
  query_embedding     VECTOR(1536),
  phone              TEXT,
  match_count        INT DEFAULT 10,
  min_date           TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  id                 BIGINT,
  title              TEXT,
  artist_name        TEXT,
  venue_name         TEXT,
  start_time         TIMESTAMPTZ,
  details_url        TEXT,
  similarity         FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    e.id,
    e.title,
    e.artist_name,
    e.venue_name,
    e.start_time,
    e.details_url,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM events e
  WHERE
    e.start_time >= min_date
    AND e.embedding IS NOT NULL
    AND e.id NOT IN (
      SELECT event_id FROM recommendation_log
      WHERE recommendation_log.phone_number = phone
    )
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
