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
  wait_for_ms     integer default 0
);

-- Add wait_for_ms to existing tables (safe to run multiple times)
alter table watched_urls add column if not exists wait_for_ms integer default 0;

-- Seed: The Pigs Head
insert into watched_urls (url, phone_number, label)
values (
  'https://www.thepigshead.com/',
  '447956215839',
  'The Pigs Head'
)
on conflict do nothing;
