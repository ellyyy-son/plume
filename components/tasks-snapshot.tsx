"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Task = {
  id: number;
  task_title: string;
  task_difficulty: string;
  task_deadline: string | null;
  created_at: string;
  completion_datetime: string | null;
  is_complete: boolean;
};

type Difficulty = {
  difficulty_name: string;
  difficulty_expamount: number;
};

function calculateExpReward(task: Task, difficultyExpAmount: number, completionDate: string): number {
  const base = difficultyExpAmount;
  if (!base) return 0;
  if (task.completion_datetime && task.task_deadline) {
    const actual = new Date(completionDate).getTime();
    const deadline = new Date(task.task_deadline).getTime();
    const created = new Date(task.created_at).getTime();
    const multiplier = actual - deadline;
    const guide = created - deadline;
    let total = base * 0.6;
    if (guide * 0.25 >= multiplier) total += base * 0.4;
    else if (guide * 0.5 >= multiplier) total += base * 0.3;
    else if (guide * 0.75 >= multiplier) total += base * 0.2;
    return total;
  }
  return base * 0.5;
}

export function TasksSnapshot({
  initialTasks,
  difficulties,
}: {
  initialTasks: Task[];
  difficulties: Difficulty[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const router = useRouter();

  async function completeTask(task: Task) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date().toISOString();
    const diffExp =
      difficulties.find((d) => d.difficulty_name === task.task_difficulty)
        ?.difficulty_expamount ?? 0;
    const reward = calculateExpReward(
      { ...task, completion_datetime: task.completion_datetime || now },
      diffExp,
      now
    );

    const { data: profileRows } = await supabase
      .from("profile")
      .select("exp_amount")
      .eq("user_id", user.id);
    const currentExp = Number(profileRows?.[0]?.exp_amount ?? 0);
    const newExp = Math.max(0, currentExp + reward);

    await supabase
      .from("profile")
      .update({ exp_amount: newExp })
      .eq("user_id", user.id);

    window.dispatchEvent(new CustomEvent("exp-updated", { detail: { exp: newExp } }));

    const { error } = await supabase
      .from("task")
      .update({ is_complete: true, completion_datetime: now })
      .eq("id", task.id)
      .eq("user_id", user.id);

    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border-4 border-[#E4DCAB] p-5 bg-[#fef5ffbb] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-cherry text-2xl text-[#2E2805]">Pending Tasks</h2>
        <Link
          href="/tasks"
          className="font-delius text-sm text-[#C17F9E] underline hover:text-[#A0607E]"
        >
          View All
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="font-delius text-sm text-[#2E2805]">
          No pending tasks!{" "}
          <Link href="/tasks" className="underline text-[#C17F9E]">
            Add one?
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 appearance-none w-5 h-5 border-2 border-[#CCC38D] rounded flex-shrink-0 cursor-pointer checked:bg-[#ADD3EA] checked:border-[#ADD3EA]"
                checked={false}
                onChange={() => completeTask(task)}
              />
              <div className="min-w-0">
                <p className="font-delius text-sm text-[#2E2805] truncate">
                  {task.task_title}
                </p>
                {task.task_deadline && (
                  <p className="font-delius text-xs text-[#8B7355]">
                    Due:{" "}
                    {new Date(task.task_deadline).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      timeZone: "Asia/Manila",
                    })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
