"use client";

import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export default function Contact() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Nav active="contact" />
      <ContactSection />
      <Footer />
    </div>
  );
}
