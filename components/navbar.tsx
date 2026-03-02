"use client"

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  return (
    <>
      <div className="w-[15%]">
        <FullNav />
      </div>
    </>
  );
}

import { usePathname } from "next/navigation";

/// FullNav
function FullNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isUser, setIsUser] = useState(false);
  const supabase = createClient();

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in.');
      return;
    }
    const boolUser = user ? true : false;
    setIsUser(boolUser)
  }

  useEffect(() => {
    checkUser();
  })

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error.message);
      return;
    }
    setIsUser(false);
    router.push('/');
    console.log('Successfully signed out')
  }



  return (
    <div className="flex flex-col h-screen bg-[#F7F9FC] shadow-sm border-r-12 border-r-[#ADD3EA] pt-8 pb-8 gap-12">
      <div className="flex flex-col items-center font-delius gap-4">
        <Image src='/chiikawa.jpg' width={120} height={120} className="rounded-full border-4 border-[#4F84A5]" alt="avatar" />
        <p className="text-lg font-bold">username</p>
        {isUser && <Link href="/profile/edit"><p className="text-sm">edit profile</p></Link>}
      </div>
      <nav className="flex flex-col items-center w-full gap-4 font-delius">
        <NavLink href="/" label="home" active={pathname === "/"} />
        <NavLink href="/" label="write entry" active={pathname === "/"} />
        <NavLink href="/" label="journal archive" active={pathname === "/"} />
        <NavLink href="/" label="calendar" active={pathname === "/"} />
        <NavLink href="/" label="task list" active={pathname === "/"} />
        <NavLink href="/" label="shop" active={pathname === "/"} />
        <NavLink href="/" label="gacha" active={pathname === "/"} />
        <NavLink href="/" label="dashboard" active={pathname === "/"} />
        <NavLink href="/" label="inventory" active={pathname === "/"} />
        <NavLink href="/" label="item list" active={pathname === "/"} />
      </nav>
      <div className="flex flex-col items-center">
        {isUser ? <button className="font-delius p-4  bg-[#ADD3EA] rounded-3xl font-bold" onClick={signOut}>Log Out</button> : <Link className="font-delius p-4  bg-[#ADD3EA] rounded-3xl font-bold" href="/login">Login</Link>}

      </div>
    </div>
  );
}

// Helper component to remove repetitive code and remove fixed widths
function NavLink({ href, label, active }: { href: string, label: string, active: boolean }) {
  return (
    <Link
      href={href}
      className={"flex items-center text-md font-bold transition-colors text-black hover:underline hover:underline-offset-4 hover:text-[#6B9FBE]"}
    >
      {label}
    </Link>
  );
}