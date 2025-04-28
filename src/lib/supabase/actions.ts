"use server";

import { createSupabaseServerClient } from "./server";
import { Session } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

/**
 * Get the current server session
 */
export async function getServerSession(): Promise<Session | null> {
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

/**
 * Check if the user is authenticated on the server
 */
export async function checkServerAuth() {
  const session = await getServerSession();
  return {
    isAuthenticated: !!session,
    user: session?.user || null,
  };
}

/**
 * Get user profile data
 */
export async function getUserProfile(userId: string) {
  const supabase = createSupabaseServerClient();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { data: null, error };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: any) {
  const supabase = createSupabaseServerClient();
  try {
    const result = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId);
    
    // Revalidate the profile page
    revalidatePath(`/profile/${userId}`);
    return { error: result.error };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error };
  }
}