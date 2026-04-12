import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FaSave } from "react-icons/fa";
import { IoAdd } from "react-icons/io5";
import MoodSelector from "./mood_selector";
import CharacterPanel from "./character_panel";

export default function NewJournalPage() {
  async function createJournal(formData: FormData) {
    "use server";
    const supabase = await createClient();
    // … your Supabase insert/update logic …
    redirect("/write");
  }

  return (
    <form action={createJournal} className="w-full flex flex-col gap-24 items-center">
      <header className="w-full bg-[#FBF5D1] p-12">
        <h1 className="text-center text-[#163F55] text-6xl font-cherry">
          How are you feeling today?
        </h1>
        <MoodSelector />
      </header>
      <div className="flex flex-col items-center bg-white rounded-2xl w-[70%] gap-8 p-12">
        <input
          name="entry_title"
          placeholder="Title"
          className="font-cherry text-5xl text-center w-full"
          required
        />
        <textarea
          name="entry_text"
          placeholder="Write your thoughts..."
          className="font-delius min-h-200 p-4 w-full border rounded-3xl"
          required
        />

        <button type="submit" className="fixed right-4 bottom-[120px] bg-[#FBF5D1] text-[#163F55] p-6 rounded-xl text-xl hover:bg-[#ccc38dad] transition-colors">
          <FaSave />
        </button>
      </div>
      <CharacterPanel />
      <button type="button" className="fixed right-4 bottom-5 bg-[#ADD3EA] text-[#163F55] p-6 rounded-xl text-xl hover:bg-[#163f5575] transition-colors">
        <IoAdd />
      </button>
    </form>
  );
}