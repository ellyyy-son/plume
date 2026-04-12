import { createClient } from "@/utils/supabase/server";
import { redirect } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import DeleteButton from "./client";
import { getEntry } from "./server";

type PetData = {
  pet_model: string;
  pet_type: string;
} | null;

type CharacterData = {
  userName: string;
  petName: string;
  expAmount: number;
  pet: PetData;
};

type CharacterResult =
  | { kind: "notFound" }
  | { kind: "notSelected" }
  | { kind: "ready"; data: CharacterData };

async function getCharacterSummary(): Promise<CharacterResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { kind: "notFound" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("user_id, username, virtual_petid, exp_amount")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { kind: "notFound" };
  }

  if (!profile.virtual_petid) {
    return { kind: "notSelected" };
  }

  const { data: userPet, error: userPetError } = await supabase
    .from("user_pet")
    .select("pet_name, mood_id, pet_id")
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();

  if (userPetError || !userPet) {
    return { kind: "notFound" };
  }

  const { data: pet } = await supabase
    .from("pet")
    .select("pet_model, pet_type")
    .eq("pet_id", userPet.pet_id)
    .maybeSingle();


  return {
    kind: "ready",
    data: {
      userName: profile.username,
      expAmount: profile.exp_amount ?? 0,
      petName: userPet.pet_name || "My Pet",
      pet,
    },
  };
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
  if (!character.pet) {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805]">Pet image unavailable. Please select a pet again.</p>
        <Link href="/pet-selection" className="font-delius underline text-[#C17F9E]">Re-select pet</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end -translate-y-44">
        <Image src={character.pet.pet_model} alt={character.pet.pet_type} width={170} height={170}/>
    </div>
  );
}

export default async function Entry({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
  const entry = await getEntry(id);
  

  if (!entry) {
    return <div>Entry not found</div>;
  }

  const character = getCharacterSummary();

  return (
    <div className="flex flex-col px-15 py-15 font-delius">
      <h1
          className="font-cherry font-black text-4xl bg-[#CCC38D] text-center py-2 px-10 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D] shadow-md"
        >
          {entry.entry_title}
        </h1>
      <div className="flex flex-col gap-6 bg-[#FBF5D1] py-5 px-10 rounded-b-xl border-4 border-[#CCC38D] shadow-md">
        <div className="overflow-y-auto h-70 bg-white rounded-xl p-5">
          <h1>{entry.entry_text}</h1>
        </div>
        <DeleteButton id={id}/>
      </div>
      <CharacterPanel getCharacter={character}/>
    </div>
  );
}
