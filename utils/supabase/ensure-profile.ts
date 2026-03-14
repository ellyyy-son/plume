type SupabaseProfileUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type ProfileValues = {
  name?: string;
  username?: string;
  accessToken?: string;
};

async function ensureProfileWithServiceEndpoint(
  userId: string,
  accessToken: string,
  bodyValues: Pick<ProfileValues, "name" | "username">
) {
  const res = await fetch("/api/profile/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      username: bodyValues.username,
      name: bodyValues.name,
      accessToken,
    }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      ok: false,
      error: payload?.error || "Unable to create profile using server endpoint.",
    };
  }

  return { ok: true };
}

async function ensureProfileDirect(
  supabase: any,
  user: SupabaseProfileUser,
  formValues?: ProfileValues
) {
  const resolvedName =
    formValues?.name?.trim() ||
    (typeof user.user_metadata?.name === "string" ? String(user.user_metadata.name).trim() : "");

  const baseUsername = formValues?.username?.trim();

  if (!baseUsername) {
    return {
      ok: false,
      error: "Username is required.",
    };
  }

  if (!resolvedName) {
    return {
      ok: false,
      error: "Name is required.",
    };
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("profile")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }

  if (existingProfile) {
    return { ok: true };
  }

  const { error } = await supabase.from("profile").insert({
    user_id: user.id,
    username: baseUsername,
    name: resolvedName,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function ensureProfileRecord(
  supabase: any,
  user: SupabaseProfileUser,
  formValues?: ProfileValues
) {
  if (!user?.id) {
    return { ok: false, error: "Missing user id." };
  }

  const directResult = await ensureProfileDirect(supabase, user, formValues);

  if (directResult.ok) {
    return directResult;
  }

  if (
    /row-level security/i.test(directResult.error || "") &&
    formValues?.accessToken
  ) {
    return ensureProfileWithServiceEndpoint(user.id, formValues.accessToken, {
      name: formValues.name,
      username: formValues.username,
    });
  }

  return directResult;
}
