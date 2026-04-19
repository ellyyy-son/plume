"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";

import {
  getUserKPIs,
  getUserTasksOverTime,
  getUserDifficultyBreakdown,
  getUserMoodDistribution,
  getUserJournalFrequency,
  getUserEventCategories,
  getUserStreak,
} from "./queries";

// ✅ Plotly fix (no SSR crash)
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type KPI = {
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  journalEntries: number;
  eventsLogged: number;
  pendingTasks: number;
};

export default function UserDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [kpis, setKpis] = useState<KPI | null>(null);
  const [tasksOverTime, setTasksOverTime] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState<any[]>([]);
  const [mood, setMood] = useState<any[]>([]);
  const [journalFreq, setJournalFreq] = useState<any[]>([]);
  const [eventCats, setEventCats] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;

      if (!uid) {
        setLoading(false);
        return;
      }

      setUserId(uid);

      // get username
      const { data: profile } = await supabase
        .from("profile")
        .select("username")
        .eq("user_id", uid)
        .single();

      setUsername(profile?.username ?? "");

      // fetch all analytics
      const [k, tot, diff, m, jf, ec, s] = await Promise.all([
        getUserKPIs(uid),
        getUserTasksOverTime(uid),
        getUserDifficultyBreakdown(uid),
        getUserMoodDistribution(uid),
        getUserJournalFrequency(uid),
        getUserEventCategories(uid),
        getUserStreak(uid),
      ]);

      setKpis(k);
      setTasksOverTime(tot);
      setDifficulty(diff);
      setMood(m);
      setJournalFreq(jf);
      setEventCats(ec);
      setStreak(s);

      setLoading(false);
    }

    loadData();
  }, []);

  if (!userId && !loading) {
    return <div style={{ padding: 40 }}>Not signed in</div>;
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div className="mb-10">
      <div className="bg-[#FBF5D1] font-cherry text-6xl py-6 px-15">
        <h1>{username ? `${username}'s Dashboard` : "Dashboard"}</h1>
      </div>

      {/* KPIs */}
      {/* <div style={{ marginTop: 20 }}, {{ padding: 40 }}> */}
      <div className="px-30 pt-15 font-cherry">
        <h2 className="font-cherry text-4xl">Task Trends</h2>
        <div className="bg-white font-delius mt-5 p-5 rounded-lg px-20 shadow-md">
          {/* <h5 className="font-cherry">Overview</h5> */}
          <p>✅ Completed: {kpis?.tasksCompleted}</p>
          <p>📊 Total: {kpis?.totalTasks}</p>
          <p>⏳ Pending: {kpis?.pendingTasks}</p>
          <p>📈 Completion Rate: {kpis?.completionRate}%</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
        {/* Tasks Over Time */}
          <div className="mt-10 bg-[#ADD3EA] shadow-md py-6 px-5 rounded-xl overflow-auto">
            <h3 className="text-2xl mb-3">Tasks Over Time</h3>
            <div className="flex justify-center items-center">
              <Plot
                data={[
                  {
                    type: "scatter",
                    mode: "lines+markers",
                    x: tasksOverTime.map((d) => d.date),
                    y: tasksOverTime.map((d) => d.completed),
                  },
                ]}
                layout={{ width: 350, height: 300, title: "Tasks Completed" }}
              />
            </div>
          </div>

        {/* Difficulty */}
          <div className="mt-10 bg-[#FBF5D1] shadow-md py-6 ps-5 rounded-xl overflow-auto">
            <h3 className="text-2xl mb-3">Difficulty Breakdown</h3>
            <div className="flex justify-center items-center">
            <Plot
              data={[
                {
                  type: "bar",
                  x: difficulty.map((d) => d.label),
                  y: difficulty.map((d) => d.total),
                },
              ]}
              layout={{ width: 350, height: 300, title: "Tasks by Difficulty" }}
            />
            </div>
          </div>
        </div> 

      <h2 className="font-cherry text-4xl mt-10">Journal Trends</h2>
      <div className="grid grid-cols-2 gap-5">
      {/* Mood */}
        <div className="mt-5 bg-[#FBF5D1] shadow-md py-6 px-5 rounded-xl overflow-auto">
          <h3 className="text-2xl mb-3">Mood Distribution</h3>
          <div className="flex justify-center items-center">
          <Plot
            data={[
              {
                type: "bar",
                x: mood.map((m) => m.label),
                y: mood.map((m) => m.value),
              },
            ]}
            layout={{ width: 350, height: 300, title: "Mood Frequency" }}
          />
          </div>
        </div>

      {/* Journal */}
        <div className="mt-5 bg-white shadow-md py-6 px-5 rounded-xl overflow-auto">
          <h3 className="text-2xl mb-3">Journal Frequency</h3>
          <div className="flex justify-center items-center">
          <Plot
            data={[
              {
                type: "bar",
                x: journalFreq.map((j) => j.week),
                y: journalFreq.map((j) => j.count),
              },
            ]}
            layout={{ width: 350, height: 300, title: "Entries per Week" }}
          />
          </div>
        </div>
        </div>

      <h2 className="font-cherry text-4xl mt-10">Other Trends</h2>
      <div className="grid grid-cols-3 gap-5">
        {/* Events */}
          <div className="col-span-2 mt-5 bg-white shadow-md pt-6 ps-5 rounded-xl overflow-auto">
            <h3 className="text-2xl mb-3">Event Categories</h3>
            <div className="flex justify-center items-center">
            <Plot
              data={[
                {
                  type: "pie",
                  labels: eventCats.map((e) => e.label),
                  values: eventCats.map((e) => e.value),
                },
              ]}
              layout={{ width: 600, height: 400, title: "Events" }}
            />
            </div>
          </div>

        {/* Streak */}
          <div className="flex flex-col gap-8 mt-5 bg-[#ADD3EA] shadow-md py-6 px-6 rounded-xl">
            <h3 className="text-3xl mb-3">🔥 Streak</h3>
            <div className="col-span-2 bg-white shadow-md p-6 rounded-xl">
              <p className="text-2xl place-self-center">Current: {streak?.currentStreak} days</p>
            </div>

            <div className="col-span-2 bg-[#FBF5D1] shadow-md p-6 rounded-xl">
              <p className="text-2xl place-self-center">Longest: {streak?.longestStreak} days</p>
            </div>
          </div>
          </div>

      </div>
    </div>
  );
}