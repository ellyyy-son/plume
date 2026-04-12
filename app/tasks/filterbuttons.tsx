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
    <div className='flex flex-row gap-4 px-4 translate-y-11'>
      <button 
        onClick={() => setFilter('daily')}
        className={`font-delius p-4 border-3 border-[#8FBCD6] rounded-xl font-bold ${
          currentFilter === 'daily' ? 'bg-[#d2e8f6e2]' : 'bg-[#ADD3EA]'
        }`}
      >
        Daily
      </button>
      <button 
        onClick={() => setFilter('week')}
        className={`font-delius p-4 border-3 border-[#8FBCD6] rounded-xl font-bold ${
          currentFilter === 'week' ? 'bg-[#d2e8f6e2]' : 'bg-[#ADD3EA]'
        }`}
      >
        Weekly
      </button>
      <button 
        onClick={() => setFilter()}
        className={`font-delius p-4 border-3 border-[#8FBCD6] rounded-xl font-bold ${
          !currentFilter ? 'bg-[#d2e8f6e2]' : 'bg-[#ADD3EA]'
        }`}
      >
        All
      </button>
      <button 
        onClick={() => setFilter('complete')}
        className={`font-delius border-3 border-[#8FBCD6] p-4 rounded-xl font-bold ${
          currentFilter === 'complete' ? 'bg-[#d2e8f6e2]' : 'bg-[#ADD3EA]'
        }`}
      >
        Completed Tasks
      </button>
      <button 
        onClick={() => setFilter('pending')}
        className={`font-delius p-4 border-3 border-[#8FBCD6] rounded-xl font-bold ${
          currentFilter === 'pending' ? 'bg-[#d2e8f6e2]' : 'bg-[#ADD3EA]'
        }`}
      >
        Pending Tasks
      </button>
    </div>
  )
}