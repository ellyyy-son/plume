'use server'

import { createClient } from "@/utils/supabase/server";

// ─── KPIs ─────────────────────────────────────────────────────────────────

export async function getUserKPIs(userId: string) {
  const supabase = await createClient();

  const [tasks, entries, events] = await Promise.all([
    supabase.from("task").select("is_complete, task_difficulty").eq("user_id", userId),
    supabase.from("journal_entry").select("entry_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("events").select("event_id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const allTasks = tasks.data ?? [];
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.is_complete).length;

  return {
    tasksCompleted: done,
    totalTasks: total,
    completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    journalEntries: entries.count ?? 0,
    eventsLogged: events.count ?? 0,
    pendingTasks: total - done,
  };
}

// ─── Tasks over time ──────────────────────────────────────────────────────

export async function getUserTasksOverTime(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("task")
    .select("created_at, completion_dateti, is_complete")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
    .order("created_at", { ascending: true });

  const byDate: Record<string, { completed: number; created: number }> = {};

  for (const row of data ?? []) {
    const created = row.created_at?.slice(0, 10);
    if (created) {
      if (!byDate[created]) byDate[created] = { completed: 0, created: 0 };
      byDate[created].created++;
    }

    if (row.is_complete && row.completion_dateti) {
      const completed = row.completion_dateti.slice(0, 10);
      if (!byDate[completed]) byDate[completed] = { completed: 0, created: 0 };
      byDate[completed].completed++;
    }
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

// ─── Difficulty breakdown ─────────────────────────────────────────────────

export async function getUserDifficultyBreakdown(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("task")
    .select("task_difficulty, is_complete")
    .eq("user_id", userId);

  const map: Record<string, { total: number; done: number }> = {};

  for (const row of data ?? []) {
    const d = row.task_difficulty ?? "Unset";
    if (!map[d]) map[d] = { total: 0, done: 0 };
    map[d].total++;
    if (row.is_complete) map[d].done++;
  }

  return Object.entries(map).map(([label, v]) => ({ label, ...v }));
}

// ─── Mood distribution ────────────────────────────────────────────────────

export async function getUserMoodDistribution(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("journal_entry")
    .select("mood_id, mood(mood_name)")
    .eq("user_id", userId);

  const map: Record<string, number> = {};

  for (const row of data ?? []) {
    const name = (row.mood as any)?.mood_name ?? "Unknown";
    map[name] = (map[name] ?? 0) + 1;
  }

  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value }));
}

// ─── Journal frequency ────────────────────────────────────────────────────

export async function getUserJournalFrequency(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("journal_entry")
    .select("entry_creation")
    .eq("user_id", userId)
    .gte("entry_creation", new Date(Date.now() - 56 * 86400000).toISOString())
    .order("entry_creation", { ascending: true });

  const byWeek: Record<string, number> = {};

  for (const row of data ?? []) {
    const d = new Date(row.entry_creation);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    byWeek[key] = (byWeek[key] ?? 0) + 1;
  }

  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}

// ─── Event categories ─────────────────────────────────────────────────────

export async function getUserEventCategories(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("event_category")
    .eq("user_id", userId);

  const map: Record<string, number> = {};

  for (const row of data ?? []) {
    const cat = row.event_category ?? "Uncategorized";
    map[cat] = (map[cat] ?? 0) + 1;
  }

  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value }));
}

// ─── Streak ───────────────────────────────────────────────────────────────

export async function getUserStreak(userId: string) {
  const supabase = await createClient();

  const [tasks, entries] = await Promise.all([
    supabase.from("task").select("created_at").eq("user_id", userId).eq("is_complete", true),
    supabase.from("journal_entry").select("entry_creation").eq("user_id", userId),
  ]);

  const activeDays = new Set<string>();

  for (const r of tasks.data ?? []) {
    const d = r.created_at?.slice(0, 10);
    if (d) activeDays.add(d);
  }

  for (const r of entries.data ?? []) {
    const d = r.entry_creation?.slice(0, 10);
    if (d) activeDays.add(d);
  }

  const sorted = Array.from(activeDays).sort();

  let current = 0;
  let longest = 0;
  let streak = 1;

  const today = new Date().toISOString().slice(0, 10);

  for (let i = sorted.length - 1; i >= 0; i--) {
    const diff = Math.round(
      (new Date(today).getTime() - new Date(sorted[i]).getTime()) / 86400000
    );
    if (diff === sorted.length - 1 - i) current++;
    else break;
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diff === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  return { currentStreak: current, longestStreak: Math.max(longest, current) };
}