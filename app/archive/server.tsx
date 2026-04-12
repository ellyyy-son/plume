'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getUserArticles() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("No user logged in");
    return;
  }

  console.log(user.id)

  const { data: ownedEntries, error: ownedError } = await supabase
    .from("journal_entry")
    .select("*")
    .eq("user_id", user.id);

  if (ownedError) {
    console.error(ownedError.message);
    return;
  }

  console.log(ownedEntries)

  return ownedEntries;
}
