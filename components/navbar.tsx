"use client"

import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export default function Navbar() {
  return <FullNav />;
}

/// FullNav
function FullNav() {
  const router = useRouter();
  const supabase = createClient();
  const [isUser, setIsUser] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProfileUsername = async (user: { id: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) {
        setUsername("");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profile")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("PROFILE LOOKUP ERROR:", error.message);
      }

      const fallbackUsername =
        typeof user.user_metadata?.username === "string"
          ? user.user_metadata.username.trim()
          : "";

      setUsername(profileData?.username || fallbackUsername || "");
    };

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsUser(!!user);
      await loadProfileUsername(user as { id: string; user_metadata?: Record<string, unknown> } | null);
      setIsReady(true);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setIsUser(!!session?.user);
      await loadProfileUsername(session?.user as { id: string; user_metadata?: Record<string, unknown> } | null);
      setIsReady(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  if (!isUser) {
    return null;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error.message);
      return;
    }
    setIsUser(false);
    router.replace('/login');
    router.refresh();
    console.log('Successfully signed out')
  }



  return (
    <div className="w-[15%] shrink-0 top-0 sticky h-screen">
      <div className="flex flex-col h-screen bg-[#F7F9FC] shadow-sm border-r-12 border-r-[#ADD3EA] pt-8 pb-8 gap-12">
      <div className="flex flex-col items-center font-delius gap-4">
          <Image src='/chiikawa.jpg' width={120} height={120} alt='Profile Picture' className="rounded-full border-4 border-[#4F84A5]"/>
          {isUser && <p className="text-lg font-bold">{username || "user"}</p>}
          {isUser && <Link href="/profile/edit"><p className="text-sm">edit profile</p></Link>}
      </div>
      <nav className="flex flex-col items-center w-full gap-4 font-delius">
          <NavLink href="/" label="home" />
          <NavLink href="/journal" label="write entry" />
          <NavLink href="/journal" label="journal archive" />
          <NavLink href="/" label="calendar" />
          <NavLink href="/tasks" label="task list" />
          <NavLink href="/" label="shop" />
          <NavLink href="/" label="gacha" />
          <NavLink href="/" label="dashboard" />
          <NavLink href="/" label="inventory" />
          <NavLink href="/" label="item list" />
      </nav>
      <div className="flex flex-col items-center">
        <button className="font-delius p-4  bg-[#ADD3EA] rounded-3xl font-bold" onClick={signOut}>Log Out</button>
      </div>
      </div>
    </div>
  );
}

// Helper component to remove repetitive code and remove fixed widths
function NavLink({ href, label }: { href: string, label: string }) {
  return (
    <Link
      href={href}
      className={"flex items-center text-md font-bold transition-colors text-black hover:underline hover:underline-offset-4 hover:text-[#6B9FBE]"}
    >
      {label}
    </Link>
  );
}
