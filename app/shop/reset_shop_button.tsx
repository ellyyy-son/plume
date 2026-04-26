"use client";
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react";

export default function ResetShopButton({ userexp }: { userexp: number | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const canAfford = (userexp ?? 0) >= 1000
  const supabase = createClient()
  const router = useRouter()

  async function resetShop(){
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return

    if (canAfford){

    

    let rolledAccessories = [];

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
          rolledAccessories.push(commonAccessories[chosenIndex])
          commonAccessories.splice(chosenIndex, 1)
      } else if(roll <= 90 && rareAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * rareAccessories.length)
          rolledAccessories.push(rareAccessories[chosenIndex])
          rareAccessories.splice(chosenIndex, 1)
      } else if (epicAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * epicAccessories.length)
          rolledAccessories.push(epicAccessories[chosenIndex])
          epicAccessories.splice(chosenIndex, 1)
      }
    }

    // top 2 items. 70% rare chance, 25% epic chance, 5% common chance
    for (let i = 0; i < 2; i++){

      const roll = Math.floor(Math.random() * 100) + 1
      if(roll <= 5 && commonAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * commonAccessories.length)
          rolledAccessories.push(commonAccessories[chosenIndex])
          commonAccessories.splice(chosenIndex, 1)
      } else if(roll <= 75 && rareAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * rareAccessories.length)
          rolledAccessories.push(rareAccessories[chosenIndex])
          rareAccessories.splice(chosenIndex, 1)
      } else if (epicAccessories.length > 0){
        let chosenIndex = Math.floor(Math.random() * epicAccessories.length)
          rolledAccessories.push(epicAccessories[chosenIndex])
          epicAccessories.splice(chosenIndex, 1)
      }
    }

    const rolledRows = rolledAccessories.map(accessory => ({
      shop_date: todayInManila,
      accessory_id: accessory.accessory_id,
      user_id: user.id
    }))

    const { data: checker } = await supabase
      .from("daily_shop")
      .select("*")
      .eq("shop_date", todayInManila)
      .eq("user_id", user.id);

    if (checker.length > 0) {
      const { error } = await supabase
        .from("daily_shop")
        .delete()
        .eq("shop_date", todayInManila)
        .eq("user_id", user.id);
        if (error) {
        console.error(error.message);
        return [];
      }
    }


    const { error } = await supabase
      .from("daily_shop")
      .insert(rolledRows);

    if (error) {
      console.error(error.message);
      return [];
    }




    const { data: profileRows } = await supabase
      .from("profile")
      .select("exp_amount")
      .eq("user_id", user.id)

    const currentExp = Number(profileRows?.[0]?.exp_amount ?? 0)

      // deduct exp
    const newExp = currentExp - 1000
    const profileUpdate = await supabase
      .from("profile")
      .update({ exp_amount: newExp })
      .eq("user_id", user.id)   

    if(profileUpdate.error){
      return
    }
    
    setIsOpen(false)
    router.refresh()
  }
}

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-2xl border-4 border-[#D7B87F] bg-[#FBF5D1] px-6 py-3 font-delius text-lg font-bold text-[#2E2805] shadow-md transition-transform hover:scale-[1.02] whitespace-nowrap"
      >
        Reset Shop - 1000 EXP
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 w-[90vw] max-w-md rounded-3xl border-4 border-[#D7B87F] bg-[#FBF5D1] p-7 shadow-2xl">
            <h3 className="text-center font-cherry text-3xl text-[#2E2805]">
              {canAfford ? "Reset Shop?" : "You do not have enough EXP"}
            </h3>

            <p className="mt-4 text-center font-delius text-lg leading-snug text-[#2E2805]">
              {canAfford ? (
                <>
                  This will reroll today&apos;s shop for <span className="font-bold">1000 EXP</span>.
                </>
              ) : (
                <>
                  You need <span className="font-bold">1000 EXP</span> to reset the shop.
                </>
              )}
            </p>

            <p className="mt-2 text-center font-delius text-base text-[#6B5622]">
              Current EXP: {userexp}
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-2xl border-4 border-[#D7B87F] bg-white px-5 py-2 font-delius font-bold text-[#2E2805] shadow-sm"
              >
                {canAfford ? "Cancel" : "Close"}
              </button>

              {canAfford && (
                <button
                  onClick={() => resetShop()}
                  className="rounded-2xl border-4 border-[#D7B87F] bg-[#F5E8A0] px-5 py-2 font-delius font-bold text-[#2E2805] shadow-sm"
                >
                  Confirm Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
