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

      <header className="w-full bg-[#FBF5D1] px-[50px] py-[20px]">
        <h2 className="text-right text-[#163F55] text-5xl font-cherry">
          Inventory
        </h2>
      </header>

      <div className="flex grid-cols-4 gap-4 p-8 border-b-80 border-solid border-b-[#eecc8e] inset-ring-4 inset-ring-[#FBF5D1]">
        {accessories?.map((acc) => (
          <div key={acc.accessory_id}>
            <h1>{acc.accessory_name}</h1>
            <Image
              src={acc.accessory_url}
              alt={acc.accessory_name}
              width={80}
              height={80}
            />
          </div>
        ))}
      </div>

      <div className="flex grid-cols-4 gap-4 p-8 border-b-80 border-solid border-b-[#eecc8e] inset-ring-4 inset-ring-[#FBF5D1]">
        {accessories?.map((acc) => (
          <div key={acc.accessory_id}>
            <h1>{acc.accessory_name}</h1>
            <Image
              src={acc.accessory_url}
              alt={acc.accessory_name}
              width={80}
              height={80}
            />
          </div>
        ))}
      </div>

      <div className="flex grid-cols-4 gap-4 p-8 border-b-80 border-solid border-b-[#eecc8e] inset-ring-4 inset-ring-[#FBF5D1]">
        {accessories?.map((acc) => (
          <div key={acc.accessory_id}>
            <h1>{acc.accessory_name}</h1>
            <Image
              src={acc.accessory_url}
              alt={acc.accessory_name}
              width={80}
              height={80}
            />
          </div>
        ))}
      </div>
    </>
  );
}
