import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import BodyBackground from "./body_background";
import ModalWithTrigger from "./shop_modal";
import ResetTimer from "./reset_timer"

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

export async function getAccessories() {

  'use server'

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: accessories, error } = await supabase
    .from("accessory")
    .select("*");

  if (error) {
    console.error(error.message);
    return [];
  }

  return accessories;
}

export async function getDailyShop() {
  'use server'
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const todayInManila = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())

  const { data: dailyShop, error } = await supabase
  .from("daily_shop")
  .select("accessory_id")
  .eq("shop_date", todayInManila);

  if (error) {
    console.error(error.message);
    return [];
  }

  return dailyShop;
}

export async function getShopAccessories(){
  'use server'
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const dailyShop = await getDailyShop() ?? [];

  let currAccessories = [];

  // add to the database + random logic
  if(dailyShop.length === 0){

    const { data: commonAccessories } = await supabase
      .from("accessory")
      .select("*")
      .eq("accessory_rarity", "Common");

    if (!commonAccessories) {
      return [];
    }
    
    const { data: rareAccessories } = await supabase
      .from("accessory")
      .select("*")
      .eq("accessory_rarity", "Rare");

    if (!rareAccessories) {
      return [];
    }

    const { data: epicAccessories } = await supabase
      .from("accessory")
      .select("*")
      .eq("accessory_rarity", "Epic");

    if (!epicAccessories) {
      return [];
    }
    
    const todayInManila = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())

    // 60% common chance, 30% rare chance, 10% epic chance
    for (let i = 0; i < 8; i++){
      // generate number from 1 to 100
      const roll = Math.floor(Math.random() * 100) + 1
      if(roll <= 60 && commonAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * commonAccessories.length)
          currAccessories.push(commonAccessories[chosenIndex])
          commonAccessories.splice(chosenIndex, 1)
      } else if(roll <= 90 && rareAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * rareAccessories.length)
          currAccessories.push(rareAccessories[chosenIndex])
          rareAccessories.splice(chosenIndex, 1)
      } else if (epicAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * epicAccessories.length)
          currAccessories.push(epicAccessories[chosenIndex])
          epicAccessories.splice(chosenIndex, 1)
      }
    }

    // top 2 items. 70% rare chance, 25% epic chance, 5% common chance
    for (let i = 0; i < 2; i++){

      const roll = Math.floor(Math.random() * 100) + 1
      if(roll <= 5 && commonAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * commonAccessories.length)
          currAccessories.push(commonAccessories[chosenIndex])
          commonAccessories.splice(chosenIndex, 1)
      } else if(roll <= 75 && rareAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * rareAccessories.length)
          currAccessories.push(rareAccessories[chosenIndex])
          rareAccessories.splice(chosenIndex, 1)
      } else if (epicAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * epicAccessories.length)
          currAccessories.push(epicAccessories[chosenIndex])
          epicAccessories.splice(chosenIndex, 1)
      }
    }

    const dailyShopRows = currAccessories.map(accessory => ({
      shop_date: todayInManila,
      accessory_id: accessory.accessory_id,
    }))

    const { error } = await supabase
      .from("daily_shop")
      .insert(dailyShopRows);

    if (error) {
      console.error(error.message);
      return [];
    }

    return currAccessories;

  } else {
    const { data : dailyAccessories, error } = await supabase
      .from("accessory")
      .select("*")
      .in("accessory_id", dailyShop.map(a => a.accessory_id))
    
    if (error || !dailyAccessories) {
      return [];
    }

    return dailyAccessories;
  }

}

export async function getOwnedAccesoriesID(){
  'use server'
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return

  const { data: ownedAccessories, error } = await supabase
    .from("accessory_owned")
    .select("accessory_id")
    .eq("user_id", user.id);

  if(error){
    return;
  }

  return ownedAccessories;
}

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
    <div className="p-6 bg-linear-to-b to-[#EF87BE] from-[#FFCEE6] flex flex-col col-span-2 ms-20 items-center h-55 shadow-lg border-5 border-[#F0B6CF]">
        <Image src={character.pet.pet_model} alt={character.pet.pet_type} width={200} height={200} className="-translate-y-3.5" />
    </div>
  );
}

export async function getUserExp() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profile")
    .select("exp_amount")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error(error.message);
    return null;
  }

  return data?.exp_amount ?? 0;
}


