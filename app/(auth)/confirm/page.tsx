"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/utils/supabase/client';
import { ensureProfileRecord } from '@/utils/supabase/ensure-profile';

export default function Confirm() {
  const [status, setStatus] = useState("Preparing your account...");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function ensureProfileForConfirmedUser() {
      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData.user) {
        setStatus("Could not verify your session. Please reopen the confirmation link from your email.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const profileResult = await ensureProfileRecord(
        supabase,
        userData.user,
        {
          name:
            typeof userData.user.user_metadata?.name === "string"
              ? userData.user.user_metadata.name.trim()
              : "",
          username:
            typeof userData.user.user_metadata?.username === "string"
              ? userData.user.user_metadata.username.trim()
              : "",
          ...(accessToken ? { accessToken } : {}),
        }
      );

      if (!profileResult.ok) {
        console.error("Profile bootstrap on confirm failed:", profileResult.error);
        setStatus("Profile setup failed. Please check your details and try again.");
        return;
      }

      setStatus("Profile ready. Redirecting to the app...");
      setTimeout(() => router.push("/"), 1000);
    }

    ensureProfileForConfirmedUser();
  }, [router]);

  return (
    <div className="bg-[#FBF5D1] px-15 pt-20 pb-15 border-5 border-[#E4DCAB] rounded-4xl justify-items-center translate-x-75 translate-y-15 shadow-xl/40">
      <h2 className="font-cherry text-[#2E2805] text-7xl pb-10">Account Confirmed</h2>
      <p className="font-delius text-lg text-[#2E2805] mb-8">
        Your account has been confirmed.
      </p>
      <p className="font-delius text-base text-[#2E2805]">
        {status}
      </p>
    </div>
  );
}
