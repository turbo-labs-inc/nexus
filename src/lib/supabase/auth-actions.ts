"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/**
 * Check if the user is authenticated on the server
 */
export async function checkAuth() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    isAuthenticated: !!session,
    user: session?.user || null,
    session,
  };
}

/**
 * Handle server-side login
 */
export async function serverLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string || "/dashboard";

  const supabase = createSupabaseServerClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Redirect to the specified page or dashboard
  redirect(redirectTo);
}

/**
 * Handle server-side logout
 */
export async function serverLogout() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  
  // Clear auth cookie
  cookies().delete("nexus-auth-token");
  
  redirect("/");
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
 * Update user profile data
 */
export async function updateUserProfile(userId: string, data: any) {
  const supabase = createSupabaseServerClient();
  
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error };
  }
}