import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type PetData = { pet_model: string; pet_type: string } | null;
type CharacterData = { 
  userName: string; 
  petName: string; 
  expAmount: number; 
  pet: PetData;
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

async function getCharacterSummary(): Promise<CharacterResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kind: "notFound" };

  const { data: profile } = await supabase
    .from("profile")
    .select("user_id, username, virtual_petid, exp_amount")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return { kind: "notFound" };
  if (!profile.virtual_petid) return { kind: "notSelected" };

  const { data: userPet } = await supabase
    .from("user_pet")
    .select("pet_name, mood_id, pet_id")  // with mood_id
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();

  if (!userPet) return { kind: "notFound" };

  const moodId = Number(userPet.mood_id);

  const { data: pet } = await supabase
  .from("pet")
  .select("pet_model, pet_type")
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
      pet: pet ? { 
         pet_type: pet.pet_type, 
         pet_model: petMood?.image_url ?? pet.pet_model  // fallback to base model
      } : null,
      equippedAccessories: equippedAccessories ?? [],
      slots: slots ?? [],
    },
  };
}

export default async function CharacterPanel() {
  const data = await getCharacterSummary();

  if (data.kind === "notFound") {
    return <p>Please log in to see your character.</p>;
  }
  if (data.kind === "notSelected") {
    return <Link href="/pet-selection">Choose your pet</Link>;
  }

  const character = data.data;
  if (!character.pet) {
    return <Link href="/pet-selection">Re-select pet</Link>;
  }

  return (
    <div className="flex flex-col w-full items-end px-10 absolute bottom-[40.5%] right-[20%]">
      <Image
        src={character.pet.pet_model}
        alt={character.pet.pet_type}
        width={152}
        height={152}
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
          width={150}
          height={150}
          className="absolute object-contain"
           />
        );
      })}
    </div>
  );
}