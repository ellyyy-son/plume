"use client"

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

type ProfileLikeUser = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

const DEFAULT_PROFILE_PIC = "/chiikawa.jpg";

export default function Navbar() {
  return <FullNav />;
}

function FullNav() {
  const router = useRouter();
  const supabase = createClient();
  const [isUser, setIsUser] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [username, setUsername] = useState("");
  const [dpURL, setDPURL] = useState(DEFAULT_PROFILE_PIC);
  const [exp, setEXP] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("PROFILE LOOKUP ERROR:", error.message);
        }

        if (!mounted) return;


        setUsername(profileData?.username || getFallbackUsername(user) || "");
        setEXP(profileData?.exp_amount);

         // Convert stored path to public URL
        const picPath = profileData?.profile_pic_url;
        if (typeof picPath === "string" && picPath.trim() !== "") {
          const { data: { publicUrl } } = supabase.storage
            .from("profile_pics")
            .getPublicUrl(picPath);
          setDPURL(publicUrl);
        } else {
          setDPURL(DEFAULT_PROFILE_PIC);
        }

      } catch (error) {
        console.error("PROFILE LOOKUP EXCEPTION:", error);
        if (mounted) {
          setUsername(getFallbackUsername(user) || "");
          setDPURL(DEFAULT_PROFILE_PIC);
          setDPURL(DEFAULT_PROFILE_PIC);
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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
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

    const onExpUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ exp: number }>).detail;
      if (mounted) setEXP(detail.exp);
    };

    window.addEventListener("exp-updated", onExpUpdated);

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener("exp-updated", onExpUpdated);
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
    setEXP(0);
    router.replace('/login');
    router.refresh();
    console.log('Successfully signed out');
  }

  if (!isReady || !isUser) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute top-2 left-2 z-50 p-2 rounded-md"
      >
        <svg
          className="size-8 transition-transform duration-300 ease-in-out hover:stroke-[#6B9FBE]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {isVisible && (
        <div className="w-[18%] shrink-0 top-0 overflow-y-auto sticky h-screen">
          <div className="flex flex-col bg-[#F7F9FC] shadow-sm border-r-15 border-r-[#ADD3EA] pt-8 pb-8 gap-5">
            <div className="flex flex-col items-center font-delius gap-4">
              <img
                src={dpURL}
                width={120}
                height={120}
                alt="Profile Picture"
                className="rounded-full border-4 border-[#4F84A5] w-[120px] h-[120px] object-cover"
              />
              <div className="flex flex-col gap-2 items-center">
                <p className="text-lg font-bold">{username || "user"}</p>
                <p className="text-md font-bold rounded-2xl border-2 border-[#4F84A5]">
                  <span className="m-4">EXP: {exp}</span>
                </p>
              </div>
              <Link href="/profile/edit"><p className="text-sm">edit profile</p></Link>
            </div>
            <nav className="flex flex-col items-center w-full gap-4 font-delius">
              <NavLink href="/" label="home" />
              <NavLink href="/write" label="write entry" />
              <NavLink href="/archive" label="journal archive" />
              <NavLink href="/calendar" label="calendar" />
              <NavLink href="/tasks" label="task list" />
              <NavLink href="/shop" label="shop" />
              <NavLink href="/dashboard" label="dashboard" />
              <NavLink href="/inventory" label="inventory" />
              <NavLink href="/pet-customize" label="customization" />
              <NavLink href="/milestone" label="milestones" />
              <NavLink href="/notification" label="notification" />
            </nav>
            <div className="flex flex-col items-center">
              <button
                className="font-delius py-2 px-4 bg-[#ADD3EA] border-3 border-[#5e94b67d] rounded-3xl font-bold"
                onClick={signOut}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
