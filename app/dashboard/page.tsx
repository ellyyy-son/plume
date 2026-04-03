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

// ─── TYPES ────────────────────────────────────────────────────────────────
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

  // ─── LOAD DATA ──────────────────────────────────────────────────────────
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

  // ─── STATES ─────────────────────────────────────────────────────────────
  if (!userId && !loading) {
    return <div style={{ padding: 40 }}>Not signed in</div>;
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  // ─── UI ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 40 }}>
      <h1>{username ? `${username}'s Dashboard` : "Dashboard"}</h1>

      {/* KPIs */}
      <div style={{ marginTop: 20 }}>
        <p>✅ Completed: {kpis?.tasksCompleted}</p>
        <p>📊 Total: {kpis?.totalTasks}</p>
        <p>⏳ Pending: {kpis?.pendingTasks}</p>
        <p>📈 Completion Rate: {kpis?.completionRate}%</p>
      </div>

      {/* Tasks Over Time */}
      <div style={{ marginTop: 30 }}>
        <h3>Tasks Over Time</h3>
        <Plot
          data={[
            {
              type: "scatter",
              mode: "lines+markers",
              x: tasksOverTime.map((d) => d.date),
              y: tasksOverTime.map((d) => d.completed),
            },
          ]}
          layout={{ width: 500, height: 300, title: "Tasks Completed" }}
        />
      </div>

      {/* Difficulty */}
      <div style={{ marginTop: 30 }}>
        <h3>Difficulty Breakdown</h3>
        <Plot
          data={[
            {
              type: "bar",
              x: difficulty.map((d) => d.label),
              y: difficulty.map((d) => d.total),
            },
          ]}
          layout={{ width: 500, height: 300, title: "Tasks by Difficulty" }}
        />
      </div>

      {/* Mood */}
      <div style={{ marginTop: 30 }}>
        <h3>Mood Distribution</h3>
        <Plot
          data={[
            {
              type: "bar",
              x: mood.map((m) => m.label),
              y: mood.map((m) => m.value),
            },
          ]}
          layout={{ width: 500, height: 300, title: "Mood Frequency" }}
        />
      </div>

      {/* Journal */}
      <div style={{ marginTop: 30 }}>
        <h3>Journal Frequency</h3>
        <Plot
          data={[
            {
              type: "bar",
              x: journalFreq.map((j) => j.week),
              y: journalFreq.map((j) => j.count),
            },
          ]}
          layout={{ width: 500, height: 300, title: "Entries per Week" }}
        />
      </div>

      {/* Events */}
      <div style={{ marginTop: 30 }}>
        <h3>Event Categories</h3>
        <Plot
          data={[
            {
              type: "pie",
              labels: eventCats.map((e) => e.label),
              values: eventCats.map((e) => e.value),
            },
          ]}
          layout={{ width: 500, height: 300, title: "Events" }}
        />
      </div>

      {/* Streak */}
      <div style={{ marginTop: 30 }}>
        <h3>🔥 Streak</h3>
        <p>Current: {streak?.currentStreak} days</p>
        <p>Longest: {streak?.longestStreak} days</p>
      </div>
    </div>
  );
}