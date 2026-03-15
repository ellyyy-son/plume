"use client"
import { createClient } from '@/utils/supabase/client';
import { ensureProfileRecord } from '@/utils/supabase/ensure-profile';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const supabase = createClient();
    const router = useRouter();


    async function signInWithEmail() {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,

        });


        if (error) {
  console.error("SUPABASE ERROR:", error)
  alert(error.message)
  return
}

        if (data.user) {
            const profileResult = await ensureProfileRecord(supabase, data.user, {
                accessToken: data.session?.access_token,
            })
            if (!profileResult.ok) {
                console.error("Profile check error:", profileResult.error)
            }
        }
        router.refresh();
        router.replace('/');
        console.log('User signed in:', data.user);
    }

    return (
        <div className="bg-[#FBF5D1] px-15 pt-20 pb-15 border-5 border-[#E4DCAB] rounded-4xl justify-items-center shadow-xl/40">
            <h2 className="font-cherry text-[#2E2805] text-7xl pb-10">Login</h2>

            <form onSubmit={(e) => {
                e.preventDefault();
                signInWithEmail();
            }}>
                {/* e-mail text area */}
                <div className="grid grid-rows-2 w-1/1 py-4 px-3">
                    <label htmlFor="email" className="self-center block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">E-mail</label>
                    <div className="rounded-t-md bg-white wopacity-70 px-3 py-1 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="email" type="email" name="new-password" placeholder="E-mail" className="font-delius block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                {/* password text area */}
                <div className="grid grid-rows-2 w-1/1 py-4 px-3">
                    <label htmlFor="password" className="self-center block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Password</label>
                    <div className="rounded-t-md bg-white wopacity-70 px-3 py-1 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="password" type="password" name="password" 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="font-delius block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div>
                </div>

                {/* buttons */}
                <div className="grid grid-rows-2 p-4 gap-2.5">
                    <button type="submit" className="font-delius rounded-2xl bg-[#ADD3EA] px-23 py-2 text-sm font-semibold text-[#524601]">Login</button>
                    <Link href="/signup" className="font-delius rounded-2xl text-sm/6 bg-[#F0B6CF] px-23 py-2 font-semibold text-[#524601]">Create Account</Link>
                    <Link href="/forgot-password" className="font-delius rounded-2xl text-sm/6 bg-[#F0B6CF] px-23 py-2 font-semibold text-[#524601]">Forgot Password</Link>
                </div>
            </form>
        </div>
    );
}