export default async function Shop() {
  const accessories = await getShopAccessories();
  const character = getCharacterSummary();
  const userexp = await getUserExp();
  const ownedAccessories = await getOwnedAccesoriesID() ?? []
  const ownedSet = new Set(ownedAccessories.map(a => a.accessory_id))
  const rarityOrder: Record<string, number> = {
    Epic: 0,
    Rare: 1,
    Common: 2,
  };
  const sortedAccessories = [...accessories].sort(
    (a, b) => (rarityOrder[a.accessory_rarity] ?? 99) - (rarityOrder[b.accessory_rarity] ?? 99)
  )
  
  const divideIntoRows = <T,>(arr: T[]): T[][] => {
  if (arr.length <= 2) return [arr];
  return [arr.slice(0, 2), ...Array.from({ length: Math.ceil((arr.length - 2) / 4) }, (_, i) =>
    arr.slice(2 + i * 4, 2 + i * 4 + 4)
  )];
};

const rows = divideIntoRows(sortedAccessories);
  const rarity: Record<string, { bg: string; text: string }> = {
    Common:   { bg: "bg-[#D0E8F7]", text: "text-[#163F55]" },
    Rare:     { bg: "bg-[#FFEDF5]", text: "text-[#E37FAA]" },
    Epic:     { bg: "bg-yellow-200", text: "text-yellow-800" },
  };

return (
    <>
       <BodyBackground style="repeating-linear-gradient(90deg, #c08350 0px, #c08350 40px, #f0c09a 40px, #f0c09a 80px)" />

      <header className="flex w-full justify-between bg-[#FBF5D1] py-5 px-15">
        <div className="flex items-center gap-4">
        <div className="flex justify-center items-center bg-[#F5E8A0] border-4 border-[#D7B87F] rounded-2xl w-45 h-15 self-center shadow-md">
          <h2 className="text-right text-[#2E2805] text-5xl font-cherry">
            <p className="font-delius text-2xl font-bold text-[#2E2805]">
              { userexp } EXP
            </p>
          </h2>
      </div>
      <ResetTimer />
      </div>
        <div className="flex justify-center place-items-center bg-[#F5E8A0] border-4 border-[#D7B87F] rounded-2xl w-55 px-20 py-5 me-15 translate-y-12 z-25 justify-self-end shadow-md">
          <h2 className="text-right text-[#2E2805] text-6xl font-cherry">
          SHOP
        </h2>
        </div>
      </header>

      <div className="flex flex-col py-1 inset-ring-4 inset-ring-[#FBF5D1] font-delius w-full border-b-180 border-[#FBF5D1]">
      {rows.map((group, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4">
          {group.map((acc) => {
            const isOwned = ownedSet.has(acc.accessory_id);          
             return (
                <div
                  key={acc.accessory_id}
                  className={` pt-4 px-4 mt-5 rounded-t-xl border-x-4 border-t-4 border-[#FBF5D1] h-50 w-50 justify-self-center
                    ${rarity[acc.accessory_rarity]?.bg} 
                      ${rarity[acc.accessory_rarity]?.text}`}
                >
                  <h1 className="font-black text-center h-14 text-xs sm:text-sm md:text-base leading-tight break-words overflow-hidden px-1">
                    {acc.accessory_name}
                  </h1>

                  <Image
                    src={acc.accessory_url}
                    alt={acc.accessory_name}
                    width={80}
                    height={80}
                    className="place-self-center h-25 w-25"
                  />

                  <ModalWithTrigger acc={acc} isOwned={isOwned} />

                  <div className="bg-[#FBF5D1] px-5 mt-4 border-4 border-white rounded-2xl shadow-md">
                      <h4 className="font-bold">{ isOwned ? "OWNED" : acc.accessory_exp }</h4>
                    </div>
                  
                </div>
                
              )
            }
          
          )}
           {rowIndex === 0 && (
            <>
            <CharacterPanel getCharacter={character}/>
            </>)}

          {rowIndex < rows.length - 1 && (
            <>
              <div className="col-span-4 border-b-100 border-[#EFE8C1] -z-1" />
              <div className="col-span-4 border-b-50 border-[#FBF5D1] shadow-md" />
            </>
          )}
        </div>
      ))}
    </div>
    </>
  );
}
