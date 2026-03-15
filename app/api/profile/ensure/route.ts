import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type EnsureProfileBody = {
  userId: string;
  name?: string;
  username?: string;
  accessToken?: string;
};

export async function POST(req: NextRequest) {
  if (!serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 500 }
    );
  }

  let body: EnsureProfileBody;

  try {
    body = (await req.json()) as EnsureProfileBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: authData, error: authError } = await supabase.auth.getUser(
    body.accessToken
  );

  if (authError || !authData.user || authData.user.id !== body.userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized request." },
      { status: 401 }
    );
  }

  const existing = await supabase
    .from("profile")
    .select("user_id")
    .eq("user_id", body.userId)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json(
      { ok: false, error: existing.error.message },
      { status: 400 }
    );
  }

  if (existing.data) {
    return NextResponse.json({ ok: true });
  }

  const requestedUsername = typeof body.username === "string" ? body.username.trim() : "";
  const requestedName = typeof body.name === "string" ? body.name.trim() : "";

  if (!requestedUsername) {
    return NextResponse.json(
      { ok: false, error: "Username is required." },
      { status: 400 }
    );
  }

  if (!requestedName) {
    return NextResponse.json(
      { ok: false, error: "Name is required." },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase.from("profile").insert({
    user_id: body.userId,
    username: requestedUsername,
    name: requestedName,
  });

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
