import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { FaFaceAngry } from "react-icons/fa6";
import { FaSmile, FaSmileBeam } from "react-icons/fa";
import { ImSad2, ImNeutral2 } from "react-icons/im";

type PetData = {
  pet_model: string;
  pet_type: string;
} | null;

type MoodData = {
  mood_name: string;
} | null;

type CharacterData = {
  userName: string;
  petName: string;
  moodId: number;
  expAmount: number;
  pet: PetData;
  mood: MoodData;
  slots: { slot_name: string; x: number; y: number }[];
  equippedAccessories: {
    equipped_id: string;
    slot: string;                
    accessory_owned: {
      accessory_id: string;
      accessory: {
        accessory_url: string;
        accessory_name: string;
      } | null;
    } | null;
  }[];
};

type CharacterResult =
  | { kind: "notFound" }
  | { kind: "notSelected" }
  | { kind: "ready"; data: CharacterData };

const moodVisuals = [
  { id: 5, icon: <FaFaceAngry size={24} />, color: "#FA5659" },
  { id: 4, icon: <ImSad2 size={24} />, color: "#F7A34A" },
  { id: 3, icon: <ImNeutral2 size={24} />, color: "#F8D042" },
  { id: 2, icon: <FaSmile size={24} />, color: "#62B64D" },
  { id: 1, icon: <FaSmileBeam size={24} />, color: "#484572" },
];

function getMoodVisual(moodId: number) {
  return (
    moodVisuals.find((mood) => mood.id === moodId) ?? {
      id: 1,
      icon: <FaFaceAngry size={24} />,
      color: "#FA5659",
    }
  );
}

async function getMoodName(supabase: any, moodId: number) {
  const { data: moodByMoodId } = await supabase
    .from("mood")
    .select("mood_name")
    .eq("mood_id", moodId)
    .maybeSingle();

  return moodByMoodId?.mood_name ?? null;
}

async function getCharacterSummary(): Promise<CharacterResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { kind: "notFound" };

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("user_id, username, virtual_petid, exp_amount")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError || !profile) return { kind: "notFound" };
  if (!profile.virtual_petid) return { kind: "notSelected" };

  const { data: userPet, error: userPetError } = await supabase
    .from("user_pet")
    .select("pet_name, mood_id, pet_id")
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();
  if (userPetError || !userPet) return { kind: "notFound" };

  const moodId = Number(userPet.mood_id);
  console.log("pet_id:", userPet.pet_id, "mood_id:", moodId);

  const { data: pet } = await supabase
  .from("pet")
  .select("pet_type, pet_model")
  .eq("pet_id", userPet.pet_id)
  .maybeSingle();

  const { data: petMood } = await supabase
  .from("pet_mood")
  .select("image_url")
  .eq("pet_id", userPet.pet_id)
  .eq("mood_id", moodId)
  .maybeSingle();

  const { data: slots } = await supabase
    .from("slot")
    .select("slot_name, x, y")
    .eq("pet_id", userPet.pet_id);

  const moodName = Number.isFinite(moodId) ? await getMoodName(supabase, moodId) : null;
  const mood: MoodData = moodName ? { mood_name: moodName } : null;

  const { data: equippedAccessories } = await supabase
    .from("pet_accessory_equipped")
    .select("equipped_id, slot, accessory_owned(accessory_id, accessory(accessory_url, accessory_name))")
    .eq("virtual_petid", profile.virtual_petid)
    .returns<CharacterData["equippedAccessories"]>();

  return {
    kind: "ready",
    data: {
      userName: profile.username,
      expAmount: profile.exp_amount ?? 0,
      petName: userPet.pet_name || "My Pet",
      moodId,
      pet: pet ? { 
         pet_type: pet.pet_type, 
         pet_model: petMood?.image_url ?? pet.pet_model  // fallback to base model
      } : null,
      mood,
      equippedAccessories: equippedAccessories ?? [],
      slots: slots ?? [],
    },
  };
}

export default function Page() {
  const character = getCharacterSummary();

  return (
    <div className="p-6 h-screen">
      <div className="max-w-4xl mx-auto rounded-3xl border-5 border-[#E4DCAB] bg-white/90 p-8 shadow-xl/40">
        <h1 className="font-cherry text-5xl text-[#2E2805] text-center mb-4">Welcome Home</h1>
        <div className="text-center font-delius text-xl text-[#2E2805] mb-6">
          <p>
            <Link href="/journal" className="underline hover:text-[#C17F9E]">Go to Journal</Link>
          </p>
          <p>
            <Link href="/tasks" className="underline hover:text-[#C17F9E]">Go to Tasks</Link>
          </p>
        </div>

        <h2 className="font-cherry text-3xl text-[#2E2805] mb-4">Your Character</h2>
        <CharacterPanel getCharacter={character} />
      </div>
    </div>
  );
}

async function CharacterPanel({
  getCharacter,
}: {
  getCharacter: Promise<CharacterResult>;
}) {
  const data = await getCharacter;

  if (data.kind === "notFound") {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805]">Please log in to see your character.</p>
      </div>
    );
  }

  if (data.kind === "notSelected") {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805] mb-3">
          You have not selected a pet yet.
        </p>
        <Link href="/pet-selection" className="font-delius underline text-[#C17F9E]">
          Choose your pet now
        </Link>
      </div>
    );
  }

  const character = data.data;
  const moodVisual = getMoodVisual(character.moodId);

  if (!character.pet) {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805]">Pet image unavailable. Please select a pet again.</p>
        <Link href="/pet-selection" className="font-delius underline text-[#C17F9E]">Re-select pet</Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb] flex flex-col md:flex-row gap-6 items-center justify-between">
      <div className="relative w-[180px] h-[180px]">
           <Image
            src={character.pet.pet_model}
            alt={character.pet.pet_type}
            fill
            className="object-contain"
           />
           {character.equippedAccessories.map((acc) => {
              const item = acc.accessory_owned?.accessory;
              if (!item) return null;

              const pos = character.slots.find((s) => s.slot_name === acc.slot);

              return (
               <Image
                key={acc.equipped_id}
                src={item.accessory_url}
                alt={item.accessory_name}
                width={305}
                height={200}
                className="absolute object-contain"
              />
            );
          })}
       </div>
      <div className="font-delius text-[#2E2805] space-y-3">
        <p className="text-3xl">Hi, {character.userName}!</p>
        <p className="text-xl">EXP Points: {character.expAmount}</p>
        <div className="flex items-center gap-3 text-2xl">
          <span style={{ color: moodVisual.color }}>{moodVisual.icon}</span>
          <span>Current mood: {character.mood?.mood_name ?? `Mood ${character.moodId}`}</span>
        </div>
      </div>
    </div>
  );
}
