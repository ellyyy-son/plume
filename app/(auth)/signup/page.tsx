"use client"
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react'

export default function Page() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const supabase = createClient();

    async function signUpNewUser() {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: `${window.location.origin}/confirm`,
            },
        });


        if (error) {
            console.error('Sign up error:', error.message);
            return;
        }

        console.log('User signed up:', data.user);
    }

    return (
        <div>
            <form onSubmit={(e) => {
                e.preventDefault();
                signUpNewUser();
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
                <button type="submit">Sign Up</button>
            </form>
        </div>
    )
}