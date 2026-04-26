"use client";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function ArchiveList({ entries }: { entries: any[] }) {
  const [filter, setFilter] = useState("all");
  const now = new Date();

  // add formatted date for the entries
  const processedEntries = entries.map((entry) => {
    const date = new Date(entry.entry_creation);
    const formattedDate = date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return { ...entry, date, formattedDate };
  });

  const filtered = processedEntries.filter((entry) => {
    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return entry.date >= weekAgo;
    }

    if (filter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return entry.date >= monthAgo;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-4 -translate-y-10">
      <div className="flex gap-2 -translate-y-11.5 -translate-x-11.5 mb-2">
        <button
          onClick={() => setFilter("all")}
          className="hover:bg-[#fefdf8] font-delius font-bold bg-[#FBF5D1] py-2 px-10 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D]"
        >
          All
        </button>
        <button
          onClick={() => setFilter("week")}
          className="hover:bg-[#fefdf8] font-delius font-bold bg-[#FBF5D1] px-2 py-2 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D]"
        >
          This Week
        </button>
        <button
          onClick={() => setFilter("month")}
          className="hover:bg-[#fefdf8] font-delius font-bold bg-[#FBF5D1] px-2 py-2 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D]"
        >
          This Month
        </button>
      </div>
      <div className="flex flex-col gap-4 max-h-70 overflow-y-auto">
        {filtered.map((entry, index) => (
          <div key={entry.entry_id} className="font-delius">
            <Link
              href={`archive/${entry.entry_id}`}
              className="hover:text-[#163f5592] hover:font-black"
            >
              <h1 className="px-8">
                <strong>{entry.formattedDate}: </strong>{entry.entry_title}
              </h1>
            </Link>
            {index !== filtered.length - 1 && (
              <hr className="block my-3 w-full border-t-2 border-[#CCC38D]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}