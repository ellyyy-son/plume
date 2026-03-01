"use client"
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
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
        <div>
            <form onSubmit={(e) => {
                e.preventDefault();
                signInWithEmail();
            }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Sign In</button>
            </form>
        </div>
    )
}