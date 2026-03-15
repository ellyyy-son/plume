"use client"

import { useRouter } from "next/navigation"

type FilterButtonsProps = {
  currentFilter?: string
}

export default function ArchiveFilter({ currentFilter }: FilterButtonsProps) {
  const router = useRouter()

  function setFilter(filter?: string) {
    if (filter) {
      router.push(`?filter=${filter}`)
    } else {
      router.push('?') 
    }
  }

  return (
    <div className='flex flex-row gap-4 translate-y-1'>
      <button 
        onClick={() => setFilter()}
        className={`font-delius bg-[#FBF5D1] px-12 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D] ${
          !currentFilter ? 'bg-[#FBF5D1]' : 'bg-[#cdc39b]'
        }`}
      >
        All
      </button>
      <button 
        onClick={() => setFilter('week')}
        className={`font-delius bg-[#FBF5D1] px-5 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D] ${
          currentFilter === 'week' ? 'bg-[#FBF5D1]' : 'bg-[#cdc39b]'
        }`}
      >
        This Week
      </button>
      <button 
        onClick={() => setFilter('month')}
        className={`font-delius bg-[#FBF5D1] py-2 px-5 rounded-t-xl border-x-4 border-t-4 border-[#CCC38D] ${
          currentFilter === 'month' ? 'bg-[#FBF5D1]' : 'bg-[#cdc39b]'
        }`}
      >
        This Month
      </button>
      
    </div>
  )
}