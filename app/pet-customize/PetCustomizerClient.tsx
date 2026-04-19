"use client";

import Image from "next/image";
import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { equipAccessoryAction, unequipAccessoryAction } from "./actions";

type SlotName = "head" | "chest";

type OwnedAccessory = {
  accessory_owned_id: string;
  accessory_id: string;
  accessory_name: string;
  accessory_url: string;
  accessory_type: SlotName;
  accessory_description: string | null;
};

type EquippedAccessory = {
  equipped_id: string;
  accessory_owned_id: string;
  accessory_id: string;
  accessory_name: string;
  accessory_url: string;
  accessory_type: SlotName;
};

type SlotRow = {
  slot_name: SlotName;
  x: number;
  y: number;
};

export default function PetCustomizerClient({
  virtualPetId,
  petName,
  petType,
  petModel,
  initialOwnedAccessories,
  initialEquippedAccessories,
  slots = [],
}: {
  virtualPetId: number;
  petName: string;
  petType: string;
  petModel: string;
  initialOwnedAccessories: OwnedAccessory[];
  initialEquippedAccessories: EquippedAccessory[];
  slots?: SlotRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const slotMap = useMemo(() => {
    const map: Record<SlotName, { x: number; y: number }> = {
      head: { x: 5, y: 0 },
      chest: { x: 4, y: 10 },
    };

    for (const slot of slots ?? []) {
      if (slot.slot_name === "head" || slot.slot_name === "chest") {
        map[slot.slot_name] = { x: slot.x, y: slot.y };
      }
    }

    return map;
  }, [slots]);

  const equippedBySlot = useMemo(() => {
    return {
      head:
        initialEquippedAccessories.find((item) => item.accessory_type === "head") ??
        null,
      chest:
        initialEquippedAccessories.find((item) => item.accessory_type === "chest") ??
        null,
    };
  }, [initialEquippedAccessories]);

  const ownedBySlot = useMemo(() => {
    return {
      head: initialOwnedAccessories.filter(
        (item) => item.accessory_type === "head"
      ),
      chest: initialOwnedAccessories.filter(
        (item) => item.accessory_type === "chest"
      ),
    };
  }, [initialOwnedAccessories]);

  function handleEquip(accessoryOwnedId: string, slot: SlotName) {
    startTransition(async () => {
      await equipAccessoryAction({
        virtualPetId,
        accessoryOwnedId,
        slot,
      });
      router.refresh();
    });
  }

  function handleUnequip(slot: SlotName) {
    startTransition(async () => {
      await unequipAccessoryAction({
        virtualPetId,
        slot,
      });
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
      <section className="rounded-3xl border-4 border-[#FBF5D1] bg-[#eecc8e] p-6 inset-ring-4 inset-ring-[#FBF5D1]">
        <h2 className="text-4xl font-cherry text-[#163F55]">{petName}</h2>
        <p className="mb-6 text-lg text-[#163F55]">{petType}</p>

        <div className="rounded-3xl bg-[#FBF5D1] p-6">
          <div className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-3xl bg-white">
            <Image
              src={petModel}
              alt={petName}
              fill
              priority
              className="object-contain"
            />

            {initialEquippedAccessories.map((acc) => {
              const pos = slotMap[acc.accessory_type];

              return (
                <Image
                  key={acc.equipped_id}
                  src={acc.accessory_url}
                  alt={acc.accessory_name}
                  width={305}
                  height={200}
                  className="absolute object-contain"
                  style={{
                    left: pos?.x ?? 0,
                    top: pos?.y ?? 0,
                  }}
                />
              );
            })}
          </div>

          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-white p-3">
              <p className="text-[#163F55]">
                <strong>Head:</strong>{" "}
                {equippedBySlot.head?.accessory_name ?? "None"}
              </p>
              <button
                onClick={() => handleUnequip("head")}
                disabled={!equippedBySlot.head || isPending}
                className="rounded-xl bg-[#163F55] px-4 py-2 text-white disabled:opacity-50"
              >
                Unequip
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white p-3">
              <p className="text-[#163F55]">
                <strong>Chest:</strong>{" "}
                {equippedBySlot.chest?.accessory_name ?? "None"}
              </p>
              <button
                onClick={() => handleUnequip("chest")}
                disabled={!equippedBySlot.chest || isPending}
                className="rounded-xl bg-[#163F55] px-4 py-2 text-white disabled:opacity-50"
              >
                Unequip
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-4 border-[#FBF5D1] bg-[#eecc8e] p-6 inset-ring-4 inset-ring-[#FBF5D1]">
        <h2 className="mb-4 text-3xl font-cherry text-[#163F55]">
          Your Accessories
        </h2>

        <div className="grid gap-6">
          <div>
            <h3 className="mb-3 text-2xl font-cherry text-[#163F55]">
              Head Accessories
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {ownedBySlot.head.map((item) => {
                const isActive =
                  equippedBySlot.head?.accessory_owned_id === item.accessory_owned_id;

                return (
                  <button
                    key={item.accessory_owned_id}
                    onClick={() =>
                      handleEquip(item.accessory_owned_id, item.accessory_type)
                    }
                    disabled={isPending}
                    className={`rounded-2xl p-4 text-center shadow disabled:opacity-50 ${
                      isActive
                        ? "bg-[#dbeafe] ring-2 ring-[#163F55]"
                        : "bg-[#FBF5D1]"
                    }`}
                  >
                    <Image
                      src={item.accessory_url}
                      alt={item.accessory_name}
                      width={72}
                      height={72}
                      className="mx-auto"
                    />
                    <p className="mt-2 text-sm text-[#163F55]">
                      {item.accessory_name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-2xl font-cherry text-[#163F55]">
              Chest Accessories
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {ownedBySlot.chest.map((item) => {
                const isActive =
                  equippedBySlot.chest?.accessory_owned_id === item.accessory_owned_id;

                return (
                  <button
                    key={item.accessory_owned_id}
                    onClick={() =>
                      handleEquip(item.accessory_owned_id, item.accessory_type)
                    }
                    disabled={isPending}
                    className={`rounded-2xl p-4 text-center shadow disabled:opacity-50 ${
                      isActive
                        ? "bg-[#dbeafe] ring-2 ring-[#163F55]"
                        : "bg-[#FBF5D1]"
                    }`}
                  >
                    <Image
                      src={item.accessory_url}
                      alt={item.accessory_name}
                      width={72}
                      height={72}
                      className="mx-auto"
                    />
                    <p className="mt-2 text-sm text-[#163F55]">
                      {item.accessory_name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}