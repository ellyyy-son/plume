import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import './globals.css'

<Link href="/tasks">Go to Tasks</Link>

export default function Page() {
  return <div><u><Link href="/tasks">Go to Tasks</Link></u></div>
}
