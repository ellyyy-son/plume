"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Task = {
  id: number
  task_title: string
  task_details: string
  task_difficulty: string
  task_deadline: string | null
  completion_datetime: string
  is_complete: boolean
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString))
}

function getDeadlineMessage(dateString: string) {
  const diffMs = new Date(dateString).getTime() - Date.now()

  if (diffMs <= 0) return <p style={{ color: "red" }}>Overdue</p>

  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const remainingMinutesAfterDays = totalMinutes % (60 * 24)
  const hours = Math.floor(remainingMinutesAfterDays / 60)
  const minutes = remainingMinutesAfterDays % 60

  return (
    <p>
      {days > 0 && `${days}d `}
      {hours > 0 && `${hours}h `}
      {minutes}m left
    </p>
  )
}

type TaskListClientProps = {
  tasks: Task[]
  mode: "pending" | "completed"
}

export default function TaskListClient({
  tasks,
  mode,
}: TaskListClientProps) {
  const supabase = createClient()
  const router = useRouter()

  async function updateTaskStatus(id: number, isComplete: boolean) {
    const { error } = await supabase
      .from("task")
      .update({
        is_complete: isComplete,
        completion_datetime: isComplete ? new Date().toISOString() : null,
      })
      .eq("id", id)

    if (error) return
    router.refresh()
  }

    return (
    <ul>
        {tasks.map((task) => (
        <li key={task.id}>
            <strong style={{ marginRight: "48px" }}>{task.task_title}</strong>
            {" "}Difficulty: {task.task_difficulty}
            <p>{task.task_details}</p>

            {mode === "pending" && task.task_deadline && (
            <div>
                <p>Due: {formatDate(task.task_deadline)}</p>
                {getDeadlineMessage(task.task_deadline)}
            </div>
            )}

            {mode === "completed" && (
                <p>Date Completed: {formatDate(task.completion_datetime)}</p>
            )}
            
            <p><button onClick={() => updateTaskStatus(task.id, mode === "pending")}>
                {mode === "pending" ? "Mark as Completed" : "Mark as Incomplete"}
            </button></p>
            <br />
        </li>
        ))}
    </ul>
    )
}



// export default function TaskListClient({
//   pendingTasks,
// }: {
//   pendingTasks: Task[]
// }) {
//   const supabase = createClient()
//   const router = useRouter()

//     async function updateTaskStatus(id: number, isComplete: boolean) {
//     const { error } = await supabase
//         .from("task")
//         .update({
//         is_complete: isComplete,
//         completion_datetime: isComplete ? new Date().toISOString() : null,
//         })
//         .eq("id", id)

//     if (error) { /* set error state */ return }
//     router.refresh()
//     }


//   return (
//     <ul>
//       {pendingTasks.map((task) => (
//         <li key={task.id}>
//         <strong style={{ marginRight: "48px" }}>{task.task_title}</strong>
//         {" "}Difficulty: {task.task_difficulty}

//         <p>{task.task_details}</p>
//         {task.task_deadline && (
//             <div>
//             <p>Due: {formatDate(task.task_deadline)}</p>
//             {getDeadlineMessage(task.task_deadline)}
//             </div>
//         )}
//         <p>
//             <button
//               onClick={() => updateTaskStatus(task.id, true)}
//             >
//               Mark as Completed
//             </button>
//         </p>
//         <p>{String(task.is_complete)}</p>
//         <br />
//         </li>
//     ))}
//     </ul>
//   )
// }
