import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import TaskListClient from "./tasklistclient"
import FilterButtons from "./filterbuttons"
import AddTaskButton from "./addtaskbutton"

type TaskWithDifficulty = {
  id: string
  is_complete: boolean
  completion_datetime: string | null
  task_deadline: string | null
  created_at: string
  task_difficulty: string
  difficulty?: {
    difficulty_name: string
    difficulty_expamount: number
  }
}


export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient(); 
  const { filter } = await searchParams
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("You must be signed in to view your tasks.")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("exp_amount")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error("Unable to load your profile progress.")
  }

  const { data: allTasks } = await supabase
    .from('task')
    .select('*')
    .eq('user_id', user.id)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

  let query = supabase
    .from('task')
    .select('*')
    .eq('user_id', user.id)

  if (filter === 'daily') {
    query = query
      .gte('task_deadline', startOfToday.toISOString())  // WHERE deadline >= start_of_today
      .lt('task_deadline', endOfToday.toISOString())     // AND deadline < end_of_today
  } else if (filter === 'week') {
    query = query
      .gte('task_deadline', startOfToday.toISOString())  // WHERE deadline >= start_of_today
      .lt('task_deadline', endOfWeek.toISOString())      // AND deadline < end_of_week
  } else if (filter === 'complete'){
    query = query
    .eq('is_complete', true)
  } else if (filter === 'pending'){
    query = query
    .eq('is_complete', false)
  }

  const { data: tasks } = await query
  const { data: difficulties } = await supabase.from('difficulty').select('*')
  const completedTasks = (tasks ?? []).filter(task => task.is_complete)
  const pendingTasks = (tasks ?? []).filter(task => !task.is_complete)
  const expPoints = profile?.exp_amount ?? 0

  return (
    <div className='m-12 ml-32 flex flex-col gap-8'>
      <div className='bg-white outline-[#ADD3EA] outline-4 p-4 rounded-2xl w-fit'>
        <h2 className='font-delius text-2xl'>EXP Points: {expPoints}</h2>
      </div>

      <div className='flex flex-col gap-8'>
        <AddTaskButton difficulties={difficulties ?? []} />
      </div>

      
      <div className='flex flex-col gap-8'>
        <FilterButtons currentFilter={filter} />

        <div className='flex flex-col items-center justify-center bg-[#CCC38D] rounded-2xl w-full'>
          <p className='font-cherry text-5xl text-center p-12'>
            {filter === 'daily' ? "Today's Tasks" : filter === 'week' ? "This Week's Tasks" : "All Tasks"}
          </p>
          {tasks && tasks.length > 0 ? (
            <div className='flex flex-col bg-[#FBF5D1] font-delius p-8 rounded-b-2xl w-full'>
              {filter !== 'complete' && (
                <div>
                <h2>Pending Tasks</h2>
                <TaskListClient tasks={pendingTasks} mode="pending" difficulties={difficulties ?? []} />
                </div>
              )}

              {filter !== 'pending' &&(
               <div>
                <h2>Completed Tasks</h2>
                <TaskListClient tasks={completedTasks} mode="completed" difficulties={difficulties ?? []} />
              </div> 
              )}
            </div>
          ) : (
            <div className='flex flex-col bg-[#FBF5D1] font-delius p-10 rounded-b-2xl w-full'>
              <p>No tasks available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
