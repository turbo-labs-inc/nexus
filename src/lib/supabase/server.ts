import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { Database } from "@/lib/supabase/database.types";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: "nexus-auth-token",
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string) => {
            return cookieStore.get(key)?.value ?? null;
          },
          setItem: (key: string, value: string) => {
            try {
              cookieStore.set(key, value, {
                path: "/",
                maxAge: 60 * 60 * 24 * 30, // 30 days
                sameSite: "lax",
              });
            } catch (error) {
              console.error("Error setting cookie:", error);
            }
          },
          removeItem: (key: string) => {
            try {
              cookieStore.delete(key);
            } catch (error) {
              console.error("Error removing cookie:", error);
            }
          },
        },
      },
    }
  );
}

// Supabase server client singleton instance
let _supabaseServerClient: ReturnType<typeof createSupabaseServerClient> | null = null;

/**
 * Get the Supabase server client (singleton)
 */
export function useSupabaseServer() {
  if (!_supabaseServerClient) {
    _supabaseServerClient = createSupabaseServerClient();
  }
  return _supabaseServerClient;
}

// Next.js App Router implementation
export async function getServerSession() {
  const supabase = createSupabaseServerClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}
