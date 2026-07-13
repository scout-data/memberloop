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
  created_at      timestamptz default now()
);

-- Seed: The Pigs Head
insert into watched_urls (url, phone_number, label)
values (
  'https://www.thepigshead.com/',
  '447956215839',
  'The Pigs Head'
)
on conflict do nothing;
