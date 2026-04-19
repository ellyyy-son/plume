'use client'
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchUser } from './profile';
import Link from 'next/link';

const usernamePattern = /^[A-Za-z0-9_]+$/;
const DEFAULT_PROFILE_PIC = "/chiikawa.jpg";

export default function EditProfile() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [dpURL, setDPURL] = useState(DEFAULT_PROFILE_PIC);
    const [storedPath, setStoredPath] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const supabase = createClient();

    function getProfilePicURL(value: unknown): string {
        return typeof value === "string" && value.trim() !== "" ? value : DEFAULT_PROFILE_PIC;
    }

    function getPublicURL(path: string): string {
        const { data: { publicUrl } } = supabase.storage
            .from('profile_pics')
            .getPublicUrl(path);
        return publicUrl;
    }

    useEffect(() => {
        async function loadProfile() {
            const result = await fetchUser();
            if (!result) return;
            setUserId(result.user.id);
            setEmail(result.user.email ?? '');
            setName(result.profile.name);
            setUsername(result.profile.username);

            const rawPic = result.profile.profile_pic_url;
            if (typeof rawPic === 'string' && rawPic.trim() !== '') {
                // stored as path, construct full URL for display
                setStoredPath(rawPic);
                setDPURL(getPublicURL(rawPic));
            } else {
                setDPURL(DEFAULT_PROFILE_PIC);
            }
        }
        loadProfile();
    }, []);

    async function uploadProfilePic(file: File): Promise<string | null> {
        if (!userId || !username.trim()) return null;

        const ext = file.name.split('.').pop();
        const newPath = `${username.trim()}_profile_${Date.now()}.${ext}`;

        // Delete old file from storage if there was one
        if (storedPath) {
            const { error: deleteError } = await supabase.storage
                .from('profile_pics')
                .remove([storedPath]);
            if (deleteError) console.error('Delete error:', deleteError.message);
        }

        // Upload new file
        const { data, error } = await supabase.storage
            .from('profile_pics')
            .upload(newPath, file, {
                upsert: true,
                contentType: file.type,
            });

        if (error) {
            console.error('Upload error:', error.message);
            return null;
        }

        return data.path;
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        const previewURL = URL.createObjectURL(file);
        setDPURL(previewURL);

        setUploading(true);
        const newPath = await uploadProfilePic(file);
        setUploading(false);

        if (newPath) {
            setStoredPath(newPath);
            setDPURL(getPublicURL(newPath));

            // Persist path to profile table immediately
            if (userId) {
                const { error } = await supabase
                    .from('profile')
                    .update({ profile_pic_url: newPath })
                    .eq('user_id', userId);
                if (error) console.error('Profile pic save error:', error.message);
            }
        }
    }

    async function editProfile() {
        const trimmedName = name.trim();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName || !trimmedUsername || !trimmedEmail) {
            alert('Name, username, and email are required.');
            return;
        }

        if (!usernamePattern.test(trimmedUsername)) {
            alert('Username can only contain letters, numbers, and underscores.');
            return;
        }

        const { data, error } = await supabase.auth.updateUser({
            email: trimmedEmail,
        });

        if (error) {
            console.error('Edit error:', error.message);
            return;
        }

        if (userId) {
            const { error: profileError } = await supabase
                .from('profile')
                .update({
                    username: trimmedUsername,
                    name: trimmedName,
                })
                .eq('user_id', userId);

            if (profileError) {
                console.error('Profile update error:', profileError.message);
                return;
            }
        }

        console.log('Successfully edited user', data.user);
        router.push('/');
    }

    return (
        <div className="bg-[#FBF5D1] px-20 pt-12 pb-15 border-5 border-[#E4DCAB] rounded-3xl justify-items-center translate-x-65 translate-y-15 shadow-xl/40">
            <h2 className="font-cherry text-[#2E2805] text-5xl">EDIT ACCOUNT</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                editProfile();
            }}>
                {/* Profile picture */}
                <div className="mt-4 gap-y-2 flex flex-col justify-center items-center">
                    <img
                        src={dpURL}
                        alt="Profile picture"
                        className="rounded-full w-25 h-25 object-cover"
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                    />
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="font-delius rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-[#2E2805] inset-ring inset-ring-white/5 hover:bg-[#ADD3EA]/50 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Edit photo'}
                    </button>
                </div>

                {/* Name */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="name" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">
                        Name
                    </label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="enter new name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="font-delius block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6"
                        />
                    </div>
                </div>

                {/* Username */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="username" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">
                        Username
                    </label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="enter new username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="block font-delius min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="flex place-content-between w-1/1 py-4">
                    <label htmlFor="email" className="block font-delius text-xl/6 font-bold text-[#2E2805] basis-1/3">
                        E-mail
                    </label>
                    <div className="rounded-t-md bg-white opacity-70 px-3 py-1 basis-2/3 border-b-3 border-[#CCC38D] focus-within:border-[#F0B6CF]">
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="enter new e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="block font-delius min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-[#2E2805] placeholder:text-[#CCC38D] focus:outline-none sm:text-sm/6"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex p-4 gap-20">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="font-delius rounded-xl bg-[#ADD3EA] px-15 py-2 text-sm font-semibold text-[#524601] disabled:opacity-50"
                    >
                        Save
                    </button>
                    <Link
                        href="/"
                        className="font-delius rounded-xl text-sm/6 bg-[#F0B6CF] px-15 py-2 font-semibold text-[#524601]"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}