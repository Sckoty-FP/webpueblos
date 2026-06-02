import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";
  return NextResponse.redirect(`${origin}${redirectTo}`);
}
