import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { FaFaceAngry, FaFire } from "react-icons/fa6";
import { FaSmile, FaSmileBeam } from "react-icons/fa";
import { ImSad2, ImNeutral2 } from "react-icons/im";
import { TasksSnapshot } from "@/components/tasks-snapshot";

// ── Types ────────────────────────────────────────────────────────────────────

type PetData = { pet_model: string; pet_type: string } | null;
type MoodData = { mood_name: string } | null;

type CharacterData = {
  userName: string;
  petName: string;
  moodId: number;
  expAmount: number;
  pet: PetData;
  mood: MoodData;
  slots: { slot_name: string; x: number; y: number }[];
  equippedAccessories: {
    equipped_id: string;
    slot: string;
    accessory_owned: {
      accessory_id: string;
      accessory: { accessory_url: string; accessory_name: string } | null;
    } | null;
  }[];
};

type CharacterResult =
  | { kind: "notFound" }
  | { kind: "notSelected" }
  | { kind: "ready"; data: CharacterData };

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

type JournalEntry = {
  entry_id: string;
  entry_title: string | null;
  entry_text: string;
  entry_creation: string;
  mood_id: number | null;
};

type MoodDay = {
  date: string;
  label: string;
  moodId: number | null;
};

// ── Constants ────────────────────────────────────────────────────────────────

const TZ = "Asia/Manila";

const moodVisuals = [
  { id: 5, icon: <FaFaceAngry size={24} />, color: "#FA5659" },
  { id: 4, icon: <ImSad2 size={24} />, color: "#F7A34A" },
  { id: 3, icon: <ImNeutral2 size={24} />, color: "#F8D042" },
  { id: 2, icon: <FaSmile size={24} />, color: "#62B64D" },
  { id: 1, icon: <FaSmileBeam size={24} />, color: "#484572" },
];

