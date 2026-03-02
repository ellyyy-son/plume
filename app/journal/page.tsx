import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default function NewJournalPage() {
  async function createJournal(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const entry_title = formData.get("entry_title") as string;
    const entry_text = formData.get("entry_text") as string;

    const { error } = await supabase
      .from("journal_entry")
      .insert({ entry_title, entry_text });

    if (error) {
      console.error("SUPABASE ERROR:", error);
      throw new Error(error.message);
    }

    redirect("/journal");
  }

  return (
    <form action={createJournal} className="flex flex-col gap-4 max-w-md">
      <input
        name="entry_title"
        placeholder="Title"
        className="border p-2"
        required
      />
      <textarea
        name="entry_text"
        placeholder="Write your thoughts..."
        className="border p-2 h-40"
        required
      />
      <button type="submit" className="bg-black text-white p-2">
        Save Entry
      </button>
    </form>
  );
}