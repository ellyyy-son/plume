export type MilestoneType = 'general' | 'easy' | 'medium' | 'hard'

const DIFFICULTY_THRESHOLDS = [1, 30, 50, 70, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]

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

export function computeJournalStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const unique = [...new Set(dates.filter(Boolean))].sort().reverse()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10)

  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0

  let streak = 0
  let expected = new Date(unique[0])
  expected.setHours(0, 0, 0, 0)

  for (const d of unique) {
    if (d === expected.toISOString().slice(0, 10)) {
      streak++
      expected = new Date(expected.getTime() - 86400000)
    } else {
      break
    }
  }

  return streak
}
