import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { cookies } from "next/headers";

export async function getUserArticles() {

  'use server'

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

export default async function archive() {
  const entries = await getUserArticles();

  return (
    <div className="flex flex-col gap-4">
      {entries?.map((entry) => (
      <div key={entry.entry_id}>
        <Link href={`archive/${entry.entry_id}`}><h1> {entry.entry_title} </h1></Link>
      </div>
      ))}
    </div>
  )
}
