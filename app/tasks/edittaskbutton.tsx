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
}

type Difficulty = {
  difficulty_name: string
  difficulty_expamount: number
}

type EditTaskButtonProps = {
    task: Task
    difficulties: Difficulty[]
}

export default function EditTaskButton({ task, difficulties }: EditTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(task.task_title)
  const [details, setDetails] = useState(task.task_details)
  const [difficulty, setDifficulty] = useState(task.task_difficulty)
  const [deadlineDate, setDeadlineDate] = useState(
    task.task_deadline?.split("T")[0] ?? ""
  )
  const [deadlineTime, setDeadlineTime] = useState(
    task.task_deadline?.split("T")[1]?.slice(0, 5) ?? ""
  )
  const [errorMsg, setErrorMsg] = useState("")

  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(){

    if (!title || !details || !difficulty ||  !deadlineDate || !deadlineTime) {
      setErrorMsg("Please fill in all fields")
      return
    }

    setErrorMsg("")

    const deadline = `${deadlineDate}T${deadlineTime}`


    const { error } = await supabase.from("task").update({
      task_title: title,
      task_details: details,
      task_difficulty: difficulty,
      task_deadline: deadline || null,
    }).eq("id", task.id)

    if (error) {
      setErrorMsg("Failed to add task: " + error.message)
      return
    }

    if (!error) {
      setIsOpen(false)
      setTitle("")
      setDetails("")
      setDifficulty("")
      setDeadlineTime("")
      router.refresh()
    }   
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-delius p-4 bg-[#ADD3EA] rounded-xl font-bold"
      >
        Edit Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 flex flex-col gap-4">
            {errorMsg && (
              <p className="text-red-500 text-sm">{errorMsg}</p>
            )}

            Task Name
            <input
              type="text"
              placeholder="Input name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded-lg p-2"
            />
            
            Details
            <textarea
              placeholder="Details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="border rounded-lg p-2"
            />

            Date
            <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="border rounded-lg p-2 flex-1"
              />
              Due Time
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="border rounded-lg p-2 flex-1"
              />
            
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="border rounded-lg p-2"
            >
              <option value="">Select difficulty</option>
              {difficulties.map((d) => (
                <option key={d.difficulty_name} value={d.difficulty_name}>
                  {d.difficulty_name}
                </option>
              ))}
            </select>
            
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 px-4 rounded-lg bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="p-2 px-4 rounded-lg bg-[#ADD3EA] font-bold"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}