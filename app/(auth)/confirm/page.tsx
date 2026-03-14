"use client";
import { useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { ensureProfileRecord } from '@/utils/supabase/ensure-profile';

export default function Confirm() {
  useEffect(() => {
    const supabase = createClient();

    async function ensureProfileForConfirmedUser() {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        return;
      }

      const profileResult = await ensureProfileRecord(supabase, data.session.user, {
        accessToken: data.session.access_token,
      });

      if (!profileResult.ok) {
        console.error("Profile bootstrap on confirm failed:", profileResult.error);
      }
    }

    ensureProfileForConfirmedUser();
  }, []);

  return (
    <div className="bg-[#FBF5D1] px-15 pt-20 pb-15 border-5 border-[#E4DCAB] rounded-4xl justify-items-center translate-x-75 translate-y-15 shadow-xl/40">
      <h2 className="font-cherry text-[#2E2805] text-7xl pb-10">Account Confirmed</h2>
      <p className="font-delius text-lg text-[#2E2805] mb-8">
        Your account has been confirmed.
      </p>
      <p className="font-delius text-base text-[#2E2805]">
        You are already signed in and can continue using the app.
      </p>
    </div>
  );
}
