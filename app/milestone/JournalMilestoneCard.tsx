'use client'

import { useState, useTransition } from 'react'
import { claimJournalMilestoneReward } from './actions'

type JournalMilestoneCardProps = {
  currentStreak: number
  timesClaimed: number
  isClaimable: boolean
}

const STREAK_REQUIRED = 7
const REWARD = 5000

export default function JournalMilestoneCard({ currentStreak, timesClaimed, isClaimable }: JournalMilestoneCardProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const progress = Math.min(currentStreak / STREAK_REQUIRED, 1)

  function handleClaim() {
    setFeedback(null)
    startTransition(async () => {
      const result = await claimJournalMilestoneReward()
      if (result.success) {
        setFeedback({ kind: 'success', message: `+${result.reward?.toLocaleString()} EXP claimed!` })
      } else {
        setFeedback({ kind: 'error', message: result.error ?? 'Failed to claim.' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-4 border-[#C4A8D4] bg-[#F0E4F8] p-5 font-delius shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#F0E4F8] border-2 border-[#C4A8D4] text-[#5A1A7A]">
          Journal
        </span>
        {timesClaimed > 0 && (
          <span className="text-xs text-[#5A4A2E] font-bold">Claimed {timesClaimed}×</span>
        )}
      </div>

      <p className="text-[#2E2805] text-base font-bold">
        Maintain a <span className="text-[#5A1A7A]">7-day</span> journal streak
      </p>

      {/* Progress bar */}
      <div className="w-full bg-white/60 rounded-full h-3 border border-white">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isClaimable ? 'bg-green-400' : 'bg-[#C4A8D4]'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="text-xs text-[#5A4A2E]">
        {currentStreak} / {STREAK_REQUIRED} days
      </p>

      {/* Reward */}
      <div className="flex items-center gap-2 bg-[#F5E8A0] border-2 border-[#D7B87F] rounded-xl px-4 py-2 w-fit">
        <span className="text-[#2E2805] font-bold text-sm">Reward:</span>
        <span className="text-[#7A5500] font-bold">{REWARD.toLocaleString()} EXP</span>
      </div>

      {feedback && (
        <p className={`text-sm font-bold ${feedback.kind === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {feedback.message}
        </p>
      )}

      <button
        onClick={handleClaim}
        disabled={!isClaimable || isPending || feedback?.kind === 'success'}
        className={`mt-1 py-2 px-6 rounded-2xl font-bold text-sm border-3 transition-all
          ${isClaimable && feedback?.kind !== 'success'
            ? 'bg-[#C3E8C3] border-[#7DBF7D] text-[#1A4D1A] hover:bg-[#a8d8a8] cursor-pointer'
            : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isPending ? 'Claiming...' : feedback?.kind === 'success' ? 'Claimed!' : 'Get Reward'}
      </button>

      <p className="text-xs text-[#8A7A5E]">
        Write in your journal every day to build your streak. After claiming, build a new 7-day streak to claim again.
      </p>
    </div>
  )
}
