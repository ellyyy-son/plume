"use server"

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export async function getEntry(id: string) {
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

  // Generate a short-lived signed URL if this entry has an image
  let signedImageUrl: string | null = null;
  if (entry.image_url) {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("journal-images")
      .createSignedUrl(entry.image_url, 60 * 60); // 1 hour

    if (signedUrlError) {
      console.error("Failed to create signed URL:", signedUrlError.message);
    } else {
      signedImageUrl = signedUrlData.signedUrl;
    }
  }

  return { ...entry, signedImageUrl };
}


export async function deleteEntry(id: string) {

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("No user logged in");
    return;
  }

  const { error } = await supabase
    .from("journal_entry")
    .delete()
    .eq("entry_id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error.message);
  }

  redirect("/archive");
}