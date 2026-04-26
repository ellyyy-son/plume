import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PetChatClient from "./PetChatClient";

type EquippedAccessory = {
  equipped_id: string;
  slot: string;
  accessory_owned: {
    accessory_id: string;
    accessory: {
      accessory_url: string;
      accessory_name: string;
    } | null;
  } | null;
};

type SlotRow = {
  slot_name: string;
  x: number;
  y: number;
};

type PageData =
  | { kind: "notFound" }
  | { kind: "notSelected" }
  | {
      kind: "ready";
      petName: string;
      petType: string;
      moodName: string;
      petModel: string;
      equippedAccessories: EquippedAccessory[];
      slots: SlotRow[];
    };

async function getPetChatData(): Promise<PageData> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { kind: "notFound" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("virtual_petid")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return { kind: "notFound" };
  }

  if (!profile?.virtual_petid) {
    return { kind: "notSelected" };
  }

  const { data: userPet, error: userPetError } = await supabase
    .from("user_pet")
    .select("pet_name, mood_id, pet_id, pet:pet_id(pet_type, pet_model)")
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();

  if (userPetError || !userPet) {
    return { kind: "notFound" };
  }

  const moodId = Number(userPet.mood_id);

  const [moodRow, petMoodRow, slotsResult, equippedResult] = await Promise.all([
    supabase
      .from("mood")
      .select("mood_name")
      .eq("mood_id", moodId)
      .maybeSingle(),
    supabase
      .from("pet_mood")
      .select("image_url")
      .eq("pet_id", userPet.pet_id)
      .eq("mood_id", moodId)
      .maybeSingle(),
    supabase
      .from("slot")
      .select("slot_name, x, y")
      .eq("pet_id", userPet.pet_id),
    supabase
      .from("pet_accessory_equipped")
      .select(
        "equipped_id, slot, accessory_owned(accessory_id, accessory(accessory_url, accessory_name))"
      )
      .eq("virtual_petid", profile.virtual_petid)
      .returns<EquippedAccessory[]>(),
  ]);

  const pet =
    Array.isArray(userPet.pet) || !userPet.pet
      ? null
      : (userPet.pet as { pet_type: string; pet_model: string });

  if (!pet) {
    return { kind: "notFound" };
  }

  return {
    kind: "ready",
    petName: userPet.pet_name?.trim() || "My Pet",
    petType: pet.pet_type,
    moodName: moodRow.data?.mood_name ?? `Mood ${moodId}`,
    petModel: petMoodRow.data?.image_url ?? pet.pet_model,
    equippedAccessories: equippedResult.data ?? [],
    slots: slotsResult.data ?? [],
  };
}

export default async function PetChatPage() {
  const data = await getPetChatData();

  if (data.kind === "notFound") {
    redirect("/login");
  }

  if (data.kind === "notSelected") {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl rounded-3xl border-4 border-[#E4DCAB] bg-white/90 p-8 shadow-xl/40">
          <h1 className="font-cherry text-5xl text-[#2E2805]">Pet Chat</h1>
          <p className="mt-4 font-delius text-lg text-[#2E2805]">
            You need to choose a pet before you can chat with one.
          </p>
          <Link
            href="/pet-selection"
            className="mt-6 inline-block font-delius text-lg text-[#C17F9E] underline"
          >
            Choose your pet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border-4 border-[#E4DCAB] bg-white/90 p-8 shadow-xl/40">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-cherry text-5xl text-[#2E2805]">Pet Chat</h1>
            <p className="mt-2 font-delius text-lg text-[#2E2805]">
              Have a quick conversation with your pet.
            </p>
          </div>
          <Link
            href="/"
            className="font-delius text-[#C17F9E] underline hover:text-[#A0607E]"
          >
            Back Home
          </Link>
        </div>

        <PetChatClient
          petName={data.petName}
          petType={data.petType}
          moodName={data.moodName}
          petModel={data.petModel}
          equippedAccessories={data.equippedAccessories}
          slots={data.slots}
        />
      </div>
    </div>
  );
}
