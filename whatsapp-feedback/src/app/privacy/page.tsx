import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Nav />

      <section style={{ padding: "80px 40px 120px", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{
          fontSize: 48,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          color: "#111",
          marginBottom: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 56, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em" }}>
          Last updated: July 2026
        </p>

        {[
          {
            heading: "Who we are",
            body: "crowdloop is operated by Distil Technology Limited, a company registered in England and Wales. We help music fans discover live events through WhatsApp-based AI agents. You can contact us at ben@crowdloop.co.",
          },
          {
            heading: "What data we collect",
            body: "When you message crowdloop on WhatsApp, we collect your phone number and the content of your messages. From your conversations we build a taste profile — including music genres, artists, venues, and event preferences you mention. We also store the events we recommend to you and whether you engage with them.",
          },
          {
            heading: "How we use your data",
            body: "We use your data solely to provide the crowdloop service — to recommend live events matched to your taste and to improve the quality of those recommendations over time. We do not use your data for advertising, and we do not sell your data to third parties.",
          },
          {
            heading: "Event data",
            body: "crowdloop uses publicly available event listings from third-party platforms including GigPig to power its recommendations. We do not share your personal data with these platforms.",
          },
          {
            heading: "Data storage",
            body: "Your data is stored securely on Supabase infrastructure hosted in the EU. We retain your data for as long as you are an active crowdloop user. You can request deletion at any time by messaging us on WhatsApp or emailing ben@crowdloop.co.",
          },
          {
            heading: "WhatsApp",
            body: "crowdloop operates via the WhatsApp Business Platform. By messaging crowdloop on WhatsApp you agree to WhatsApp's Terms of Service and Privacy Policy. We access your messages solely to provide our service and do not use them for any other purpose.",
          },
          {
            heading: "Your rights",
            body: "Under UK GDPR you have the right to access, correct, or delete your personal data; to object to or restrict how we process it; and to receive it in a portable format. To exercise any of these rights, contact us at ben@crowdloop.co.",
          },
          {
            heading: "Changes to this policy",
            body: "We may update this policy from time to time. The current version is always available at crowdloop.co/privacy.",
          },
          {
            heading: "Contact",
            body: "Distil Technology Limited · ben@crowdloop.co · crowdloop.co",
          },
        ].map(({ heading, body }) => (
          <div key={heading} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#111",
              marginBottom: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {heading}
            </h2>
            <p style={{
              fontSize: 16,
              color: "#505050",
              lineHeight: 1.7,
              letterSpacing: "-0.01em",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {body}
            </p>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
