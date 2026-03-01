"use client"
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const supabase = createClient();
    const router = useRouter();


    async function signInWithEmail() {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
            options: {
                emailRedirectTo: `${window.location.origin}/confirm`,
            },
        });


        if (error) {
            console.error('Sign in error:', error.message);
            return;
        }
        router.push('/');
        console.log('User signed in:', data.user);
    }

    return (
        <div className={"bg-[#FBF5D1] px-15 pt-20 pb-15 border-5 border-[#E4DCAB] rounded-4xl justify-items-center translate-x-75 translate-y-15 shadow-xl/40"}>
            <h2 className="font-cherry text-[#2E2805] text-7xl pb-10">Login</h2>

            <form onSubmit={(e) => {
                e.preventDefault();
                signInWithEmail();
            }}>
                {/* e-mail text area */}
                <div className="grid grid-rows-2 w-1/1 py-4 px-3">
                    <label htmlFor="email" className="self-center block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">E-mail</label>
                    <div className="rounded-t-md bg-white wopacity-70 px-3 py-1 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="email" type="email" name="new-password" placeholder="type your e-mail" className="font-delius block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6"
                            value={email}
                            placeholder="Email"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                {/* password text area */}
                <div className="grid grid-rows-2 w-1/1 py-4 px-3">
                    <label htmlFor="password" className="self-center block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Password</label>
                    <div className="rounded-t-md bg-white wopacity-70 px-3 py-1 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="password" type="password" name="password" placeholder="type your password"
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
                    <button type="button" className="font-delius rounded-2xl text-sm/6 bg-[#F0B6CF] px-23 py-2 font-semibold text-[#524601]">Reset Password</button>
                </div>
            </form>
        </div>
    );
}
