import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Home() {
  return (
    <div><u><Link href="/login">Signup</Link></u></div>
  )
}
