"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = { label: string; sentiment: "positive" | "negative" | "neutral" };

export type FeedbackInsights        = { mode: "feedback";         themes: Theme[]; summary: string; action: string | null };
export type VisitorFollowupInsights = { mode: "visitor_followup"; intent: "hot"|"warm"|"cold"; feedback: string|null; preferences: string|null; nextStep: string|null; summary: string };
export type EventsInsights          = { mode: "events";           rsvp: "attending"|"interested"|"declined"|"unclear"; groupSize: string|null; nameCaptured: boolean; questions: string|null; summary: string };
export type RenewalInsights         = { mode: "renewal";          status: "renewing"|"undecided"|"lapsing"; membershipType: string|null; objections: string|null; summary: string };
export type SocietyInsights         = { mode: "society";          intent: "hot"|"warm"|"cold"; feedback: string|null; groupSize: string|null; preferredDate: string|null; nameCaptured: boolean; summary: string };
export type UpdatesInsights         = { mode: "updates";          engagement: "engaged"|"passive"; topicsOfInterest: string[]; followUpNeeded: boolean; followUpNote: string|null; summary: string };
export type ModeInsights = FeedbackInsights | VisitorFollowupInsights | EventsInsights | RenewalInsights | SocietyInsights | UpdatesInsights;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const F = { fontFamily: "inherit" };

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  hot:        { bg: "#EDF7ED", text: "#003014", label: "Hot lead"   },
  warm:       { bg: "#FEF3C7", text: "#78350F", label: "Warm lead"  },
  cold:       { bg: "#F0EFEC", text: "#6E6E6E", label: "Cold lead"  },
  attending:  { bg: "#EDF7ED", text: "#003014", label: "Attending"  },
  interested: { bg: "#FEF3C7", text: "#78350F", label: "Interested" },
  declined:   { bg: "#FEF2F2", text: "#9F1239", label: "Declined"   },
  unclear:    { bg: "#F0EFEC", text: "#6E6E6E", label: "Unclear"    },
  engaged:    { bg: "#EDF7ED", text: "#003014", label: "Engaged"    },
  passive:    { bg: "#F0EFEC", text: "#6E6E6E", label: "Passive"    },
  renewing:   { bg: "#EDF7ED", text: "#003014", label: "Renewing"   },
  undecided:  { bg: "#FEF3C7", text: "#78350F", label: "Undecided"  },
  lapsing:    { bg: "#FEF2F2", text: "#9F1239", label: "Lapsing"    },
};

const SENTIMENT_COLORS = {
  positive: { dot: "#25D366", tag: "#EDF7ED", text: "#003014" },
  negative: { dot: "#F59E0B", tag: "#FEF3C7", text: "#78350F" },
  neutral:  { dot: "#9BA8B0", tag: "#F0EFEC", text: "#505050" },
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 14, animation: "fadeSlideIn 0.3s ease both" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#BBBBBB", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 3, ...F }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#232323", letterSpacing: "-0.01em", lineHeight: 1.5, ...F }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const b = BADGE[status] ?? BADGE.unclear;
  return (
    <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, background: b.bg, color: b.text, borderRadius: 999, padding: "3px 10px", letterSpacing: "-0.01em", marginBottom: 18, animation: "fadeSlideIn 0.3s ease both", ...F }}>
      {b.label}
    </span>
  );
}

function Summary({ text, border = true }: { text: string; border?: boolean }) {
  return (
    <div style={{ paddingTop: border ? 14 : 0, marginTop: 4, borderTop: border ? "1px solid #F0EFEC" : "none", animation: "fadeSlideIn 0.4s ease both" }}>
      <p style={{ fontSize: 13, color: "#505050", lineHeight: 1.7, letterSpacing: "-0.01em", ...F }}>{text}</p>
    </div>
  );
}

// ─── Output components ────────────────────────────────────────────────────────

