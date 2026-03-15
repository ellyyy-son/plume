"use client"

import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

type ProfileLikeUser = { 
  id: string; 
  user_metadata?: Record<string, unknown>; 
};

export default function Navbar() {
  return <FullNav />;
}

function FullNav() {
  const router = useRouter();
  const supabase = createClient();
  const [isUser, setIsUser] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    let mounted = true;

    const getFallbackUsername = (user: ProfileLikeUser | null | undefined) => {
      return typeof user?.user_metadata?.username === "string"
        ? user.user_metadata.username.trim()
        : "";
    };

    const loadProfileUsername = async (user: ProfileLikeUser | null) => {
      if (!user || !mounted) return;

      try {
        const { data: profileData, error } = await supabase
          .from("profile")
          .select("username")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("PROFILE LOOKUP ERROR:", error.message);
        }

        if (!mounted) return;
        setUsername(profileData?.username || getFallbackUsername(user) || "");
      } catch (error) {
        console.error("PROFILE LOOKUP EXCEPTION:", error);
        if (mounted) {
          setUsername(getFallbackUsername(user) || "");
        }
      }
    };

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user as ProfileLikeUser | null;
        if (!mounted) return;
        setIsUser(!!user);

        if (user) {
          void loadProfileUsername(user);
        } else {
          setUsername("");
        }
      } catch (error) {
        console.error("AUTH CHECK ERROR:", error);
        if (mounted) {
          setIsUser(false);
          setUsername("");
        }
      } finally {
        if (mounted) setIsReady(true);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user as ProfileLikeUser | null;
      if (!mounted) return;
      setIsUser(!!user);
      if (user) {
        void loadProfileUsername(user);
      } else {
        setUsername("");
      }
      setIsReady(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      return;
    }
    setIsUser(false);
    setUsername("");
    router.replace('/login');
    router.refresh();
    console.log('Successfully signed out');
  }

  if (!isReady || !isUser) {
    return null;
  }

  return (
    <div className="w-[15%] shrink-0 top-0 sticky h-screen">
      <div className="flex flex-col h-screen bg-[#F7F9FC] shadow-sm border-r-12 border-r-[#ADD3EA] pt-8 pb-8 gap-12">
        <div className="flex flex-col items-center font-delius gap-4">
          <Image src='/chiikawa.jpg' width={120} height={120} alt='Profile Picture' className="rounded-full border-4 border-[#4F84A5]"/>
          <p className="text-lg font-bold">{username || "user"}</p>
          <Link href="/profile/edit"><p className="text-sm">edit profile</p></Link>
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
          <button className="font-delius p-4 bg-[#ADD3EA] rounded-3xl font-bold" onClick={signOut}>Log Out</button>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center text-md font-bold transition-colors text-black hover:underline hover:underline-offset-4 hover:text-[#6B9FBE]"
    >
      {label}
    </Link>
  );
}

