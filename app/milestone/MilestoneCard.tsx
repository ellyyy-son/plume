'use client'

import { useState, useTransition } from 'react'
import { claimMilestoneReward } from './actions'
import { getMilestoneReward, getMilestoneThreshold } from './milestoneUtils'
import type { MilestoneType } from './milestoneUtils'

type MilestoneCardProps = {
  type: MilestoneType
  label: string
  nextIndex: number
  threshold: number
  reward: number
  completedCount: number
  isClaimable: boolean
  accentBg: string
  accentBorder: string
  accentText: string
  difficultyName: string | null
}

export default function MilestoneCard({
  type,
  label,
  nextIndex,
  threshold,
  reward,
  completedCount,
  isClaimable,
  accentBg,
  accentBorder,
  accentText,
  difficultyName,
}: MilestoneCardProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const progress = Math.min(completedCount / threshold, 1)
  const nextThreshold = getMilestoneThreshold(type, nextIndex + 1)
  const nextReward = getMilestoneReward(type, nextIndex + 1)

  function handleClaim() {
    setFeedback(null)
    startTransition(async () => {
      const result = await claimMilestoneReward(type, nextIndex, difficultyName)
      if (result.success) {
        setFeedback({ kind: 'success', message: `+${result.reward} EXP claimed!` })
      } else {
        setFeedback({ kind: 'error', message: result.error ?? 'Failed to claim.' })
      }
    })
  }

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border-4 ${accentBorder} ${accentBg} p-5 font-delius shadow-md`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${accentBg} border-2 ${accentBorder} ${accentText}`}>
          {label}
        </span>
        <span className="text-sm text-[#5A4A2E] font-bold">{completedCount} completed</span>
      </div>

      <p className="text-[#2E2805] text-base font-bold">
        Complete <span className={accentText}>{threshold}</span> {label.toLowerCase()}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-white/60 rounded-full h-3 border border-white">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isClaimable ? 'bg-green-400' : 'bg-[#C17F9E]'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="text-xs text-[#5A4A2E]">
        {completedCount} / {threshold} tasks
      </p>

      {/* Reward display */}
      <div className="flex items-center gap-2 bg-[#F5E8A0] border-2 border-[#D7B87F] rounded-xl px-4 py-2 w-fit">
        <span className="text-[#2E2805] font-bold text-sm">Reward:</span>
        <span className="text-[#7A5500] font-bold">{reward.toLocaleString()} EXP</span>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={`text-sm font-bold ${feedback.kind === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {feedback.message}
        </p>
      )}

      {/* Claim button */}
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

      {/* Next milestone hint */}
      <p className="text-xs text-[#8A7A5E] mt-1">
        Next: {nextThreshold} tasks → {nextReward.toLocaleString()} EXP
      </p>
    </div>
  )
}
