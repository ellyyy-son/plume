'use client'

import { useState, useTransition } from 'react'
import { claimCollectionMilestoneReward } from './actions'
import { getCollectionThreshold, COLLECTION_REWARD, COLLECTION_MAX_INDEX } from './milestoneUtils'

type CollectionMilestoneCardProps = {
  ownedCount: number
  nextIndex: number
  isClaimable: boolean
}

export default function CollectionMilestoneCard({ ownedCount, nextIndex, isClaimable }: CollectionMilestoneCardProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const allDone = nextIndex > COLLECTION_MAX_INDEX
  const threshold = allDone ? getCollectionThreshold(COLLECTION_MAX_INDEX) : getCollectionThreshold(nextIndex)
  const progress = Math.min(ownedCount / threshold, 1)
  const nextThreshold = !allDone && nextIndex < COLLECTION_MAX_INDEX ? getCollectionThreshold(nextIndex + 1) : null

  function handleClaim() {
    setFeedback(null)
    startTransition(async () => {
      const result = await claimCollectionMilestoneReward(nextIndex)
      if (result.success) {
        setFeedback({ kind: 'success', message: `+${result.reward?.toLocaleString()} EXP claimed!` })
      } else {
        setFeedback({ kind: 'error', message: result.error ?? 'Failed to claim.' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-4 border-[#C4B8D4] bg-[#EDE4F8] p-5 font-delius shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#EDE4F8] border-2 border-[#C4B8D4] text-[#3A1A6E]">
          Collection
        </span>
        <span className="text-sm text-[#5A4A2E] font-bold">{ownedCount} owned</span>
      </div>

      {allDone ? (
        <p className="text-[#1A4D1A] font-bold text-base">All collection milestones completed!</p>
      ) : (
        <>
          <p className="text-[#2E2805] text-base font-bold">
            Own <span className="text-[#3A1A6E]">{threshold}</span> accessories
          </p>

          <div className="w-full bg-white/60 rounded-full h-3 border border-white">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isClaimable ? 'bg-green-400' : 'bg-[#B8A8D4]'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-[#5A4A2E]">{ownedCount} / {threshold} accessories</p>

          <div className="flex items-center gap-2 bg-[#F5E8A0] border-2 border-[#D7B87F] rounded-xl px-4 py-2 w-fit">
            <span className="text-[#2E2805] font-bold text-sm">Reward:</span>
            <span className="text-[#7A5500] font-bold">{COLLECTION_REWARD.toLocaleString()} EXP</span>
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

          {nextThreshold && (
            <p className="text-xs text-[#8A7A5E] mt-1">
              Next: {nextThreshold} accessories → {COLLECTION_REWARD.toLocaleString()} EXP
            </p>
          )}
        </>
      )}
    </div>
  )
}
