import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import TaskListClient from "./tasklistclient"

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


export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

    const { data: tasks } = await supabase.from('task').select('*')
    const { data: difficulties } = await supabase.from('difficulty').select('*')

    const completedTasks = tasks.filter(task => task.is_complete)
    const pendingTasks = tasks.filter(task => !task.is_complete)

    const tasksWithDifficulty = completedTasks?.map(task => ({
    ...task,
    difficulty: difficulties?.find(d => d.difficulty_name === task.task_difficulty)
    }))

    const expPoints = calculateExpPoints(tasksWithDifficulty)


  return (
    <div className='m-12 flex flex-col gap-8'>
      <div className='bg-white outline-[#ADD3EA] outline-4 p-4 rounded-2xl'>
        <h2 className='font-delius text-2xl'>EXP Points: {expPoints}</h2>
      </div>
      
      <div className='flex flex-col'>

        <div className='flex flex-row gap-8 ml-8'>
          <button className="font-delius p-4  bg-[#ADD3EA] rounded-xl font-bold">Weekly</button>
          <button className="font-delius p-4  bg-[#ADD3EA] rounded-xl font-bold">Daily</button>
        </div>

        <div className='flex flex-row gap-8'>
          <button className="font-delius p-4  bg-[#ADD3EA] rounded-xl font-bold">Weekly</button>
          <button className="font-delius p-4  bg-[#ADD3EA] rounded-xl font-bold">Daily</button>
        </div>

      </div>

      <br />
      <h2>Pending Tasks</h2>
      <TaskListClient tasks={pendingTasks} mode="pending" />
      <br />
      <h2>Completed Tasks</h2>
      <TaskListClient tasks={completedTasks} mode="completed" />
    </div>
  )
}
