"use client"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react";
import Image from "next/image";

type Accessory = {
  accessory_id: string;
  accessory_name: string;
  accessory_rarity: string;
  accessory_type: string;
  accessory_description: string;
  accessory_exp: number;
  accessory_url: string;
};

const rarity: Record<string, { bg: string; text: string; border: string }> = {
  Common:   { bg: "bg-[#D0E8F7]", text: "text-[#163F55]", border: "border-2 border-[#ADD3EA]" },
  Rare:     { bg: "bg-[#FFEDF5]", text: "text-[#E37FAA]", border: "border-2 border-[#F0B6CF]" },
  Epic:     { bg: "bg-yellow-200", text: "text-yellow-800", border: "border-2 border-yellow-400" },
};

export default function ModalWithTrigger({ acc,  isOwned, }: { acc: Accessory; isOwned: boolean;}) {

  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient()
  const router = useRouter()

  async function purchaseItem(accessory: Accessory) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return

    const { data: profileRows } = await supabase
      .from("profile")
      .select("exp_amount")
      .eq("user_id", user.id)

    const currentExp = Number(profileRows?.[0]?.exp_amount ?? 0)

    // bro can afford it
    if (currentExp >= accessory.accessory_exp){
      // add to owned accessories
      const accessoryUpdate = await supabase.from("accessory_owned").insert({
        accessory_id: accessory.accessory_id,
        user_id: user.id,
      })

      if (accessoryUpdate.error) {
        return
      }

      // deduct exp
      const newExp = currentExp - accessory.accessory_exp
      const profileUpdate = await supabase
        .from("profile")
        .update({ exp_amount: newExp })
        .eq("user_id", user.id)

      if (profileUpdate.error) {
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
        className="hover:font-black -translate-y-5 w-full place-self-center px-10"
      >
        Details
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">

          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(30, 18, 5, 0.72)", backdropFilter: "blur(4px)" }}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Panel */}
          <div
            className="relative z-10 w-[90vw] max-w-2xl rounded-3xl p-8 shadow-2xl"
            style={{
              backgroundColor: "#FBF5D1",
              border: "4px solid #c08350",
              animation: "popIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            {/* Decorative corner dots */}
            <span className="absolute top-4 left-4 w-3 h-3 rounded-full bg-[#c08350] opacity-60" />
            <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#c08350] opacity-60" />
            <span className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-[#c08350] opacity-60" />
            <span className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-[#c08350] opacity-60" />

            {/* Header */}
            <div className="text-center mb-6">
              <div className={`inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 
                  ${rarity[acc.accessory_rarity]?.bg} 
                  ${rarity[acc.accessory_rarity]?.text} 
                  ${rarity[acc.accessory_rarity]?.border}`}
            >
              {acc.accessory_rarity}
            </div>

              <h2
                className="text-3xl font-black font-cherry text-[#2E2805] leading-tight"
              >
                { acc.accessory_name }
              </h2>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-[#c08350] mb-6" />

            {/* Content area */}
            <div className="flex gap-6 items-start">
              {/* Image placeholder */}
              <div
                className={`shrink-0 w-32 h-32 rounded-2xl flex items-center justify-center text-4xl border-4 border-[#c08350]
                ${rarity[acc.accessory_rarity]?.bg} `}
 
              >
                <Image src={acc.accessory_url} alt={acc.accessory_name} width={80} height={80} className="place-self-center"
                />
            </div>

              {/* Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#c08350] mb-1">Description</p>
                  <p className="text-sm text-[#3b3210] leading-relaxed">
                    {acc.accessory_description}
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <div
                    className="px-4 py-2 rounded-xl text-sm font-black"
                    style={{ backgroundColor: "#e8dfc0", border: "2px solid #c08350", color: "#5a4a10" }}
                  >
                    Type: {acc.accessory_type}
                  </div>
                  <div
                    className="px-4 py-2 rounded-xl text-sm font-black flex items-center gap-1"
                    style={{ backgroundColor: "#ADD3EA", border: "2px solid #4a80e0", color: "#1a3e8c" }}
                  >
                    {isOwned ? "Owned" : `⭐ ${acc.accessory_exp}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer button */}
            <div className="mt-8 flex justify-center gap-4">
              
              {!isOwned && (<button
                  onClick={() => {purchaseItem(acc)}}
                  className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-colors block"
                  style={{ backgroundColor: "#c08350", color: "#FBF5D1", border: "3px solid #8b5c30" }}
                >
                  Buy
                </button>
                )
              }
            

              <button
                onClick={() => setIsOpen(false)}
                className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-colors hidden md:block"
                style={{ backgroundColor: "#c08350", color: "#FBF5D1", border: "3px solid #8b5c30" }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = "#8b5c30")}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = "#c08350")}
              >
                Close
              </button>
            </div>
          </div>

          <style>{`
            @keyframes popIn {
              from { transform: scale(0.75) translateY(20px); opacity: 0; }
              to   { transform: scale(1)    translateY(0);    opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}