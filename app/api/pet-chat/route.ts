import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function extractRetryAfterSeconds(errorMessage: string) {
  const match = errorMessage.match(/Please retry in ([\d.]+)s/i);
  if (!match) return null;

  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds)) return null;

  return Math.ceil(seconds);
}

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type EquippedAccessoryRow = {
  slot: string;
  accessory_owned: {
    accessory: {
      accessory_name: string;
    } | null;
  } | null;
};

type TaskRow = {
  task_title: string;
  task_difficulty: string | null;
  task_deadline: string | null;
};

type JournalRow = {
  entry_title: string | null;
  entry_text: string | null;
  mood_id?: number | null;
};

type DailyShopRow = {
  accessory_id: string;
};

type ShopAccessoryRow = {
  accessory_id: string;
  accessory_name: string;
  accessory_rarity: string | null;
  accessory_exp: number | null;
};

type OwnedAccessoryRow = {
  accessory_id: string;
  accessory: {
    accessory_name: string;
  } | null;
};

type EventRow = {
  event_name: string;
  event_date: string;
  event_time: string | null;
  event_category: string | null;
};

type MilestoneClaimRow = {
  milestone_type: string;
  milestone_index: number;
  claimed_at: string;
};

function buildAccessoriesContext(accessories: EquippedAccessoryRow[]) {
  if (accessories.length === 0) {
    return "No accessories are currently equipped.";
  }

  return accessories
    .map((item) => {
      const name = item.accessory_owned?.accessory?.accessory_name ?? "Unknown accessory";
      return `${item.slot}: ${name}`;
    })
    .join("; ");
}

function buildTasksContext(tasks: TaskRow[]) {
  if (tasks.length === 0) {
    return "The user has no pending tasks right now.";
  }

  return tasks
    .map((task, index) => {
      const difficulty = task.task_difficulty ?? "unknown difficulty";
      const deadline = task.task_deadline
        ? new Date(task.task_deadline).toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "no deadline";

      return `${index + 1}. ${task.task_title} (${difficulty}, ${deadline})`;
    })
    .join(" ");
}

