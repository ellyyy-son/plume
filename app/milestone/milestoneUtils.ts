export type MilestoneType = 'general' | 'easy' | 'medium' | 'hard'

export const COLLECTION_REWARD = 1000
export const COLLECTION_MAX_INDEX = 49 // threshold 500 = (49+1)*10

export function getCollectionThreshold(index: number): number {
  return (index + 1) * 10
}

const DIFFICULTY_THRESHOLDS = [10, 30, 50, 70, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

export function getMilestoneThreshold(type: MilestoneType, index: number): number {
  if (type === 'general') return (index + 1) * 20
  if (index < DIFFICULTY_THRESHOLDS.length) return DIFFICULTY_THRESHOLDS[index]
  return 1000 + (index - (DIFFICULTY_THRESHOLDS.length - 1)) * 100
}

export function getMilestoneReward(type: MilestoneType, index: number): number {
  if (type === 'general') return 1000 + index * 250
  if (type === 'easy') {
    if (index === 0) return 500
    if (index === 1) return 1000
    return 2000
  }
  if (type === 'medium') {
    if (index === 0) return 1000
    if (index === 1) return 2000
    return 3000
  }
  if (index === 0) return 2000
  if (index === 1) return 3000
  return 5000
}

const MANILA_TZ = 'Asia/Manila'

function toManilaDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TZ }).format(new Date(isoString))
}

function getManilaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TZ }).format(new Date())
}

export function computeJournalStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  // Convert all timestamps to Manila local dates
  const unique = [...new Set(dates.filter(Boolean).map(toManilaDate))].sort().reverse()

  const todayStr = getManilaToday()
  const yesterdayStr = toManilaDate(new Date(Date.now() - 86400000).toISOString())

  // Streak must include today or yesterday to still be alive
  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0

  let streak = 0
  let expectedDate = new Date(unique[0] + 'T00:00:00+08:00')

  for (const d of unique) {
    const expectedStr = new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TZ }).format(expectedDate)
    if (d === expectedStr) {
      streak++
      expectedDate = new Date(expectedDate.getTime() - 86400000)
    } else {
      break
    }
  }

  return streak
}
