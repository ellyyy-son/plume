'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMilestoneThreshold, getMilestoneReward, computeJournalStreak } from './milestoneUtils'
import type { MilestoneType } from './milestoneUtils'

// difficultyName: the actual value stored in task.task_difficulty (null = count all difficulties)
export async function claimMilestoneReward(
  milestoneType: MilestoneType,
  milestoneIndex: number,
  difficultyName: string | null
): Promise<{ success?: boolean; reward?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('task_milestone_claimed')
    .select('id')
    .eq('user_id', user.id)
    .eq('milestone_type', milestoneType)
    .eq('milestone_index', milestoneIndex)
    .maybeSingle()

  if (existing) return { error: 'Already claimed' }

  const threshold = getMilestoneThreshold(milestoneType, milestoneIndex)

  let countQuery = supabase
    .from('task')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_complete', true)

  if (difficultyName) {
    countQuery = countQuery.eq('task_difficulty', difficultyName)
  }

  const { count } = await countQuery
  if ((count ?? 0) < threshold) return { error: 'Not enough completed tasks' }

  const reward = getMilestoneReward(milestoneType, milestoneIndex)

  const { data: profile } = await supabase
    .from('profile')
    .select('exp_amount')
    .eq('user_id', user.id)
    .single()

  const currentExp = profile?.exp_amount ?? 0

  const [expResult, claimResult] = await Promise.all([
    supabase
      .from('profile')
      .update({ exp_amount: currentExp + reward })
      .eq('user_id', user.id),
    supabase
      .from('task_milestone_claimed')
      .insert({ user_id: user.id, milestone_type: milestoneType, milestone_index: milestoneIndex }),
  ])

  if (expResult.error || claimResult.error) return { error: 'Failed to claim reward' }

  revalidatePath('/milestone')
  return { success: true, reward }
}

const JOURNAL_STREAK_REQUIRED = 7
const JOURNAL_REWARD = 5000
const JOURNAL_MILESTONE_TYPE = 'journal'

export async function claimJournalMilestoneReward(): Promise<{ success?: boolean; reward?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // Fetch all journal entry dates
  const { data: entries } = await supabase
    .from('journal_entry')
    .select('entry_creation')
    .eq('user_id', user.id)

  const streak = computeJournalStreak((entries ?? []).map((e) => e.entry_creation ?? ''))
  if (streak < JOURNAL_STREAK_REQUIRED) return { error: 'Journal streak not reached' }

  // Get latest claim for this milestone type
  const { data: lastClaim } = await supabase
    .from('task_milestone_claimed')
    .select('milestone_index, claimed_at')
    .eq('user_id', user.id)
    .eq('milestone_type', JOURNAL_MILESTONE_TYPE)
    .order('milestone_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastClaim) {
    const daysSinceClaim = Math.floor(
      (Date.now() - new Date(lastClaim.claimed_at).getTime()) / 86400000
    )
    if (daysSinceClaim < JOURNAL_STREAK_REQUIRED) return { error: 'Already claimed for this streak' }
  }

  const nextIndex = (lastClaim?.milestone_index ?? -1) + 1

  const { data: profile } = await supabase
    .from('profile')
    .select('exp_amount')
    .eq('user_id', user.id)
    .single()

  const currentExp = profile?.exp_amount ?? 0

  const [expResult, claimResult] = await Promise.all([
    supabase.from('profile').update({ exp_amount: currentExp + JOURNAL_REWARD }).eq('user_id', user.id),
    supabase.from('task_milestone_claimed').insert({
      user_id: user.id,
      milestone_type: JOURNAL_MILESTONE_TYPE,
      milestone_index: nextIndex,
    }),
  ])

  if (expResult.error || claimResult.error) return { error: 'Failed to claim reward' }

  revalidatePath('/milestone')
  return { success: true, reward: JOURNAL_REWARD }
}

