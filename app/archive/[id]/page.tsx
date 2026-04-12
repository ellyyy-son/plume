import { createClient } from "@/utils/supabase/server";
import { redirect } from 'next/navigation';
import Link from "next/link";
import DeleteButton from "./client";
import { getEntry } from "./server";

export default async function Entry({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
  const entry = await getEntry(id);

  if (!entry) {
    return <div>Entry not found</div>;
  }

  return (
    <div className="flex flex-col px-15 py-20 font-delius">
      <h1
          className="font-cherry font-black text-4xl bg-[#CCC38D] text-center py-2 px-10 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D] shadow-md"
        >
          {entry.entry_title}
        </h1>
      <div className="flex flex-col gap-6 bg-[#FBF5D1] py-5 px-10 rounded-b-xl border-4 border-[#CCC38D] shadow-md">
        <div className="overflow-y-auto max-h-70 bg-white rounded-xl p-5">
          <h1>{entry.entry_text}</h1>
        </div>
        <DeleteButton id={id}/>
      </div>
    </div>
  );
}
