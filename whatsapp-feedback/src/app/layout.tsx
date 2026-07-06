import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "crowdloop: Event engagement in WhatsApp",
  description: "AI WhatsApp assistants for events, venues and corporate teams. Turn post-event feedback into repeat bookings and a direct channel to your audience.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-ink">{children}</body>
    </html>
  );
}
