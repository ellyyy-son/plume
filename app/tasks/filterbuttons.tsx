"use client"

import { useRouter } from "next/navigation"

type FilterButtonsProps = {
  currentFilter?: string
}

export default function FilterButtons({ currentFilter }: FilterButtonsProps) {
  const router = useRouter()

  function setFilter(filter?: string) {
    if (filter) {
      router.push(`?filter=${filter}`)
    } else {
      router.push('?') 
    }
  }

  return (
    <div className='flex flex-row gap-8'>
      <button 
        onClick={() => setFilter('daily')}
        className={`font-delius p-4 rounded-xl font-bold ${
          currentFilter === 'daily' ? 'bg-[#7AB8D6]' : 'bg-[#ADD3EA]'
        }`}
      >
        Daily
      </button>
      <button 
        onClick={() => setFilter('week')}
        className={`font-delius p-4 rounded-xl font-bold ${
          currentFilter === 'week' ? 'bg-[#7AB8D6]' : 'bg-[#ADD3EA]'
        }`}
      >
        Weekly
      </button>
      <button 
        onClick={() => setFilter()}
        className={`font-delius p-4 rounded-xl font-bold ${
          !currentFilter ? 'bg-[#7AB8D6]' : 'bg-[#ADD3EA]'
        }`}
      >
        All
      </button>
      <button 
        onClick={() => setFilter('complete')}
        className={`font-delius p-4 rounded-xl font-bold ${
          currentFilter === 'complete' ? 'bg-[#7AB8D6]' : 'bg-[#ADD3EA]'
        }`}
      >
        Completed Tasks
      </button>
      <button 
        onClick={() => setFilter('pending')}
        className={`font-delius p-4 rounded-xl font-bold ${
          currentFilter === 'pending' ? 'bg-[#7AB8D6]' : 'bg-[#ADD3EA]'
        }`}
      >
        Pending Tasks
      </button>
    </div>
  )
}