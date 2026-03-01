'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';

type Status = 'idle' | 'processing' | 'success' | 'error' | 'resend_sent';

export default function ConfirmPage() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [email, setEmail] = useState<string>('');

    useEffect(() => {
        const accessToken = searchParams.get('access_token') || searchParams.get('token');
        const emailParam = searchParams.get('email');

        if (emailParam) setEmail(emailParam);

        if (accessToken) {
            setStatus('processing');

            (async () => {
                try {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: searchParams.get('refresh_token') || '',
                    });

                    if (error) {
                        console.error('confirm setSession error', error);
                        setStatus('error');
                        setMessage(error.message || 'Failed to complete sign in. Please try signing in manually.');
                        return;
                    }

                    setStatus('success');
                    setMessage('Email confirmed — signing you in... Redirecting.');
                    setTimeout(() => router.push('/dashboard'), 1500);

                } catch (err: any) {
                    console.error('confirm error', err);
                    setStatus('error');
                    setMessage(err?.message ?? 'Unexpected error while confirming email.');
                }
            })();
        }
    }, [searchParams, router]);

    const handleResend = async () => {
        if (!email) {
            setMessage('Please enter the email used to sign up.');
            return;
        }

        setStatus('processing');
        setMessage(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });

            if (error) {
                console.error('resend error', error);
                setStatus('error');
                if (error.message?.toLowerCase().includes('rate limit')) {
                    setMessage('We sent an email recently — please wait a few minutes before requesting another.');
                } else {
                    setMessage(error.message || 'Unable to resend confirmation email.');
                }
                return;
            }

            setStatus('resend_sent');
            setMessage('Confirmation email sent. Please check your inbox (and spam).');

        } catch (err: any) {
            console.error('resend unexpected', err);
            setStatus('error');
            setMessage('Unexpected error while resending confirmation email.');
        }
    };

    return (
        <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
            <h1>Email confirmation</h1>

            {status === 'processing' && <p>Processing... please wait.</p>}

            {status === 'success' && (
                <div>
                    <p>{message}</p>
                    <p>Redirecting...</p>
                </div>
            )}

            {(status === 'idle' || status === 'error' || status === 'resend_sent') && (
                <div>
                    <p>
                        If you clicked a confirmation link but nothing happened, enter your email below to resend.
                    </p>
                    <label style={{ display: 'block', marginTop: 12 }}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            style={{ display: 'block', marginTop: 6, padding: '8px 10px', width: '100%' }}
                        />
                    </label>
                    <div style={{ marginTop: 12 }}>
                        <button onClick={handleResend} disabled={status === 'processing'}>
                            Resend confirmation email
                        </button>
                    </div>
                    {status === 'resend_sent' && (
                        <p>Check your inbox. If you don't see it, check spam or wait a few minutes.</p>
                    )}
                    {status === 'error' && message && (
                        <p style={{ color: 'red' }}>{message}</p>
                    )}
                </div>
            )}
        </main>
    );
}