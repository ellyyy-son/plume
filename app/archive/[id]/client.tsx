'use client'

import { deleteEntry } from "./server";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <button onClick={() => deleteEntry(id)} className="bg-[#ADD3EA] mx-95 p-1 rounded-2xl text-sm border-3 border-[#5e94b67d] z-999">
      Delete
    </button>
  );
}