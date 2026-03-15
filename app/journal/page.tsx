import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import JournalForm from "./journal_form";

export default function NewJournalPage() {
  async function createJournal(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const entry_title = formData.get("entry_title") as string;
    const entry_text = formData.get("entry_text") as string;
    const mood_id = Number(formData.get("mood_id"));

    let image_url: string | null = null;
    const image = formData.get("image") as File | null;
    if (image && image.size > 0) {
      const fileName = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("journal-images")
        .upload(fileName, image, { contentType: image.type });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from("journal-images")
        .getPublicUrl(fileName);

      image_url = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("journal_entry")
      .insert({ entry_title, entry_text, mood_id, image_url });

    if (error) throw new Error(error.message);
    redirect("/journal");
  }

  return <JournalForm createJournal={createJournal} />;
}