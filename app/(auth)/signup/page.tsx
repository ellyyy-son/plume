"use client"
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const supabase = createClient();
    const router = useRouter();

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

        if (data.user) {
            // only create a profile if user successfully signed up
            const { error: profileError } = await supabase.from('profile').insert({
                user_id: data.user.id,
                username: username,
                name: name,
            });

            if (profileError) {
                console.error('Profile creation error:', profileError.message);
                return;
            }
            router.push('/confirm');
            console.log('User signed up and profile created:', data.user.id);
        }
    }

    return (
        <div>
            <form onSubmit={(e) => {
                e.preventDefault();
                signUpNewUser();
            }}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
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
                    pattern="^(?=*.[0-9])(?=*.[@$?])[a-zA-z0-9@$?]{6,20}$"
                    title="Phone number must be in the format 123-456-7890"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Sign Up</button>
            </form>
        </div>
    )
}