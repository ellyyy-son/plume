import { getUserArticles } from "./server";
import ArchiveList from "./client";
import Link from "next/link";


export default async function Archive() {
  const entries = await getUserArticles();

  return (
    <div className="flex flex-col gap-4">
      <ArchiveList entries={entries}/>
    </div>
  )
}
