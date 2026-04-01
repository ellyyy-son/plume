"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Difficulty = {
  difficulty_name: string
  difficulty_expamount: number
}

type AddTaskButtonProps = {
  difficulties: Difficulty[]
}

export default function AddTaskButton({ difficulties }: AddTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [deadlineDate, setDeadlineDate] = useState("")
  const [deadlineTime, setDeadlineTime] = useState("")
  const [errorMsg, setErrorMsg] = useState("")  
  
  const supabase = createClient()
  const router = useRouter()

  const today = new Date().toISOString().slice(0, 10)

  async function handleSubmit() {

    if (!title || !details || !difficulty ||  !deadlineDate || !deadlineTime) {
      setErrorMsg("Please fill in all fields")
      return
    }

    setErrorMsg("")

    const deadline = `${deadlineDate}T${deadlineTime}`
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setErrorMsg("Unable to add task. Please sign in again.")
      return
    }

    const { error } = await supabase.from("task").insert({
      task_title: title,
      task_details: details,
      task_difficulty: difficulty,
      task_deadline: deadline || null,
      user_id: user.id,
      is_complete: false,
    })

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
        + Add Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 font-delius">
          <div className="bg-white rounded-2xl border-5 border-[#F0B6CF] p-8 w-96 flex flex-col gap-4">
            {errorMsg && (
              <p className="text-red-500 text-sm">{errorMsg}</p>
            )}

            <h4 className="font-bold text-lg">TASK NAME</h4>
            <input
              type="text"
              placeholder="Input name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded-lg p-2"
            />
            
            <h4 className="font-bold text-lg">DETAILS</h4>
            <textarea
              placeholder="Details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="border rounded-lg p-2"
            />

            <div className="flex gap-3">
              <div>
                <h4 className="font-bold text-lg">DATE</h4>
                <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    min={today}
                    className="border rounded-lg p-2 mt-3 flex-1"/>
              </div>
              <div>
                <h4 className="font-bold text-lg">DUE TIME</h4>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="border rounded-lg p-2 mt-3 flex-1"/>
              </div>
            </div>
            
            <h4 className="font-bold text-lg">DIFFICULTY</h4>
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
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
