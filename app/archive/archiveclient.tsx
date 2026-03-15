"use client";
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react";
import Link from "next/link";

export default function ArchiveList({ entries }) {
  const [filter, setFilter] = useState("all");

  const now = new Date();

  const filtered = entries.filter((entry) => {
    const date = new Date(entry.entry_creation);

    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }

    if (filter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return date >= monthAgo;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-4">

      <div className="flex gap-2">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("week")}>This Week</button>
        <button onClick={() => setFilter("month")}>This Month</button>
      </div>

      {filtered.map((entry) => (
        <div key={entry.entry_id}>
          <Link href={`archive/${entry.entry_id}`}>
            <h1>{entry.entry_title}</h1>
          </Link>
        </div>
      ))}

    </div>
  );
}