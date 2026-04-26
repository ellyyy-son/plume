"use server";

import { createClient } from "@/utils/supabase/server";

type SlotName = "head" | "chest";

export async function equipAccessoryAction({
  virtualPetId,
  accessoryOwnedId,
  slot,
}: {
  virtualPetId: number;
  accessoryOwnedId: string;
  slot: SlotName;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existingRows } = await supabase
    .from("pet_accessory_equipped")
    .select(`
      equipped_id,
      accessory_owned:accessory_owned_id (
        accessory:accessory_id (
          accessory_type
        )
      )
    `)
    .eq("virtual_petid", virtualPetId);

  const existingInSameSlot = existingRows?.find(
    (row: any) =>
      row.accessory_owned?.accessory?.accessory_type === slot
  );

  if (existingInSameSlot) {
    await supabase
      .from("pet_accessory_equipped")
      .delete()
      .eq("equipped_id", existingInSameSlot.equipped_id);
  }

  await supabase.from("pet_accessory_equipped").insert({
    virtual_petid: virtualPetId,
    accessory_owned_id: accessoryOwnedId,
    slot,
  });
}

export async function unequipAccessoryAction({
  virtualPetId,
  slot,
}: {
  virtualPetId: number;
  slot: SlotName;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: rows } = await supabase
    .from("pet_accessory_equipped")
    .select(`
      equipped_id,
      accessory_owned:accessory_owned_id (
        accessory:accessory_id (
          accessory_type
        )
      )
    `)
    .eq("virtual_petid", virtualPetId);

  const equippedInSlot = rows?.find(
    (row: any) =>
      row.accessory_owned?.accessory?.accessory_type === slot
  );

  if (!equippedInSlot) return;

  await supabase
    .from("pet_accessory_equipped")
    .delete()
    .eq("equipped_id", equippedInSlot.equipped_id);
}