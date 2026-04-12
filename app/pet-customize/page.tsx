import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PetCustomizerClient from "./PetCustomizerClient";

type SlotName = "head" | "chest";

type CharacterResult =
  | { kind: "notFound" }
  | { kind: "notSelected" }
  | {
      kind: "ok";
      pet: {
        virtual_petid: number;
        pet_name: string;
        pet: {
          pet_id: number;
          pet_type: string;
          pet_model: string;
        } | null;
      };
      ownedAccessories: Array<{
        accessory_owned_id: string;
        accessory_id: string;
        accessory_name: string;
        accessory_url: string;
        accessory_type: SlotName;
        accessory_description: string | null;
      }>;
      equippedAccessories: Array<{
        equipped_id: string;
        accessory_owned_id: string;
        accessory_id: string;
        accessory_name: string;
        accessory_url: string;
        accessory_type: SlotName;
      }>;
      slots: Array<{
        slot_name: SlotName;
        x: number;
        y: number;
      }>;
    };

async function getPetCustomizationData(): Promise<CharacterResult> {
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
    .select(`
      virtual_petid,
      pet_name,
      pet:pet_id (
        pet_id,
        pet_type,
        pet_model
      )
    `)
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();

  if (userPetError || !userPet) {
    return { kind: "notFound" };
  }

  const { data: slotsData } = await supabase
    .from("slot")
    .select("slot_name, x, y");

  const slots =
    (slotsData?.filter(
      (slot: any) => slot.slot_name === "head" || slot.slot_name === "chest"
    ) as Array<{ slot_name: SlotName; x: number; y: number }>) ?? [];

  const { data: ownedAccessoriesRaw } = await supabase
    .from("accessory_owned")
    .select(`
      accessory_owned_id,
      accessory:accessory_id (
        accessory_id,
        accessory_name,
        accessory_url,
        accessory_type,
        accessory_description
      )
    `)
    .eq("user_id", user.id);

  const ownedAccessories =
    ownedAccessoriesRaw
      ?.filter((row: any) => row.accessory)
      .map((row: any) => ({
        accessory_owned_id: row.accessory_owned_id,
        accessory_id: row.accessory.accessory_id,
        accessory_name: row.accessory.accessory_name,
        accessory_url: row.accessory.accessory_url,
        accessory_type: row.accessory.accessory_type as SlotName,
        accessory_description: row.accessory.accessory_description,
      }))
      .filter(
        (item: { accessory_type: SlotName }) =>
          item.accessory_type === "head" || item.accessory_type === "chest"
      ) ?? [];

  const { data: equippedRaw } = await supabase
    .from("pet_accessory_equipped")
    .select(`
      equipped_id,
      accessory_owned_id,
      accessory_owned:accessory_owned_id (
        accessory:accessory_id (
          accessory_id,
          accessory_name,
          accessory_url,
          accessory_type
        )
      )
    `)
    .eq("virtual_petid", profile.virtual_petid);

  const equippedAccessories =
    equippedRaw
      ?.filter((row: any) => row.accessory_owned?.accessory)
      .map((row: any) => ({
        equipped_id: row.equipped_id,
        accessory_owned_id: row.accessory_owned_id,
        accessory_id: row.accessory_owned.accessory.accessory_id,
        accessory_name: row.accessory_owned.accessory.accessory_name,
        accessory_url: row.accessory_owned.accessory.accessory_url,
        accessory_type: row.accessory_owned.accessory.accessory_type as SlotName,
      }))
      .filter(
        (item: { accessory_type: SlotName }) =>
          item.accessory_type === "head" || item.accessory_type === "chest"
      ) ?? [];

  return {
    kind: "ok",
    pet: userPet as {
      virtual_petid: number;
      pet_name: string;
      pet: {
        pet_id: number;
        pet_type: string;
        pet_model: string;
      } | null;
    },
    ownedAccessories,
    equippedAccessories,
    slots,
  };
}

export default async function PetCustomizePage() {
  const result = await getPetCustomizationData();

  if (result.kind === "notFound") {
    redirect("/login");
  }

  if (result.kind === "notSelected") {
    return (
      <div className="min-h-screen bg-[#e2a9c1] p-8">
        <header className="mb-8 w-full bg-[#FBF5D1] px-[50px] py-[20px]">
          <h2 className="text-right text-5xl font-cherry text-[#163F55]">
            Pet Customization
          </h2>
        </header>

        <div className="mx-auto max-w-4xl rounded-3xl border-4 border-[#FBF5D1] bg-[#eecc8e] p-8 inset-ring-4 inset-ring-[#FBF5D1]">
          <h1 className="text-4xl font-cherry text-[#163F55]">
            No active pet selected
          </h1>
          <p className="mt-4 text-lg text-[#163F55]">
            Pick a pet first, then come back to customize it.
          </p>
        </div>
      </div>
    );
  }

  const { pet, ownedAccessories, equippedAccessories, slots } = result;

  if (!pet.pet) {
    return (
      <div className="min-h-screen bg-[#e2a9c1] p-8">
        <header className="mb-8 w-full bg-[#FBF5D1] px-[50px] py-[20px]">
          <h2 className="text-right text-5xl font-cherry text-[#163F55]">
            Pet Customization
          </h2>
        </header>

        <div className="mx-auto max-w-4xl rounded-3xl border-4 border-[#FBF5D1] bg-[#eecc8e] p-8 inset-ring-4 inset-ring-[#FBF5D1]">
          <h1 className="text-4xl font-cherry text-[#163F55]">
            Pet data missing
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e2a9c1]">
      <header className="mb-8 w-full bg-[#FBF5D1] px-[50px] py-[20px]">
        <h2 className="text-right text-5xl font-cherry text-[#163F55]">
          Pet Customization
        </h2>
      </header>

      <main className="mx-auto max-w-7xl p-8 pt-0">
        <PetCustomizerClient
          virtualPetId={pet.virtual_petid}
          petName={pet.pet_name}
          petType={pet.pet.pet_type}
          petModel={pet.pet.pet_model}
          initialOwnedAccessories={ownedAccessories}
          initialEquippedAccessories={equippedAccessories}
          slots={slots}
        />
      </main>
    </div>
  );
}