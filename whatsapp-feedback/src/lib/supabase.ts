import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export type GenreAffinity = {
  genre: string;
  weight: number;
  source: "explicit" | "inferred" | "artist_lookup";
};

export type PreferenceProfile = {
  genre_affinities: GenreAffinity[];
  home_area: string | null;
  work_area: string | null;
  preferred_towns: string[];
  max_travel: "local" | "citywide" | "anywhere" | null;
  prefers_evenings: boolean | null;
  prefers_weekends: boolean | null;
  prefers_weekdays: boolean | null;
  late_night_ok: boolean | null;
  social_mode: "solo" | "couple" | "small_group" | "large_group" | null;
  has_kids: boolean | null;
  budget_signal: "free_only" | "budget" | "mid" | "splurge" | null;
  venue_size_pref: "intimate" | "mid" | "large" | null;
  indoor_outdoor_pref: "indoor" | "outdoor" | "either" | null;
  seated_standing_pref: "seated" | "standing" | "either" | null;
  mentioned_artists: string[];
  mentioned_venues: string[];
  inferred_interests: string[];
  profile_confidence: number;
};

export type MatchedEvent = {
  id: number;
  title: string;
  artist_name: string | null;
  venue_name: string;
  start_time: string;
  details_url: string | null;
  similarity: number;
};

export function profileToQueryText(profile: PreferenceProfile): string {
  const parts: string[] = [];

  if (profile.genre_affinities.length) {
    const genres = profile.genre_affinities
      .sort((a, b) => b.weight - a.weight)
      .map(g => g.genre)
      .slice(0, 6);
    parts.push(`Music and event genres: ${genres.join(", ")}.`);
  }

  if (profile.mentioned_artists.length) {
    parts.push(`Enjoys artists: ${profile.mentioned_artists.join(", ")}.`);
  }

  if (profile.inferred_interests.length) {
    parts.push(`Interests: ${profile.inferred_interests.join(", ")}.`);
  }

  const locationParts: string[] = [];
  if (profile.home_area) locationParts.push(`lives in ${profile.home_area}`);
  if (profile.preferred_towns.length) locationParts.push(`prefers events in ${profile.preferred_towns.join(", ")}`);
  if (locationParts.length) parts.push(`Location: ${locationParts.join(", ")}.`);

  const timingParts: string[] = [];
  if (profile.prefers_evenings) timingParts.push("evenings");
  if (profile.prefers_weekends) timingParts.push("weekends");
  if (profile.prefers_weekdays) timingParts.push("weekdays");
  if (timingParts.length) parts.push(`Prefers: ${timingParts.join(" and ")} events.`);

  const venueParts: string[] = [];
  if (profile.venue_size_pref) venueParts.push(`${profile.venue_size_pref} venues`);
  if (profile.indoor_outdoor_pref && profile.indoor_outdoor_pref !== "either") venueParts.push(profile.indoor_outdoor_pref);
  if (profile.seated_standing_pref && profile.seated_standing_pref !== "either") venueParts.push(`${profile.seated_standing_pref} events`);
  if (venueParts.length) parts.push(`Venue preference: ${venueParts.join(", ")}.`);

  if (profile.social_mode) {
    const modes: Record<string, string> = { solo: "going alone", couple: "going as a couple", small_group: "small group", large_group: "large group" };
    parts.push(`Attending as: ${modes[profile.social_mode] ?? profile.social_mode}.`);
  }

  if (profile.budget_signal) {
    const labels: Record<string, string> = { free_only: "free events only", budget: "budget-friendly", mid: "mid-range", splurge: "premium" };
    parts.push(`Budget: ${labels[profile.budget_signal] ?? profile.budget_signal}.`);
  }

  if (profile.mentioned_venues.length) {
    parts.push(`Mentioned venues: ${profile.mentioned_venues.join(", ")}.`);
  }

  return parts.join(" ") || "general live events and music";
}
