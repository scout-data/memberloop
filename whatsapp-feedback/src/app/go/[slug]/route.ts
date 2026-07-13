import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data } = await supabase
    .from("watched_urls")
    .select("url")
    .eq("go_slug", slug)
    .limit(1)
    .maybeSingle();

  if (data?.url) {
    return NextResponse.redirect(data.url, { status: 302 });
  }

  return NextResponse.redirect(
    `https://www.gigpig.uk/whats-on/${slug}`,
    { status: 302 }
  );
}