const moodDotColors: Record<number, string> = {
  1: "#484572",
  2: "#62B64D",
  3: "#F8D042",
  4: "#F7A34A",
  5: "#FA5659",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMoodVisual(moodId: number) {
  return (
    moodVisuals.find((m) => m.id === moodId) ?? {
      id: 1,
      icon: <FaFaceAngry size={24} />,
      color: "#FA5659",
    }
  );
}

function toPHDateStr(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-CA", { timeZone: TZ });
}

function computeStreak(entries: { entry_creation: string }[] | null): number {
  if (!entries || entries.length === 0) return 0;

  const dates = new Set(entries.map((e) => toPHDateStr(e.entry_creation)));
  const todayStr = toPHDateStr(new Date().toISOString());

  // Use a plain date string to avoid timezone arithmetic issues
  let current = new Date(todayStr + "T00:00:00");

  if (!dates.has(todayStr)) {
    current.setDate(current.getDate() - 1);
    if (!dates.has(current.toLocaleDateString("en-CA"))) return 0;
  }

  let streak = 0;
  while (dates.has(current.toLocaleDateString("en-CA"))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

function buildMoodDays(
  moodHistory: { entry_creation: string; mood_id: number }[] | null
): MoodDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = toPHDateStr(d.toISOString());
    const label = new Intl.DateTimeFormat("en", {
      weekday: "short",
      timeZone: TZ,
    }).format(d);
    const entry = moodHistory?.find(
      (e) => toPHDateStr(e.entry_creation) === dateStr
    );
    return { date: dateStr, label: label.slice(0, 3), moodId: entry?.mood_id ?? null };
  });
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function getMoodName(supabase: Awaited<ReturnType<typeof createClient>>, moodId: number) {
  const { data } = await supabase
    .from("mood")
    .select("mood_name")
    .eq("mood_id", moodId)
    .maybeSingle();
  return data?.mood_name ?? null;
}

async function getCharacterSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<CharacterResult> {
  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("user_id, username, virtual_petid, exp_amount")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError || !profile) return { kind: "notFound" };
  if (!profile.virtual_petid) return { kind: "notSelected" };

  const { data: userPet, error: userPetError } = await supabase
    .from("user_pet")
    .select("pet_name, mood_id, pet_id")
    .eq("virtual_petid", profile.virtual_petid)
    .maybeSingle();
  if (userPetError || !userPet) return { kind: "notFound" };

  const moodId = Number(userPet.mood_id);

  const [petResult, petMoodResult, slotsResult, equippedResult, moodName] =
    await Promise.all([
      supabase
        .from("pet")
        .select("pet_type, pet_model")
        .eq("pet_id", userPet.pet_id)
        .maybeSingle(),
      supabase
        .from("pet_mood")
        .select("image_url")
        .eq("pet_id", userPet.pet_id)
        .eq("mood_id", moodId)
        .maybeSingle(),
      supabase
        .from("slot")
        .select("slot_name, x, y")
        .eq("pet_id", userPet.pet_id),
      supabase
        .from("pet_accessory_equipped")
        .select(
          "equipped_id, slot, accessory_owned(accessory_id, accessory(accessory_url, accessory_name))"
        )
        .eq("virtual_petid", profile.virtual_petid)
        .returns<CharacterData["equippedAccessories"]>(),
      Number.isFinite(moodId) ? getMoodName(supabase, moodId) : Promise.resolve(null),
    ]);

  const pet = petResult.data;
  const mood: MoodData = moodName ? { mood_name: moodName } : null;

  return {
    kind: "ready",
    data: {
      userName: profile.username,
      expAmount: profile.exp_amount ?? 0,
      petName: userPet.pet_name || "My Pet",
      moodId,
      pet: pet
        ? {
            pet_type: pet.pet_type,
            pet_model: petMoodResult.data?.image_url ?? pet.pet_model,
          }
        : null,
      mood,
      equippedAccessories: equippedResult.data ?? [],
      slots: slotsResult.data ?? [],
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const [
    characterResult,
    tasksResult,
    difficultiesResult,
    entriesResult,
    moodHistResult,
    streakResult,
  ] = await Promise.all([
    userId
      ? getCharacterSummary(supabase, userId)
      : Promise.resolve<CharacterResult>({ kind: "notFound" }),
    userId
      ? supabase
          .from("task")
          .select(
            "id, task_title, task_difficulty, task_deadline, created_at, completion_datetime, is_complete"
          )
          .eq("user_id", userId)
          .eq("is_complete", false)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    userId
      ? supabase
          .from("difficulty")
          .select("difficulty_name, difficulty_expamount")
      : Promise.resolve({ data: [] }),
    userId
      ? supabase
          .from("journal_entry")
          .select("entry_id, entry_title, entry_text, entry_creation, mood_id")
          .eq("user_id", userId)
          .order("entry_creation", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    userId
      ? supabase
          .from("journal_entry")
          .select("entry_creation, mood_id")
          .eq("user_id", userId)
          .gte("entry_creation", sevenDaysAgo.toISOString())
          .order("entry_creation", { ascending: false })
      : Promise.resolve({ data: [] }),
    userId
      ? supabase
          .from("journal_entry")
          .select("entry_creation")
          .eq("user_id", userId)
          .order("entry_creation", { ascending: false })
          .limit(365)
      : Promise.resolve({ data: [] }),
  ]);

  const tasks = (tasksResult.data ?? []) as Task[];
  const difficulties = (difficultiesResult.data ?? []) as Difficulty[];
  const entries = (entriesResult.data ?? []) as JournalEntry[];
  const streak = computeStreak(
    streakResult.data as { entry_creation: string }[] | null
  );
  const moodDays = buildMoodDays(
    moodHistResult.data as { entry_creation: string; mood_id: number }[] | null
  );

  return (
    <div className="p-6 pb-10 min-h-screen">
      <div className="max-w-4xl mx-auto rounded-3xl border-5 border-[#E4DCAB] bg-white/90 p-8 shadow-xl/40 space-y-8">
        <h1 className="font-cherry text-5xl text-[#2E2805] text-center">
          Welcome Home
        </h1>

        <section>
          <h2 className="font-cherry text-3xl text-[#2E2805] mb-4">
            Your Character
          </h2>
          <CharacterPanel characterResult={characterResult} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TasksSnapshot initialTasks={tasks} difficulties={difficulties} />
          <RecentEntries entries={entries} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StreakBadge streak={streak} />
          <MoodChart moodDays={moodDays} />
        </div>
      </div>
    </div>
  );
}

// ── Character Panel ───────────────────────────────────────────────────────────

function CharacterPanel({
  characterResult,
}: {
  characterResult: CharacterResult;
}) {
  if (characterResult.kind === "notFound") {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805]">
          Please log in to see your character.
        </p>
      </div>
    );
  }

  if (characterResult.kind === "notSelected") {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805] mb-3">
          You have not selected a pet yet.
        </p>
        <Link
          href="/pet-selection"
          className="font-delius underline text-[#C17F9E]"
        >
          Choose your pet now
        </Link>
      </div>
    );
  }

  const character = characterResult.data;
  const moodVisual = getMoodVisual(character.moodId);

  if (!character.pet) {
    return (
      <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb]">
        <p className="font-delius text-lg text-[#2E2805]">
          Pet image unavailable. Please select a pet again.
        </p>
        <Link
          href="/pet-selection"
          className="font-delius underline text-[#C17F9E]"
        >
          Re-select pet
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-4 border-[#E4DCAB] p-6 bg-[#fef5ffbb] flex flex-col md:flex-row gap-6 items-center justify-between">
      <div className="relative w-[180px] h-[180px]">
        <Image
          src={character.pet.pet_model}
          alt={character.pet.pet_type}
          fill
          className="object-contain"
        />
        {character.equippedAccessories.map((acc) => {
          const item = acc.accessory_owned?.accessory;
          if (!item) return null;
          return (
            <Image
              key={acc.equipped_id}
              src={item.accessory_url}
              alt={item.accessory_name}
              width={305}
              height={200}
              className="absolute object-contain"
            />
          );
        })}
      </div>
      <div className="font-delius text-[#2E2805] space-y-3">
        <p className="text-3xl">Hi, {character.userName}!</p>
        <p className="text-xl">EXP Points: {character.expAmount}</p>
        <div className="flex items-center gap-3 text-2xl">
          <span style={{ color: moodVisual.color }}>{moodVisual.icon}</span>
          <span>
            Current mood:{" "}
            {character.mood?.mood_name ?? `Mood ${character.moodId}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Recent Entries ────────────────────────────────────────────────────────────

function RecentEntries({ entries }: { entries: JournalEntry[] }) {
  return (
    <div className="rounded-2xl border-4 border-[#E4DCAB] p-5 bg-[#fef5ffbb] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-cherry text-2xl text-[#2E2805]">Recent Entries</h2>
        <Link
          href="/archive"
          className="font-delius text-sm text-[#C17F9E] underline hover:text-[#A0607E]"
        >
          View All
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="font-delius text-sm text-[#2E2805]">
          No journal entries yet.{" "}
          <Link href="/write" className="underline text-[#C17F9E]">
            Write one?
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.entry_id}
              className="border-b border-[#E4DCAB] pb-2 last:border-0 last:pb-0"
            >
              <p className="font-delius text-xs text-[#8B7355] mb-0.5">
                {new Date(entry.entry_creation).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: TZ,
                })}
              </p>
              <p className="font-delius text-sm font-semibold text-[#2E2805] truncate">
                {entry.entry_title || "Untitled"}
              </p>
              <p className="font-delius text-xs text-[#5C4A30] line-clamp-2">
                {entry.entry_text?.slice(0, 100)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Streak Badge ──────────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  const message =
    streak === 0
      ? "Start your streak today!"
      : streak < 3
      ? "Keep it up!"
      : streak < 7
      ? "Great momentum!"
      : streak < 30
      ? "You're on fire!"
      : "Incredible dedication!";

  return (
    <div className="rounded-2xl border-4 border-[#E4DCAB] p-5 bg-[#fef5ffbb] flex flex-col items-center justify-center gap-2 text-center">
      <h2 className="font-cherry text-2xl text-[#2E2805]">Journal Streak</h2>
      <div className="flex items-center gap-3">
        <FaFire size={36} color="#FA5659" />
        <span className="font-cherry text-6xl text-[#FA5659]">{streak}</span>
      </div>
      <p className="font-delius text-sm text-[#8B7355]">
        {streak === 1 ? "day" : "days"}
      </p>
      <p className="font-delius text-sm text-[#2E2805]">{message}</p>
    </div>
  );
}

// ── Mood Chart ────────────────────────────────────────────────────────────────

function MoodChart({ moodDays }: { moodDays: MoodDay[] }) {
  return (
    <div className="rounded-2xl border-4 border-[#E4DCAB] p-5 bg-[#fef5ffbb] flex flex-col gap-4">
      <h2 className="font-cherry text-2xl text-[#2E2805]">Mood This Week</h2>

      <div className="flex items-end justify-between gap-1">
        {moodDays.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <div
              className="w-9 h-9 rounded-full border-2 transition-opacity"
              style={{
                backgroundColor: day.moodId
                  ? moodDotColors[day.moodId]
                  : "transparent",
                borderColor: day.moodId
                  ? moodDotColors[day.moodId]
                  : "#D1C9A8",
                opacity: day.moodId ? 1 : 0.35,
              }}
            />
            <span className="font-delius text-xs text-[#8B7355]">
              {day.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {moodVisuals
          .slice()
          .reverse()
          .map((m) => (
            <div key={m.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <span
                className="font-delius text-xs"
                style={{ color: m.color }}
              >
                {m.id === 1
                  ? "Very Happy"
                  : m.id === 2
                  ? "Happy"
                  : m.id === 3
                  ? "Neutral"
                  : m.id === 4
                  ? "Sad"
                  : "Very Sad"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
