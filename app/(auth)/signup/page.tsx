"use client"
import { createClient } from '@/utils/supabase/client';
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';

const usernamePattern = /^[A-Za-z0-9_]+$/;

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    async function checkSignupAvailability(selectedUsername: string, selectedEmailLower: string) {
        try {
            const response = await fetch(
                `/api/profile/check?username=${encodeURIComponent(selectedUsername)}&email=${encodeURIComponent(selectedEmailLower)}`
            );
            const payload = await response.json().catch(() => null);

            if (!response.ok || !payload?.ok) {
                return {
                    ok: false,
                    error: payload?.error || "Unable to verify username or email right now.",
                };
            }

            return {
                ok: true,
                emailTaken: !!payload.emailTaken,
                usernameTaken: !!payload.usernameTaken,
            };
        } catch {
            return {
                ok: false,
                error: "Unable to reach signup checks right now. Please try again.",
            };
        }
    }

    function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfilePicPreview(URL.createObjectURL(file));
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            localStorage.setItem('pending_profile_pic', JSON.stringify({ base64, name: file.name, type: file.type }));
        };
        reader.readAsDataURL(file);
    }

    async function signUpNewUser() {
        const selectedUsername = username.trim();
        const selectedName = name.trim();
        const selectedEmail = email.trim();
        const selectedPassword = password.trim();
        const selectedEmailLower = selectedEmail.toLowerCase();

        if (!selectedUsername) {
            alert('Username is required.');
            return;
        }

        if (!usernamePattern.test(selectedUsername)) {
            alert('Username can only contain letters, numbers, and underscores.');
            return;
        }

        if (!selectedName) {
            alert('Name is required.');
            return;
        }

        if (!selectedEmail) {
            alert('Email is required.');
            return;
        }

        if (!selectedPassword) {
            alert('Password is required.');
            return;
        }

        const availability = await checkSignupAvailability(selectedUsername, selectedEmailLower);

        if (!availability.ok) {
            const reason = availability.error || "Unable to verify username or email right now.";
            console.warn('Could not verify username/email availability:', reason);
            alert(`Signup check failed. ${reason}`);
            return;
        }

        if (availability.emailTaken) {
            alert('An account with this email already exists. Please use another email.');
            return;
        }

        if (availability.usernameTaken) {
            alert('Username is already taken. Please choose another one.');
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: selectedEmail,
            password: selectedPassword,
            options: {
                emailRedirectTo: `${window.location.origin}/confirm`,
                data: {
                    name: selectedName,
                    username: selectedUsername,
                },
            },
        });

        if (error) {
            console.error('Sign up error:', error.message, error.code);
            const msg = error.message.toLowerCase();
            if (msg.includes("database error saving new user")) {
                // Re-check availability to give an accurate message
                const recheck = await checkSignupAvailability(selectedUsername, selectedEmailLower);
                if (recheck.ok && recheck.emailTaken) {
                    alert('An account with this email already exists. Please use another email.');
                } else if (recheck.ok && recheck.usernameTaken) {
                    alert('Username is already taken. Please choose another one.');
                } else {
                    alert('Signup failed. Please try again or contact support.');
                }
            } else if (
                msg.includes("username") ||
                error.code === '23505'
            ) {
                alert('Username is already taken. Please choose another one.');
            } else if (
                msg.includes("already registered") ||
                msg.includes("email")
            ) {
                alert('An account with this email already exists. Please use another email.');
            } else {
                alert(error.message);
            }
            return;
        }

        if (data.user) {
            console.log("Signed up user id:", data.user.id);
            console.log("Signed up user metadata:", data.user.user_metadata);
            router.push('/signup/email-sent');
            console.log('Signup initiated for user:', data.user.id);
        }
    }

    return (
        <div className={"bg-[#FBF5D1] px-20 pt-8 pb-15 border-5 border-[#E4DCAB] rounded-3xl justify-items-center shadow-xl/40"}>
            <h2 className="font-cherry text-[#2E2805] text-5xl">CREATE ACCOUNT</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                signUpNewUser();
            }}>
                <div className="mt-4 gap-y-2 flex flex-col justify-center items-center">
                    {profilePicPreview ? (
                        <img src={profilePicPreview} alt="Profile preview" className="rounded-full w-25 h-25 object-cover" />
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" data-slot="icon" aria-hidden="true" className="size-25 text-gray-400">
                            <path d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" fillRule="evenodd" />
                        </svg>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="font-delius rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-[#2E2805] inset-ring inset-ring-white/5 hover:bg-[#F0B6CF]/50">
                        {profilePicPreview ? 'change photo' : 'upload photo'}
                    </button>
                </div>

                {/* name text area */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="name" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Name</label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#ADD3EA]">
                        <input id="name" type="text" name="name" placeholder="name" value={name}
                            onChange={(e) => setName(e.target.value)} required
                            className="font-delius block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div></div>
                {/* username text area */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="username" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Username</label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="username" type="text" name="username" placeholder="username"
                            value={username} onChange={(e) => setUsername(e.target.value)} required
                            className="block font-delius min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div>
                </div>
                {/* e-mail text area */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="email" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">E-mail</label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="email" type="email" name="email" placeholder="email"
                            value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="block font-delius min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div>
                </div>
                {/* password text area */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="password" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">Password</label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input id="password" type="password" name="password" placeholder="password"
                            onChange={(e) => setPassword(e.target.value)} required
                            className="block font-delius min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6" />
                    </div>
                </div>
                {/* buttons */}
                <div className="flex p-4 gap-20">
                    <button type="submit" className="font-delius rounded-xl bg-[#ADD3EA] px-15 py-2 text-sm font-semibold text-[#524601] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Sign Up</button>
                    <Link href="/login" className="font-delius rounded-xl text-sm/6 bg-[#F0B6CF] px-15 py-2 font-semibold text-[#524601]">Log In</Link>
                </div>
            </form>
        </div>
    );
}