function FeedbackOutput({ d }: { d: FeedbackInsights }) {
  return (
    <>
      {d.themes.map((t, i) => {
        const c = SENTIMENT_COLORS[t.sentiment];
        return (
          <div key={t.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, animation: "fadeSlideIn 0.35s ease both", animationDelay: `${i * 0.08}s` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#232323", letterSpacing: "-0.01em", ...F }}>{t.label}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, background: c.tag, color: c.text, borderRadius: 999, padding: "2px 8px", flexShrink: 0, textTransform: "capitalize", ...F }}>{t.sentiment}</span>
          </div>
        );
      })}
      {d.summary && <Summary text={d.summary} />}
      {d.action && (
        <div style={{ marginTop: 14, background: "#003014", borderRadius: 10, padding: "10px 12px", animation: "fadeSlideIn 0.35s ease both" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#fff", letterSpacing: "0.07em", marginBottom: 3, ...F }}>Recommended action</div>
          <div style={{ fontSize: 13, color: "#fff", letterSpacing: "-0.01em", ...F }}>{d.action}</div>
        </div>
      )}
    </>
  );
}

function VisitorFollowupOutput({ d }: { d: VisitorFollowupInsights }) {
  return (
    <>
      <StatusBadge status={d.intent} />
      <Field label="Feedback"    value={d.feedback} />
      <Field label="Preferences" value={d.preferences} />
      <Summary text={d.summary} />
      {d.nextStep && (
        <div style={{ marginTop: 14, background: "#003014", borderRadius: 10, padding: "10px 12px", animation: "fadeSlideIn 0.3s ease both" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#fff", letterSpacing: "0.07em", marginBottom: 3, ...F }}>Next step</div>
          <div style={{ fontSize: 13, color: "#fff", letterSpacing: "-0.01em", ...F }}>{d.nextStep}</div>
        </div>
      )}
    </>
  );
}

function EventsOutput({ d }: { d: EventsInsights }) {
  return (
    <>
      <StatusBadge status={d.rsvp} />
      <Field label="Group size"    value={d.groupSize ? `${d.groupSize} players` : null} />
      <Field label="Name captured" value={d.nameCaptured ? "Yes" : "Not yet"} />
      <Field label="Questions"     value={d.questions} />
      <Summary text={d.summary} />
    </>
  );
}

function RenewalOutput({ d }: { d: RenewalInsights }) {
  return (
    <>
      <StatusBadge status={d.status} />
      <Field label="Membership type" value={d.membershipType} />
      <Field label="Objections"      value={d.objections} />
      <Summary text={d.summary} />
    </>
  );
}

function SocietyOutput({ d }: { d: SocietyInsights }) {
  return (
    <>
      <StatusBadge status={d.intent} />
      <Field label="Feedback"       value={d.feedback} />
      <Field label="Group size"     value={d.groupSize ? `${d.groupSize} players` : null} />
      <Field label="Preferred date" value={d.preferredDate} />
      <Field label="Name captured"  value={d.nameCaptured ? "Yes" : "Not yet"} />
      <Summary text={d.summary} />
    </>
  );
}

function UpdatesOutput({ d }: { d: UpdatesInsights }) {
  return (
    <>
      <StatusBadge status={d.engagement} />
      {d.topicsOfInterest?.length > 0 && (
        <div style={{ marginBottom: 14, animation: "fadeSlideIn 0.3s ease both" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#BBBBBB", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6, ...F }}>Topics of interest</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {d.topicsOfInterest.map(t => (
              <span key={t} style={{ fontSize: 12, color: "#505050", background: "#F0EFEC", borderRadius: 999, padding: "2px 9px", ...F }}>{t}</span>
            ))}
          </div>
        </div>
      )}
      <Field label="Follow-up needed" value={d.followUpNeeded ? "Yes" : "No"} />
      <Field label="Follow-up note"   value={d.followUpNote} />
      <Summary text={d.summary} />
    </>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function InsightsPanel({ insights, loading }: { insights: ModeInsights | null; loading: boolean }) {
  return (
    <div style={{ minHeight: 200 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111", letterSpacing: "-0.01em", ...F }}>
          What you&apos;ll see
        </span>
        {loading && (
          <div style={{ marginLeft: "auto", width: 12, height: 12, border: "1.5px solid #D9D9D9", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
        )}
      </div>

      {!insights && !loading && (
        <p style={{ fontSize: 13, color: "#BBBBBB", lineHeight: 1.7, letterSpacing: "-0.01em", ...F }}>
          Start chat
        </p>
      )}

      {insights?.mode === "feedback"         && <FeedbackOutput        d={insights} />}
      {insights?.mode === "visitor_followup" && <VisitorFollowupOutput d={insights} />}
      {insights?.mode === "events"           && <EventsOutput          d={insights} />}
      {insights?.mode === "renewal"          && <RenewalOutput         d={insights} />}
      {insights?.mode === "society"          && <SocietyOutput         d={insights} />}
      {insights?.mode === "updates"          && <UpdatesOutput         d={insights} />}
    </div>
  );
}
