"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Pet = {
  pet_id: number;
  pet_type: string;
  pet_model: string;
};

// Root page component where users pick a pet and name it.
export default function PetSelectionPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petName, setPetName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popupStatus, setPopupStatus] = useState("");
  const [pageStatus, setPageStatus] = useState("Loading pets...");

  // Loads all pets from the database and keeps them in ascending pet_id order.
  useEffect(() => {
    async function loadPets() {
      setLoading(true);
      const { data, error } = await supabase
        .from("pet")
        .select("pet_id, pet_type, pet_model")
        .order("pet_id", { ascending: true });

      if (error) {
        console.error("Failed to load pets:", error.message);
        setPageStatus("Unable to load pets right now. Please try again.");
        setLoading(false);
        return;
      }

      setPets((data as Pet[]) || []);
      setPageStatus("");
      setLoading(false);
    }

    loadPets();
  }, [supabase]);

  // Opens the confirmation modal for the selected pet.
  function openPetModal(pet: Pet) {
    setSelectedPet(pet);
    setPetName("");
    setPopupStatus("");
    setPageStatus("");
  }

  // Closes the modal and resets local modal state.
  function closePetModal() {
    setSelectedPet(null);
    setPetName("");
    setPopupStatus("");
    setPageStatus("");
    setSubmitting(false);
  }

  // Creates the user_pet row, sets profile.virtual_petid, then redirects to home.
  async function confirmPetSelection() {
    if (!selectedPet) return;

    const trimmedName = petName.trim();
    if (!trimmedName) {
      setPopupStatus("Please name your pet before confirming.");
      return;
    }

    setSubmitting(true);
    setPopupStatus("Saving your choice...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSubmitting(false);
      setPopupStatus("Could not verify your session. Please log in and try again.");
      return;
    }

    const { data: profileRows, error: profileError } = await supabase
      .from("profile")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const profileUserId = profileRows?.user_id;

    const { data: createdVirtualPet, error: userPetError } = await supabase
      .from("user_pet")
      .insert({
        user_id: profileUserId,
        pet_id: selectedPet.pet_id,
        mood_id: 1,
        pet_name: trimmedName,
      })
      .select("virtual_petid")
      .single();

    if (profileError || !profileUserId || userPetError || !createdVirtualPet?.virtual_petid) {
      setSubmitting(false);
      setPopupStatus("Could not save your pet selection. Please try again.");
      return;
    }

    const { error: virtualPetError } = await supabase
      .from("profile")
      .update({ virtual_petid: createdVirtualPet.virtual_petid })
      .eq("user_id", user.id);

    if (virtualPetError) {
      setSubmitting(false);
      setPopupStatus("Could not link your pet to this account. Please try again.");
      return;
    }

    setPopupStatus("Pet saved. Redirecting...");
    setSubmitting(false);
    closePetModal();
    router.push("/");
  }

  return (
    <div className={"bg-[#FBF5D1] border-5 border-[#E4DCAB] grid grid-template-rows-2 h-150 w-250 pt-10 px-10 pb-20 rounded-4xl justify-items-center shadow-xl/40 overflow-hidden"}>
      <h1 className="font-cherry text-[#2E2805] text-6xl pb-10">CHOOSE YOUR PET</h1>
      <p className="font-delius text-3xl text-[#2E2805] pb-6">Before you proceed.</p>
      {pageStatus && <p className="font-delius text-base text-[#2E2805]">{pageStatus}</p>}

      <div className="flex gap-15 justify-center bg-[#fef5ffbb] py-6 rounded-4xl shadow-lg">
        {loading && pets.length === 0 && <p className="font-delius text-[#2E2805]">Loading...</p>}

        {!loading &&
          pets.map((pet) => (
            <button
              key={pet.pet_id}
              onClick={() => openPetModal(pet)}
              className="grid grid-template-rows-2 place-items-center gap-8 bg-transparent border-none cursor-pointer"
              type="button"
            >
              <Image src={pet.pet_model} width={200} height={200} alt={pet.pet_type} />
              <h3 className="font-delius text-3xl">{pet.pet_type}</h3>
            </button>
          ))}
      </div>

      {selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm bg-white border border-[#E4DCAB] rounded-3xl p-5 shadow-xl">
            <button
              onClick={closePetModal}
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full bg-[#F0B6CF] px-3 py-1 font-delius"
            >
              X
            </button>

            <div className="grid gap-4">
              <h2 className="font-cherry text-3xl text-[#2E2805]">Confirm your choice</h2>
              <p className="font-delius text-xl text-[#2E2805]">
                You selected {selectedPet.pet_type}
              </p>
              <Image src={selectedPet.pet_model} width={180} height={180} alt={selectedPet.pet_type} />
              <label htmlFor="pet-name" className="font-delius text-xl text-[#2E2805]">
                Name your pet
              </label>
              <input
                id="pet-name"
                value={petName}
                onChange={(event) => setPetName(event.target.value)}
                placeholder="Type a name"
                className="rounded-md border-2 border-[#E4DCAB] px-3 py-2 font-delius"
              />
              {popupStatus && <p className="font-delius text-base text-[#2E2805]">{popupStatus}</p>}
              <button
                onClick={confirmPetSelection}
                type="button"
                disabled={submitting}
                className="rounded-xl bg-[#ADD3EA] px-6 py-2 font-delius text-[#524601] disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

