import { startOfMonth, endOfMonth } from "date-fns"
import { createClient } from '@/utils/supabase/server'
import { getUserArticles } from "./server";
// import TaskListClient from "./tasklistclient"
import ArchiveFilter from "./archivefilter"
import ArchiveList from "./archiveclient";
import Link from "next/link";


export default async function Archive({
  searchParams 
    }: { 
  searchParams: Promise<{ filter?: string }>
    }) {
  const supabase = await createClient();
  const entries = await getUserArticles();
  const { filter } = await searchParams
  const { data: allEntries } = await supabase.from('entry').select('*')
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
  const startMonth = startOfMonth(now)
  const endMonth = endOfMonth(now)


  let query = supabase.from('entry').select('*')
  if (filter==='week'){
    query = query
      .gte('task_deadline', startOfToday.toISOString())  // WHERE deadline >= start_of_today
      .lt('task_deadline', endOfWeek.toISOString())   // AND deadline < end_of_today
  } else if (filter === 'month'){
    query = query
      .gte('task_deadline', startMonth.toISOString())
      .lt('task_deadline', endMonth.toISOString())
  }

  return (
    <div className="flex flex-col mx-16 mt-30">
      
      <div className='gap-8 bg-[#FBF5D1] p-4 rounded-b-lg rounded-e-lg border-4 border-[#CCC38D]'>
        <ArchiveList entries={entries}/>
      </div>
    </div>
  )
}
