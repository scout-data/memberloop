import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { error } = await resend.emails.send({
    from: "crowdloop <hello@crowdloop.co>",
    to: "ben@crowdloop.co",
    replyTo: email,
    subject: "New contact from crowdloop.co",
    text: `Someone wants to hear from you.\n\nEmail: ${email}\n\nReply directly to this email to get back to them.`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
