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
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("AUTH USER ERROR:", userError?.message);
      throw new Error("No authenticated user found.");
    }

    const { data: profileBySession, error: profileBySessionError } = await supabase
      .from("profile")
      .select("user_id, virtual_petid")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileBySessionError) {
      console.error("PROFILE LOOKUP ERROR:", profileBySessionError.message);
      throw new Error("Unable to resolve profile. Please try again.");
    }

    if (!profileBySession?.user_id) {
      throw new Error(
        "No profile row found for current user. Please sign in again and contact support if this continues."
      );
    }

    const entry_title = formData.get("entry_title") as string;
    const entry_text = formData.get("entry_text") as string;
    const mood_id = Number(formData.get("mood_id"));
    if (!Number.isFinite(mood_id) || mood_id <= 0) {
      throw new Error("Please select a mood before saving.");
    }

    const { data: createdEntry, error } = await supabase
      .from("journal_entry")
      .insert({
        entry_title,
        entry_text,
        mood_id,
        user_id: profileBySession.user_id,
      })
      .select("user_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!createdEntry?.user_id) {
      throw new Error("Journal entry was saved but user id was not returned.");
    }

    if (createdEntry.user_id !== profileBySession.user_id) {
      throw new Error("Journal owner does not match the current user.");
    }

    if (!profileBySession.virtual_petid) {
      throw new Error("No selected pet linked to this account.");
    }

    const { data: ownedPet, error: petLookupError } = await supabase
      .from("user_pet")
      .select("virtual_petid")
      .eq("virtual_petid", profileBySession.virtual_petid)
      .eq("user_id", createdEntry.user_id)
      .maybeSingle();

    if (petLookupError || !ownedPet?.virtual_petid) {
      throw new Error("No pet row found for this user while updating mood.");
    }

    const { error: moodUpdateError } = await supabase
      .from("user_pet")
      .update({ mood_id })
      .eq("virtual_petid", ownedPet.virtual_petid);

    if (moodUpdateError) {
      throw new Error(moodUpdateError.message);
    }

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