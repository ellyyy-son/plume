import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const authKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE;


export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );

export const createServiceRole = () =>
  createBrowserClient(
    supabaseUrl!,
    authKey!,
    {
      auth: {
        persistSession: false
      },
    }
  );
export const supabase = createClient();