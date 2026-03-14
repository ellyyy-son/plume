"use server"
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function fetchUser() {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('No user logged in.');
        return;
    }


    const { data, error } = await supabase
        .from('profile')
        .select()
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Fetch error:', error.message);
        return;
    }

    if (!data) {
        console.warn("Fetch returned no profile row for user", user.id);
        return;
    }

    return { user, profile: data };
}
