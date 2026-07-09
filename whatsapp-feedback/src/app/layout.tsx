import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "crowdloop: Event engagement in WhatsApp",
  description: "AI WhatsApp assistants for events, venues and corporate teams. Turn post-event feedback into repeat bookings and a direct channel to your audience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="facebook-domain-verification" content="rfc69feen3ulwwmqrim8alywg0ettx" />
      </head>
      <body className="font-sans antialiased bg-white text-ink">{children}</body>
    </html>
  );
}
