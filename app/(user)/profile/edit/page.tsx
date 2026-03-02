"use client"
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchUser } from './profile';
import Link from 'next/link';

export default function EditProfile() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            const result = await fetchUser();
            if (!result) return;
            setUserId(result.user.id);
            setEmail(result.user.email ?? '');
            setName(result.profile.name);
            setUsername(result.profile.username);
        }
        loadProfile();
    }, []);

    async function editProfile() {
        const { data, error } = await supabase.auth.updateUser({
            email: email,
        });


        if (error) {
            console.error('Edit error:', error.message);
            return;
        }

        if (userId) {
            const { error: profileError } = await supabase
                .from('profile')
                .update({
                    username: username,
                    name: name,
                })
                .eq('user_id', userId);

            if (profileError) {
                console.error('Profile update error:', profileError.message);
                return;
            }
        }

        router.push('/');
        console.log('Successfully edited user', data.user);
    }

    return (
        <div className={"bg-[#FBF5D1] px-20 pt-12 pb-15 border-5 border-[#E4DCAB] rounded-3xl justify-items-center translate-x-65 translate-y-15 shadow-xl/40"}>
            <h2 className="font-cherry text-[#2E2805] text-5xl">EDIT ACCOUNT</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                editProfile();
            }}>
                <div className="mt-4 gap-x-3 justify-items-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" data-slot="icon" aria-hidden="true" className="size-30 text-gray-500">
                        <path d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd" fill-rule="evenodd" />
                    </svg>
                    <button type="button" className="font-delius rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-[#2E2805] inset-ring inset-ring-white/5 hover:bg-[#ADD3EA]/50">Edit photo</button>
                </div>

                {/* name text area */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="name" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Name</label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="name" type="text" name="name" placeholder="enter new name"
                            value={name} onChange={(e) => setName(e.target.value)} required
                            className="font-delius block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div></div>
                {/* username text area */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="username" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Username</label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="username" type="text" name="username" placeholder="enter new username"
                            value={username} onChange={(e) => setUsername(e.target.value)} required
                            className="block font-delius min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div>
                </div>
                {/* e-mail text area */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="email" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">E-mail</label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="email" type="email" name="email" placeholder="enter new e-mail" value={email}
                            onChange={(e) => setEmail(e.target.value)} required
                            className="block font-delius min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div>
                </div>

                {/* buttons */}
                <div className="flex p-4 gap-20">
                    <button type="submit" className="font-delius rounded-xl bg-[#ADD3EA] px-15 py-2 text-sm font-semibold text-[#524601]">Save</button>
                    <Link href="/" className="font-delius rounded-xl text-sm/6 bg-[#F0B6CF] px-15 py-2 font-semibold text-[#524601]">Cancel</Link>
                </div>
            </form>
        </div>
    );
}
