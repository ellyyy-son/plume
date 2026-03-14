import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  const username = new URL(req.url).searchParams.get("username")?.trim();
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  const usernamePattern = /^[A-Za-z0-9_]+$/;

  if (!username && !email) {
    return NextResponse.json(
      { ok: false, error: "Missing username and/or email." },
      { status: 400 }
    );
  }

  if (!serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let emailTaken = false;
  if (email) {
    const adminAuth = (supabase.auth as any).admin;
    const getUserByEmail = adminAuth?.getUserByEmail;

    if (typeof getUserByEmail === "function") {
      const exactMatchResult = await getUserByEmail.call(adminAuth, email);

      if (exactMatchResult?.error) {
        return NextResponse.json(
          { ok: false, error: exactMatchResult.error.message },
          { status: 400 }
        );
      }

      emailTaken = !!exactMatchResult?.data?.user;
    } else {
      const perPage = 1000;
      let page = 1;

      while (true) {
        const { data: listData, error: listError } =
          await supabase.auth.admin.listUsers({ page, perPage });

        if (listError) {
          return NextResponse.json(
            { ok: false, error: listError.message },
            { status: 400 }
          );
        }

        const users = listData?.users || [];

        emailTaken =
          users.some(
            (user: any) =>
              String(user?.email || "").toLowerCase() === email
          ) || emailTaken;

        if (users.length < perPage) {
          break;
        }

        page += 1;

        if (page > 200) {
          break;
        }
      }
    }
  }

  if (!username) {
    return NextResponse.json({
      ok: true,
      usernameTaken: false,
      emailTaken,
    });
  }

  if (!usernamePattern.test(username)) {
    return NextResponse.json(
      { ok: false, error: "Username can only contain letters, numbers, and underscores." },
      { status: 400 }
    );
  }

  if (username && email && typeof (supabase.auth as any).admin?.getUserByEmail === "function") {
    const exactMatch = (await (supabase.auth as any).admin.getUserByEmail(email))
      .data?.user;
    emailTaken = !!exactMatch;
  }

  const { data, error } = await supabase
    .from("profile")
    .select("user_id")
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    usernameTaken: !!data,
    emailTaken,
  });
}
