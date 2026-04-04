import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import { cookies } from "next/headers";
import BodyBackground from "./body_background";


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


export default async function Shop() {
  const accessories = await getAccessories();
  return (
    <>
       <BodyBackground style="repeating-linear-gradient(90deg, #c08350 0px, #c08350 40px, #f0c09a 40px, #f0c09a 80px)" />

      <header className="w-full bg-[#FBF5D1] px-12 py-10">
        <h2 className="text-right text-[#2E2805] text-5xl font-cherry">
          Inventory
        </h2>
      </header>

      <div className="grid grid-cols-4 inset-ring-4 inset-ring-[#FBF5D1] font-delius w-full border-b-180 border-[#FBF5D1] text-[#2E2805]">
          {accessories?.map((acc, index) => (
            <>
            <div className="flex flex-col gap-10 translate-y-14 items-center justify0center">
              <div className="bg-[#ADD3EA] pt-4 px-4 rounded-t-xl border-t-4 border-x-4 border-[#FBF5D1] w-40 h-35 translate-y-4">
                <h1 className="font-black text-center">{acc.accessory_name}</h1>
                <Image
                  src={acc.accessory_url}
                  alt={acc.accessory_name}
                  width={80}
                  height={80}
                  className="place-self-center"
                />
                {/* price */}
              </div>
              <div className="z-15 bg-[#FBF5D1] px-5 border-4 border-white rounded-2xl shadow-md">
                  <h4 className="font-bold">{ acc.accessory_exp }</h4>
                </div>
              </div>

          {(index + 1) % 4 === 0 && (
            <>
            <div className="col-span-4 border-b-100 border-[#EFE8C1] shadow-md"></div>
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
