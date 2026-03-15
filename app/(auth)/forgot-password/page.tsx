"use client"
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';

export default function Forgot_Password() {
    const [email, setEmail] = useState('');
    const router = useRouter();
    const supabase = createClient();

    async function sendEmail() {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: '/reset-password',
        })
        if (error) {
            console.error('Password Update error:', error.message);
            return;
        }
        router.push('/forgot-password/email-sent');
    }


    return (
        <div className={"bg-[#FBF5D1] px-10 pt-20 pb-15 border-5 border-[#E4DCAB] rounded-4xl justify-items-center translate-x-65 translate-y-15 shadow-xl/40"}>
            <h2 className="font-cherry text-[#2E2805] text-5xl pb-10">FORGOT PASSWORD</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                sendEmail()
            }}>
                {/* email text area */}
                <div className="grid grid-rows-2 w-9/10 py-4 px-10">
                    <label htmlFor="email" className="self-center block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Email</label>
                    <div className="rounded-t-md bg-white wopacity-70 px-3 py-1 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="email" type="email" name="email" placeholder="type your email"
                            onChange={(e) => setEmail(e.target.value)} value={email}
                            className="font-delius block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div>
                </div>

                {/* buttons */}
                <div className="grid grid-rows-2 p-4 gap-2.5">
                    <button type="submit" className="font-delius rounded-2xl bg-[#ADD3EA] px-20 py-2 text-sm font-semibold text-[#524601]">Send to Email</button>
                    <Link href="/login" className="font-delius rounded-2xl text-sm/6 bg-[#F0B6CF] px-20 py-2 font-semibold text-[#524601]">Back to Login</Link>
                </div>
            </form>
        </div>
    );
}

