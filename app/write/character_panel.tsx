import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type PetData = { pet_model: string; pet_type: string } | null;
type CharacterData = { userName: string; petName: string; expAmount: number; pet: PetData };
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
    .select("pet_name, pet_id")
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();

  if (!userPet) return { kind: "notFound" };

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
    <div className="flex flex-col -translate-y-311 w-full items-end px-50">
      <Image
        src={character.pet.pet_model}
        alt={character.pet.pet_type}
        width={150}
        height={150}
      />
    </div>
  );
}