import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.redirect(
    `https://www.gigpig.uk/whats-on/${params.slug}`,
    { status: 302 }
  );
}
