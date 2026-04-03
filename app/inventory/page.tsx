import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import { cookies } from "next/headers";
import BodyBackground from "./body_background";


export async function getUserAccessories() {

  'use server'

  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("No user logged in");
    return;
  }

  console.log(user.id)

  const { data: ownedAccessories, error: ownedError } = await supabase
    .from("accessory_owned")
    .select("accessory_id")
    .eq("user_id", user.id);

  if (ownedError) {
    console.error(ownedError.message);
    return;
  }

  console.log(ownedAccessories)
  const accessoryIds = ownedAccessories.map(a => a.accessory_id);

  const { data: accessories, error: accessoryError } = await supabase
    .from("accessory")
    .select("*")
    .in("accessory_id", accessoryIds);

  if (accessoryError) {
    console.error(accessoryError.message);
    return;
  }

  console.log(accessories)
  return accessories;
}

export default async function Inventory() {
  const accessories = await getUserAccessories();
  return (
    <>
       <BodyBackground style="repeating-linear-gradient(90deg, #c08350 0px, #c08350 40px, #f0c09a 40px, #f0c09a 80px)" />

      <header className="w-full bg-[#FBF5D1] px-12 py-10">
        <h2 className="text-right text-[#2E2805] text-5xl font-cherry">
          Inventory
        </h2>
      </header>

      <div className="grid grid-cols-4 inset-ring-4 inset-ring-[#FBF5D1] font-delius w-full border-b-180 border-[#FBF5D1]">
          {accessories?.map((acc, index) => (
            <>
              <div className="bg-[#ADD3EA] pt-4 px-4 mt-5 rounded-xl border-4 border-[#FBF5D1] w-40 translate-y-4 -z-4 justify-self-center">
                <h1 className="font-black text-center">{acc.accessory_name}</h1>
                <Image
                  src={acc.accessory_url}
                  alt={acc.accessory_name}
                  width={80}
                  height={80}
                  className="place-self-center"
                />
              </div>

          {(index + 1) % 4 === 0 && (
            <>
            <div className="col-span-4 border-b-100 border-[#EFE8C1]"></div>
            <div className="col-span-4 border-b-50 border-[#FBF5D1]"></div>
            </>
          )}
            </>
          ))}
          <div className="col-span-4 border-b-100 border-[#EFE8C1]"></div>
            <div className="col-span-4 border-b-50 border-[#FBF5D1]"></div>
        </div>  
    </>
  );
}
