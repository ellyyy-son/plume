import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { cookies } from "next/headers";

export async function getEntry(id: string) {

  'use server'

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("No user logged in");
    return;
  }

  const { data: entry, error: entryError } = await supabase
    .from("journal_entry")
    .select("*")
    .eq("entry_id", id)
    .single();

  if (entryError) {
    console.error(entryError.message);
    return;
  }

  return entry;
}

export default async function Entry({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
  const entry = await getEntry(id);

  if (!entry) {
    return <div>Entry not found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1>{entry.entry_title}</h1>
      <h1>{entry.entry_text}</h1>
    </div>
  );
}
