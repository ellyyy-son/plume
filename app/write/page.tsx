import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CharacterPanel from "./character_panel";
import JournalForm from "./journal_form";

export default function NewJournalPage() {
  async function createJournal(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("No authenticated user found.");

    const { data: profileBySession, error: profileBySessionError } = await supabase
      .from("profile")
      .select("user_id, virtual_petid")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileBySessionError) throw new Error("Unable to resolve profile.");
    if (!profileBySession?.user_id) throw new Error("No profile row found for current user.");

    const entry_title = formData.get("entry_title") as string;
    const entry_text = formData.get("entry_text") as string;
    const mood_id = Number(formData.get("mood_id"));

    if (!Number.isFinite(mood_id) || mood_id <= 0)
      throw new Error("Please select a mood before saving.");

    // Handles image upload
    let image_url: string | null = null;
    const imageFile = formData.get("image") as File | null;

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${profileBySession.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("journal-images")  
        .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false });

      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("journal-images")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedUrlError) throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);

      image_url = fileName;
    }
    // --

    const { data: createdEntry, error } = await supabase
      .from("journal_entry")
      .insert({
        entry_title,
        entry_text,
        mood_id,
        user_id: profileBySession.user_id,
        image_url,                 
      })
      .select("user_id")
      .single();

    if (error) throw new Error(error.message);
    if (!createdEntry?.user_id) throw new Error("Journal entry saved but user_id not returned.");
    if (createdEntry.user_id !== profileBySession.user_id)
      throw new Error("Journal owner does not match current user.");
    if (!profileBySession.virtual_petid) throw new Error("No selected pet linked to this account.");

    const { data: ownedPet, error: petLookupError } = await supabase
      .from("user_pet")
      .select("virtual_petid")
      .eq("virtual_petid", profileBySession.virtual_petid)
      .eq("user_id", createdEntry.user_id)
      .maybeSingle();

    if (petLookupError || !ownedPet?.virtual_petid)
      throw new Error("No pet row found for this user while updating mood.");

    const { error: moodUpdateError } = await supabase
      .from("user_pet")
      .update({ mood_id })
      .eq("virtual_petid", ownedPet.virtual_petid);

    if (moodUpdateError) throw new Error(moodUpdateError.message);

    redirect("/write");
  }

  return (
    <>
      <JournalForm createJournal={createJournal} />
      <CharacterPanel />
    </>
  );
}