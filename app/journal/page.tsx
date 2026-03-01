import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'


export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  return (
     <>
      <main className="min-h-screen bg-[#F0B6CF]">

      {/* Header */}
      <header className="w-screen bg-[#FBF5D1] px-8 py-10">
        <h1
          className="text-center text-[#163F55] text-4xl font-normal"
          style={{ fontFamily: '"Cherry Bomb One", system-ui' }}
        >
          How are you feeling today?
        </h1>

        {/* Mood buttons */}
        <div className="flex flex-wrap justify-center mt-6 gap-2">
          <button className="bg-transparent text-[#FA5659] border-none p-6 rounded-xl text-xl cursor-pointer hover:bg-[#ffb3ba] transition-colors">
            <span className="material-symbols-outlined">sentiment_stressed</span>
          </button>
          <button className="bg-transparent text-[#F7A34A] border-none p-6 rounded-xl text-xl cursor-pointer hover:bg-[#ffdfba] transition-colors">
            <span className="material-symbols-outlined">sentiment_worried</span>
          </button>
          <button className="bg-transparent text-[#F8D042] border-none p-6 rounded-xl text-xl cursor-pointer hover:bg-[#ffffba] transition-colors">
            <span className="material-symbols-outlined">sentiment_neutral</span>
          </button>
          <button className="bg-transparent text-[#62B64D] border-none p-6 rounded-xl text-xl cursor-pointer hover:bg-[#baffc9] transition-colors">
            <span className="material-symbols-outlined">sentiment_calm</span>
          </button>
          <button className="bg-transparent text-[#484572] border-none p-6 rounded-xl text-xl cursor-pointer hover:bg-[#bae1ff] transition-colors">
            <span className="material-symbols-outlined">sentiment_satisfied</span>
          </button>
        </div>
      </header>

      {/* Journal form */}
      <form action="/submit-article" method="POST" className="relative">
        <textarea
          id="article-content"
          name="content"
          placeholder="Start writing..."
          className="
            block w-[80%] mx-[10%] mt-[5%]
            min-h-110 p-3
            border-2 border-[#ccc] rounded
            bg-[#f8f8f8]
            text-base
            resize-none
            focus:outline-none focus:border-[#163F55]
          "
          style={{ fontFamily: '"Delius Unicase", cursive' }}
        />

        {/* Save button */}
        <button
          type="submit"
          className="
            fixed right-4 bottom-[120px]
            bg-[#FBF5D1] text-[#163F55]
            border-none p-6 rounded-xl
            cursor-pointer text-xl
            hover:bg-[#F0B6CF] transition-colors
          "
        >
          <span className="material-icons">save</span>
        </button>

        {/* Upload / add button */}
        <button
          type="button"
          className="
            fixed right-4 bottom-5
            bg-[#ADD3EA] text-[#163F55]
            border-none p-6 rounded-xl
            cursor-pointer text-xl
            hover:bg-[#F0B6CF] transition-colors
          "
        >
          <span className="material-icons">add</span>
        </button>
      </form>
    </main>
    </>
  )
}
