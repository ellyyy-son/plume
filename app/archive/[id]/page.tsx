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
    <div className="flex flex-col gap-4">
      <h1>{entry.entry_title}</h1>
      <h1>{entry.entry_text}</h1>
      <DeleteButton id={id}/>
    </div>
  );
}