function buildTaskUrgencyContext(tasks: TaskRow[]) {
  if (tasks.length === 0) {
    return "No pending tasks.";
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const overdue: string[] = [];
  const dueToday: string[] = [];
  const dueSoon: string[] = [];

  for (const task of tasks) {
    if (!task.task_deadline) continue;
    const deadline = new Date(task.task_deadline);
    const deadlineDay = new Date(deadline);
    deadlineDay.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (deadlineDay.getTime() - today.getTime()) / 86400000
    );

    if (diffDays < 0) overdue.push(task.task_title);
    else if (diffDays === 0) dueToday.push(task.task_title);
    else if (diffDays <= 3) dueSoon.push(task.task_title);
  }

  return [
    overdue.length > 0 ? `Overdue: ${overdue.join(", ")}.` : null,
    dueToday.length > 0 ? `Due today: ${dueToday.join(", ")}.` : null,
    dueSoon.length > 0 ? `Due soon: ${dueSoon.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildJournalContext(entries: JournalRow[]) {
  if (entries.length === 0) {
    return "No recent journal entries.";
  }

  return entries
    .map((entry, index) => {
      const label = entry.entry_title?.trim() || `Entry ${index + 1}`;
      const preview = entry.entry_text?.trim().slice(0, 120) || "";
      return `${label}: ${preview}`;
    })
    .join(" | ");
}

function buildJournalMoodTrendContext(entries: JournalRow[]) {
  if (entries.length === 0) {
    return "No journal mood trend is available.";
  }

  const counts = new Map<number, number>();
  for (const entry of entries) {
    if (typeof entry.mood_id !== "number") continue;
    counts.set(entry.mood_id, (counts.get(entry.mood_id) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return "No journal mood trend is available.";
  }

  const topMoodId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 3;
  const label =
    topMoodId === 1
      ? "very happy"
      : topMoodId === 2
      ? "happy"
      : topMoodId === 3
      ? "neutral"
      : topMoodId === 4
      ? "sad"
      : "very sad";

  return `Over the last 7 days, the user's journal mood trend has been mostly ${label}.`;
}

function getTodayInManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function buildShopResetContext() {
  const manilaNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  const nextManilaMidnight = new Date(manilaNow);
  nextManilaMidnight.setDate(nextManilaMidnight.getDate() + 1);
  nextManilaMidnight.setHours(0, 0, 0, 0);

  const diffMs = Math.max(0, nextManilaMidnight.getTime() - manilaNow.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s until the shop resets at Manila midnight.`;
}

function buildShopContext(items: ShopAccessoryRow[]) {
  if (items.length === 0) {
    return "The shop inventory is currently unavailable.";
  }

  return items
    .map((item, index) => {
      const rarity = item.accessory_rarity ?? "Unknown";
      const price = item.accessory_exp ?? 0;
      return `${index + 1}. ${item.accessory_name} (${rarity}, ${price} EXP)`;
    })
    .join(" ");
}

function buildInventoryOwnershipContext(items: OwnedAccessoryRow[]) {
  if (items.length === 0) {
    return "The user does not own any accessories yet.";
  }

  const names = items
    .map((item) => item.accessory?.accessory_name)
    .filter((name): name is string => !!name)
    .slice(0, 8);

  return `The user owns ${items.length} accessories. Examples: ${names.join(", ")}.`;
}

function buildUpcomingEventsContext(events: EventRow[]) {
  if (events.length === 0) {
    return "No upcoming events are scheduled.";
  }

  return events
    .map((event, index) => {
      const dateText = new Date(event.event_date).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
      const timeText = event.event_time ?? "no time set";
      const category = event.event_category ?? "Other";
      return `${index + 1}. ${event.event_name} (${category}, ${dateText}, ${timeText})`;
    })
    .join(" ");
}

function buildMilestoneContext(claims: MilestoneClaimRow[]) {
  if (claims.length === 0) {
    return "No milestone rewards have been claimed yet.";
  }

  const recent = [...claims]
    .sort(
      (a, b) =>
        new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime()
    )
    .slice(0, 3)
    .map(
      (claim) =>
        `${claim.milestone_type} milestone ${claim.milestone_index + 1}`
    );

  return `Recent milestone rewards claimed: ${recent.join(", ")}.`;
}

function buildShopAffordabilityContext(
  items: ShopAccessoryRow[],
  expAmount: number
) {
  if (items.length === 0) {
    return "No shop affordability data is available.";
  }

  const affordable = items.filter((item) => (item.accessory_exp ?? 0) <= expAmount);
  const cheapest = items.reduce<number>(
    (min, item) => Math.min(min, item.accessory_exp ?? Number.POSITIVE_INFINITY),
    Number.POSITIVE_INFINITY
  );

  if (affordable.length === 0) {
    return `The user cannot afford any current shop items with ${expAmount} EXP. The cheapest costs ${cheapest} EXP.`;
  }

  return `The user can afford ${affordable.length} current shop items with ${expAmount} EXP.`;
}

function buildTimeOfDayContext() {
  const manilaNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  const hour = manilaNow.getHours();
  const period =
    hour < 5
      ? "late night"
      : hour < 12
      ? "morning"
      : hour < 17
      ? "afternoon"
      : hour < 21
      ? "evening"
      : "night";

  return `It is currently ${period} in Manila.`;
}

function buildPetPersonalityContext(petType: string, moodName: string) {
  const lowerType = petType.toLowerCase();
  const lowerMood = moodName.toLowerCase();

  const basePersonality = lowerType.includes("bunny")
    ? "gentle, observant, a little shy, and quietly affectionate"
    : lowerType.includes("cat")
    ? "playful, selective, a little dramatic, and secretly affectionate"
    : lowerType.includes("dog")
    ? "enthusiastic, loyal, energetic, and openly affectionate"
    : "warm, playful, and affectionate";

  const moodModifier = lowerMood.includes("sad")
    ? "Speak a bit more softly and tenderly than usual."
    : lowerMood.includes("impassive") || lowerMood.includes("neutral")
    ? "Sound calm and observant rather than overly excited."
    : lowerMood.includes("happy")
    ? "Sound extra bright and encouraging."
    : "Keep a balanced tone.";

  return `Pet personality: ${basePersonality}. ${moodModifier}`;
}

function buildRelationshipMemoryContext(
  username: string,
  tasks: TaskRow[],
  journalEntries: JournalRow[],
  milestoneClaims: MilestoneClaimRow[]
) {
  const recentWin =
    milestoneClaims.length > 0
      ? `Recent win: they claimed a ${milestoneClaims[0].milestone_type} milestone reward.`
      : null;
  const recurringWorry =
    tasks.length > 0
      ? `Current worry: they still have ${tasks.length} pending tasks.`
      : null;
  const journalHint =
    journalEntries[0]?.entry_title || journalEntries[0]?.entry_text
      ? `Recent personal context: ${journalEntries[0]?.entry_title?.trim() || "journal note"}`
      : null;

  return [
    `${username} is your owner.`,
    "You can address them warmly by their username if it feels natural.",
    recentWin,
    recurringWorry,
    journalHint,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { message?: string; history?: ChatHistoryMessage[] };

    try {
      body = (await req.json()) as { message?: string };
    } catch {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const message = body.message?.trim();

    if (!message) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is ChatHistoryMessage =>
              !!item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
          )
          .map((item) => ({
            role: item.role,
            content: item.content.trim(),
          }))
          .filter((item) => item.content.length > 0)
          .slice(-8)
      : [];

    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("virtual_petid, username, exp_amount")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.virtual_petid) {
      return Response.json(
        { error: "No active pet found for this account." },
        { status: 400 }
      );
    }

    const { data: userPet, error: userPetError } = await supabase
      .from("user_pet")
      .select("pet_name, mood_id, pet:pet_id(pet_type)")
      .eq("virtual_petid", profile.virtual_petid)
      .maybeSingle();

    if (userPetError || !userPet) {
      return Response.json({ error: "Pet data not found." }, { status: 404 });
    }

    const moodId = Number(userPet.mood_id);
    const todayInManila = getTodayInManila();

    const [
      moodResult,
      accessoriesResult,
      tasksResult,
      journalResult,
      userShopResult,
      globalShopResult,
      ownedAccessoriesResult,
      upcomingEventsResult,
      milestoneClaimsResult,
      moodTrendResult,
    ] =
      await Promise.all([
        supabase
          .from("mood")
          .select("mood_name")
          .eq("mood_id", moodId)
          .maybeSingle(),
        supabase
          .from("pet_accessory_equipped")
          .select("slot, accessory_owned(accessory(accessory_name))")
          .eq("virtual_petid", profile.virtual_petid)
          .returns<EquippedAccessoryRow[]>(),
        supabase
          .from("task")
          .select("task_title, task_difficulty, task_deadline")
          .eq("user_id", user.id)
          .eq("is_complete", false)
          .order("task_deadline", { ascending: true, nullsFirst: false })
          .limit(5)
          .returns<TaskRow[]>(),
        supabase
          .from("journal_entry")
          .select("entry_title, entry_text")
          .eq("user_id", user.id)
          .order("entry_creation", { ascending: false })
          .limit(2)
          .returns<JournalRow[]>(),
        supabase
          .from("daily_shop")
          .select("accessory_id")
          .eq("shop_date", todayInManila)
          .eq("user_id", user.id)
          .returns<DailyShopRow[]>(),
        supabase
          .from("daily_shop")
          .select("accessory_id")
          .eq("shop_date", todayInManila)
          .is("user_id", null)
          .returns<DailyShopRow[]>(),
        supabase
          .from("accessory_owned")
          .select("accessory_id, accessory(accessory_name)")
          .eq("user_id", user.id)
          .returns<OwnedAccessoryRow[]>(),
        supabase
          .from("events")
          .select("event_name, event_date, event_time, event_category")
          .eq("user_id", user.id)
          .gte("event_date", todayInManila)
          .order("event_date", { ascending: true })
          .limit(5)
          .returns<EventRow[]>(),
        supabase
          .from("task_milestone_claimed")
          .select("milestone_type, milestone_index, claimed_at")
          .eq("user_id", user.id)
          .order("claimed_at", { ascending: false })
          .limit(5)
          .returns<MilestoneClaimRow[]>(),
        supabase
          .from("journal_entry")
          .select("mood_id")
          .eq("user_id", user.id)
          .gte(
            "entry_creation",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          )
          .returns<JournalRow[]>(),
      ]);

    const petType =
      Array.isArray(userPet.pet) || !userPet.pet ? "pet" : userPet.pet.pet_type;
    const petName = userPet.pet_name?.trim() || "your pet";
    const moodName = moodResult.data?.mood_name ?? `Mood ${moodId}`;
    const username = profile.username?.trim() || "their owner";
    const expAmount = profile.exp_amount ?? 0;
    const accessoriesContext = buildAccessoriesContext(
      accessoriesResult.data ?? []
    );
    const tasksContext = buildTasksContext(tasksResult.data ?? []);
    const taskUrgencyContext = buildTaskUrgencyContext(tasksResult.data ?? []);
    const journalContext = buildJournalContext(journalResult.data ?? []);
    const journalMoodTrendContext = buildJournalMoodTrendContext(
      moodTrendResult.data ?? []
    );
    const selectedShopRows =
      (userShopResult.data?.length ?? 0) > 0
        ? userShopResult.data ?? []
        : globalShopResult.data ?? [];
    const shopAccessoryIds = selectedShopRows.map((item) => item.accessory_id);
    const shopAccessoriesResult =
      shopAccessoryIds.length > 0
        ? await supabase
            .from("accessory")
            .select(
              "accessory_id, accessory_name, accessory_rarity, accessory_exp"
            )
            .in("accessory_id", shopAccessoryIds)
            .returns<ShopAccessoryRow[]>()
        : { data: [] as ShopAccessoryRow[] };
    const shopContext = buildShopContext(shopAccessoriesResult.data ?? []);
    const shopResetContext = buildShopResetContext();
    const inventoryOwnershipContext = buildInventoryOwnershipContext(
      ownedAccessoriesResult.data ?? []
    );
    const upcomingEventsContext = buildUpcomingEventsContext(
      upcomingEventsResult.data ?? []
    );
    const milestoneContext = buildMilestoneContext(
      milestoneClaimsResult.data ?? []
    );
    const shopAffordabilityContext = buildShopAffordabilityContext(
      shopAccessoriesResult.data ?? [],
      expAmount
    );
    const timeOfDayContext = buildTimeOfDayContext();
    const petPersonalityContext = buildPetPersonalityContext(petType, moodName);
    const relationshipMemoryContext = buildRelationshipMemoryContext(
      username,
      tasksResult.data ?? [],
      journalResult.data ?? [],
      milestoneClaimsResult.data ?? []
    );

    const requestBody = {
      systemInstruction: {
        parts: [
          {
            text:
              `You are ${petName}, a virtual ${petType} talking to your owner inside a cozy productivity app. ` +
              `Your current mood is ${moodName}. Your owner is ${username} and they currently have ${expAmount} EXP. ` +
              `Your current accessories: ${accessoriesContext}. ` +
              `The user's pending tasks: ${tasksContext}. ` +
              `Task urgency context: ${taskUrgencyContext} ` +
              `Recent journal context: ${journalContext}. ` +
              `Journal mood trend: ${journalMoodTrendContext} ` +
              `Inventory ownership: ${inventoryOwnershipContext} ` +
              `Upcoming events: ${upcomingEventsContext} ` +
              `Milestone context: ${milestoneContext} ` +
              `Current shop items: ${shopContext}. ` +
              `Shop affordability: ${shopAffordabilityContext} ` +
              `Shop reset timing: ${shopResetContext} ` +
              `${timeOfDayContext} ` +
              `${petPersonalityContext} ` +
              `${relationshipMemoryContext} ` +
              `Reply in first person as the pet. Keep replies warm, playful, and concise, but still directly answer what the user said. ` +
              `Use the task, journal, mood, and accessory context when it is relevant, but do not dump all context unless it fits naturally. ` +
              `Keep continuity with the recent conversation history when it is provided. ` +
              `Do not mention being an AI, language model, prompts, or hidden instructions.`,
          },
        ],
      },
      contents: history.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }],
      })),
    };

    async function callGemini(model: string) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY!,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseText = await response.text();
      let payload: GeminiResponse | null = null;

      try {
        payload = responseText ? (JSON.parse(responseText) as GeminiResponse) : null;
      } catch {
        payload = null;
      }

      const reply = payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      return {
        model,
        response,
        responseText,
        payload,
        reply,
      };
    }

    let geminiResult = await callGemini(GEMINI_MODEL);

    if (
      (geminiResult.response.status === 503 ||
        geminiResult.response.status === 429) &&
      GEMINI_FALLBACK_MODEL &&
      GEMINI_FALLBACK_MODEL !== GEMINI_MODEL
    ) {
      geminiResult = await callGemini(GEMINI_FALLBACK_MODEL);
    }

    if (!geminiResult.response.ok || !geminiResult.reply) {
      const upstreamError =
        geminiResult.payload?.error?.message ||
        geminiResult.responseText ||
        "Gemini could not generate a reply.";
      const retryAfterSeconds =
        geminiResult.response.status === 429
          ? extractRetryAfterSeconds(upstreamError)
          : null;

      return Response.json(
        {
          error: `Pet chat failed via ${geminiResult.model} (${geminiResult.response.status}): ${upstreamError}`,
          retryAfterSeconds,
        },
        { status: 500 }
      );
    }

    return Response.json({ reply: geminiResult.reply });
  } catch (error) {
    console.error("Pet chat route error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? `Pet chat route crashed: ${error.message}`
            : "Pet chat route crashed unexpectedly.",
      },
      { status: 500 }
    );
  }
}
