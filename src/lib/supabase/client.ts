"use client";

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

// Create a single supabase client for interacting with your database
export const createSupabaseClient = () => {
  // Get environment variables with fallbacks to prevent errors during SSR
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "nexus-auth-token",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storage: {
        getItem: (key) => {
          if (typeof window !== "undefined") {
            const item = localStorage.getItem(key);
            // Copy to cookie for SSR/middleware
            if (item && key === "nexus-auth-token") {
              document.cookie = `${key}=${item}; path=/; max-age=2592000; SameSite=Lax`;
            }
            return item;
          }
          return null;
        },
        setItem: (key, value) => {
          if (typeof window !== "undefined") {
            localStorage.setItem(key, value);
            // Copy to cookie for SSR/middleware
            if (key === "nexus-auth-token") {
              document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax`;
            }
          }
        },
        removeItem: (key) => {
          if (typeof window !== "undefined") {
            localStorage.removeItem(key);
            // Remove from cookies too
            if (key === "nexus-auth-token") {
              document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
          }
        },
      },
    },
  });
};

// Client-side singleton
let clientSingleton: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient() {
  // Create a safe guard for server-side rendering that doesn't throw errors
  // This allows the auth provider to render on the server without errors
  if (typeof window === "undefined") {
    // Return a placeholder client during SSR that will be replaced on client
    return createSupabaseClient();
  }

  // Browser - create a singleton client
  if (!clientSingleton) {
    clientSingleton = createSupabaseClient();
  }

  return clientSingleton;
}

/**
 * React hook to use Supabase client
 */
export function useSupabaseClient() {
  return getSupabaseClient();
}

/**
 * Sync localStorage auth token to cookies
 * This ensures the server can read the session
 */
export function syncAuthToCookies() {
  if (typeof window === "undefined") return;

  try {
    const tokenStr = localStorage.getItem("nexus-auth-token");
    if (tokenStr) {
      // Verify the token isn't expired before syncing
      try {
        const parsedToken = JSON.parse(tokenStr);
        if (parsedToken && parsedToken.expires_at) {
          const expiresAt = parsedToken.expires_at;
          const now = Math.floor(Date.now() / 1000);
          
          if (expiresAt < now) {
            console.log("Not syncing expired token to cookies");
            // Clear expired token
            localStorage.removeItem("nexus-auth-token");
            document.cookie = `nexus-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            return;
          }
        }
      } catch (parseError) {
        console.error("Failed to parse token for expiry check:", parseError);
      }
      
      // Token is either valid or couldn't be parsed for expiry check
      document.cookie = `nexus-auth-token=${tokenStr}; path=/; max-age=2592000; SameSite=Lax`;
      console.log("Auth token synced from localStorage to cookies");
    }
  } catch (error) {
    console.error("Failed to sync auth token to cookies:", error);
  }
}
