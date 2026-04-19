import { createClient } from '@/utils/supabase/server'
import MilestoneCard from './MilestoneCard'
import JournalMilestoneCard from './JournalMilestoneCard'
import { getMilestoneThreshold, getMilestoneReward } from './milestoneUtils'
import { computeJournalStreak } from './milestoneUtils'
import type { MilestoneType } from './milestoneUtils'

type ClaimedRow = {
  milestone_type: string
  milestone_index: number
  claimed_at: string
}

const MILESTONE_STYLE: Record<MilestoneType, { label: string; accentBg: string; accentBorder: string; accentText: string }> = {
  general: { label: 'General Tasks', accentBg: 'bg-[#D4E8F5]', accentBorder: 'border-[#8FBCD6]', accentText: 'text-[#1A4A6E]' },
  easy:    { label: 'Easy Tasks',    accentBg: 'bg-[#D4F0D4]', accentBorder: 'border-[#7DBF7D]', accentText: 'text-[#1A4D1A]' },
  medium:  { label: 'Medium Tasks',  accentBg: 'bg-[#F5E8A0]', accentBorder: 'border-[#D7B87F]', accentText: 'text-[#7A5500]' },
  hard:    { label: 'Hard Tasks',    accentBg: 'bg-[#F5D4D4]', accentBorder: 'border-[#D68080]', accentText: 'text-[#6E1A1A]' },
}

export default async function MilestonePage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return (
      <div className="mx-12 ml-32 font-delius">
        <p className="text-[#2E2805]">Please log in to view milestones.</p>
      </div>
    )
  }

  // Fetch difficulties sorted by exp amount to map easy/medium/hard to actual DB names
  const { data: difficulties } = await supabase
    .from('difficulty')
    .select('difficulty_name, difficulty_expamount')
    .order('difficulty_expamount', { ascending: true })

  const sorted = difficulties ?? []
  const easyName   = sorted[0]?.difficulty_name ?? null
  const mediumName = sorted[1]?.difficulty_name ?? null
  const hardName   = sorted[2]?.difficulty_name ?? null

  const [
    { count: totalCompleted },
    { count: easyCompleted },
    { count: mediumCompleted },
    { count: hardCompleted },
    { data: claimed },
    { data: profile },
    { data: journalEntries },
  ] = await Promise.all([
    supabase.from('task').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_complete', true),
    easyName   ? supabase.from('task').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_complete', true).eq('task_difficulty', easyName)   : Promise.resolve({ count: 0 }),
    mediumName ? supabase.from('task').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_complete', true).eq('task_difficulty', mediumName) : Promise.resolve({ count: 0 }),
    hardName   ? supabase.from('task').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_complete', true).eq('task_difficulty', hardName)   : Promise.resolve({ count: 0 }),
    supabase.from('task_milestone_claimed').select('milestone_type, milestone_index, claimed_at').eq('user_id', user.id),
    supabase.from('profile').select('exp_amount').eq('user_id', user.id).maybeSingle(),
    supabase.from('journal_entry').select('entry_creation').eq('user_id', user.id),
  ])

  const allClaimed = (claimed as ClaimedRow[]) ?? []
  const claimedSet = new Set(allClaimed.map((c) => `${c.milestone_type}:${c.milestone_index}`))

  const journalStreak = computeJournalStreak(
    (journalEntries ?? []).map((e) => e.entry_creation ?? '')
  )
  const journalClaimedRows = allClaimed.filter((c) => c.milestone_type === 'journal')
  const journalTimesClaimed = journalClaimedRows.length
  const lastJournalClaim = journalClaimedRows.sort((a, b) =>
    new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime()
  )[0]
  const daysSinceJournalClaim = lastJournalClaim
    ? Math.floor((Date.now() - new Date(lastJournalClaim.claimed_at).getTime()) / 86400000)
    : null
  const journalClaimable = journalStreak >= 7 && (daysSinceJournalClaim === null || daysSinceJournalClaim >= 7)

  const completedCounts: Record<MilestoneType, number> = {
    general: totalCompleted ?? 0,
    easy:    easyCompleted   ?? 0,
    medium:  mediumCompleted ?? 0,
    hard:    hardCompleted   ?? 0,
  }

  const difficultyNames: Record<MilestoneType, string | null> = {
    general: null,
    easy:    easyName,
    medium:  mediumName,
    hard:    hardName,
  }

  function getNextMilestoneIndex(type: MilestoneType): number {
    let index = 0
    while (claimedSet.has(`${type}:${index}`)) index++
    return index
  }

  const MILESTONE_TYPES: MilestoneType[] = ['general', 'easy', 'medium', 'hard']

  return (
    <div className="mx-12 ml-32 flex flex-col gap-8 pb-12">
      <div className="flex justify-between items-end mt-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-cherry text-6xl text-[#2E2805]">Milestones</h1>
          <p className="font-delius text-[#5A4A2E]">Complete tasks to earn bonus EXP rewards.</p>
        </div>
        <div className="flex items-center bg-[#F5E8A0] border-4 border-[#D7B87F] rounded-2xl px-6 py-3 shadow-md">
          <p className="font-delius text-2xl font-bold text-[#2E2805]">
            {(profile?.exp_amount ?? 0).toLocaleString()} EXP
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-[#D7CFA7] rounded-2xl px-8 py-5">
          <h2 className="font-cherry text-4xl text-[#2E2805]">Task Milestones</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MILESTONE_TYPES.map((type) => {
            const style = MILESTONE_STYLE[type]
            const nextIndex = getNextMilestoneIndex(type)
            const threshold = getMilestoneThreshold(type, nextIndex)
            const reward = getMilestoneReward(type, nextIndex)
            const completedCount = completedCounts[type]

            return (
              <MilestoneCard
                key={type}
                type={type}
                label={style.label}
                nextIndex={nextIndex}
                threshold={threshold}
                reward={reward}
                completedCount={completedCount}
                isClaimable={completedCount >= threshold}
                accentBg={style.accentBg}
                accentBorder={style.accentBorder}
                accentText={style.accentText}
                difficultyName={difficultyNames[type]}
              />
            )
          })}
        </div>
      </div>

      {/* Journal Milestones Section */}
      <div className="flex flex-col gap-4">
        <div className="bg-[#D7CFA7] rounded-2xl px-8 py-5">
          <h2 className="font-cherry text-4xl text-[#2E2805]">Journal Milestones</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <JournalMilestoneCard
            currentStreak={journalStreak}
            timesClaimed={journalTimesClaimed}
            isClaimable={journalClaimable}
          />
        </div>
      </div>
    </div>
  )
}
