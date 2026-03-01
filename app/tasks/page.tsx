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

function calculateExpPoints(tasks: TaskWithDifficulty[]) {
  let total = 0

  for (const task of tasks) {
    if (task.is_complete){
        const base = task.difficulty?.difficulty_expamount ?? 0
        if (task.completion_datetime && task.task_deadline){
            
            const completionDate = new Date(task.completion_datetime).getTime()
            const deadlineDate = new Date(task.task_deadline).getTime()
            const createdDate = new Date(task.created_at).getTime()
            
            const multiplier = completionDate - deadlineDate
            const guide = createdDate - deadlineDate

            total += base * 0.6

            if (guide * 0.25 >= multiplier) {
            total += base * 0.4
            } else if (guide * 0.50 >= multiplier) {
            total += base * 0.3
            } else if (guide * 0.75 >= multiplier) {
            total += base * 0.2
            }
        }
        else {
            total += base * 0.5
        }
    }
  }

  return total
}


export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string }>
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { filter } = await searchParams

  const { data: allTasks } = await supabase.from('task').select('*')

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

  let query = supabase.from('task').select('*')

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

  const tasksWithDifficulty = (allTasks ?? []).filter(task => task.is_complete)?.map(task => ({
    ...task,
    difficulty: difficulties?.find(d => d.difficulty_name === task.task_difficulty)
  }))

  const expPoints = calculateExpPoints(tasksWithDifficulty)

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
