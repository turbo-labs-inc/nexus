"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { getSupabaseClient, syncAuthToCookies } from "@/lib/supabase/client";

// Define the AuthContext interface
interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  updateUser: (updates: {
    email?: string;
    password?: string;
    data?: { [key: string]: any };
  }) => Promise<{ error: AuthError | null }>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Get session and user on mount (client-side only)
  useEffect(() => {
    const supabase = getSupabaseClient();

    // First try to sync any existing localStorage token to cookies - ONCE ONLY
    if (typeof window !== "undefined" && !window.localStorage.getItem('auth-sync-done')) {
      syncAuthToCookies();
      window.localStorage.setItem('auth-sync-done', 'true');
    }

    const getSession = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Initial auth check - session exists:", !!session);
        
        // Check if token is expired or about to expire
        if (session) {
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          
          // If token is expired or expires in less than 10 minutes, refresh it
          if (expiresAt && expiresAt < now + 600) {
            console.log("Token expired or about to expire, refreshing...");
            try {
              const { data } = await supabase.auth.refreshSession();
              setSession(data.session);
              setUser(data.session?.user ?? null);
            } catch (refreshError) {
              console.error("Failed to refresh token:", refreshError);
              // Only sign out if the error is truly auth-related and not a network issue
              if (refreshError.message && refreshError.message.includes('invalid')) {
                await supabase.auth.signOut();
                setSession(null);
                setUser(null);
              } else {
                // Otherwise, just use the existing session and try again later
                setSession(session);
                setUser(session?.user ?? null);
              }
            }
          } else {
            // Token is still valid
            setSession(session);
            setUser(session?.user ?? null);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Setup periodic token refresh (every 50 minutes to avoid rate limits - tokens usually last 60 minutes)
    // We're making this much less frequent to avoid rate limiting
    const refreshInterval = setInterval(async () => {
      try {
        // Only attempt to refresh if we actually have a session
        if (session) {
          const { error } = await supabase.auth.refreshSession();
          
          if (!error) {
            console.log("Token refreshed at interval");
          } else {
            console.error("Error refreshing token:", error);
          }
        }
      } catch (error) {
        console.error("Failed to refresh token at interval:", error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change event:", event);
      
      if (event === "SIGNED_OUT") {
        // Clear everything on sign out
        setSession(null);
        setUser(null);
        
        // Clear browser storage to prevent recovery attempts
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexus-auth-token');
          localStorage.removeItem('auth-sync-done');
          document.cookie = `nexus-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      } else if (newSession) {
        // Update session and user for other events that have a session
        setSession(newSession);
        setUser(newSession.user);
        
        // Only sync to cookies for these specific events to reduce writes
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (typeof window !== 'undefined') {
            const sessionStr = JSON.stringify(newSession);
            document.cookie = `nexus-auth-token=${sessionStr}; path=/; max-age=2592000; SameSite=Lax`;
          }
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  // Track auth attempts to prevent rate limiting
  const [lastAuthAttempt, setLastAuthAttempt] = useState<number>(0);
  const AUTH_THROTTLE_MS = 2000; // Minimum time between auth attempts (2 seconds)
  
  // Sign in user with rate limiting protection
  const signIn = async (email: string, password: string) => {
    try {
      // Check if we're trying to authenticate too quickly
      const now = Date.now();
      if (now - lastAuthAttempt < AUTH_THROTTLE_MS) {
        console.log("Auth attempt throttled to prevent rate limiting");
        return { 
          error: {
            name: "ThrottledError",
            message: "Please wait a moment before trying again"
          } as AuthError 
        };
      }
      
      setLastAuthAttempt(now);
      const supabase = getSupabaseClient();
      console.log("Signing in with Supabase client");

      // We'll skip the signOut to reduce API calls
      // Only sign out if we're sure there's an existing session
      if (session) {
        await supabase.auth.signOut();
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session) {
        console.log("Sign in successful, session obtained");

        // Manually sync session to cookie for server-side auth
        if (typeof window !== "undefined") {
          const sessionStr = JSON.stringify(data.session);
          document.cookie = `nexus-auth-token=${sessionStr}; path=/; max-age=2592000; SameSite=Lax`;
          console.log("Session manually synced to cookie");
        }

        setSession(data.session);
        setUser(data.user);
        router.refresh();
      } else {
        console.error("Sign in error or no session:", error);
      }

      return { error };
    } catch (error) {
      console.error("Error signing in:", error);
      return { error: error as AuthError };
    }
  };

  // Sign up user and automatically sign in with rate limiting protection
  const signUp = async (email: string, password: string) => {
    try {
      // Check if we're trying to authenticate too quickly
      const now = Date.now();
      if (now - lastAuthAttempt < AUTH_THROTTLE_MS) {
        console.log("Auth attempt throttled to prevent rate limiting");
        return { 
          error: {
            name: "ThrottledError",
            message: "Please wait a moment before trying again"
          } as AuthError 
        };
      }
      
      setLastAuthAttempt(now);
      const supabase = getSupabaseClient();
      
      // First attempt to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/dashboard` 
        }
      });
      
      if (signUpError) {
        return { error: signUpError };
      }
      
      // After signup, wait a moment before sign in to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session) {
        console.log("Sign up and automatic sign in successful");
        
        // Manually sync session to cookie for server-side auth
        if (typeof window !== "undefined") {
          const sessionStr = JSON.stringify(data.session);
          document.cookie = `nexus-auth-token=${sessionStr}; path=/; max-age=2592000; SameSite=Lax`;
          console.log("Session manually synced to cookie after signup");
        }

        setSession(data.session);
        setUser(data.user);
        router.refresh();
      }
      
      return { error: error || signUpError };
    } catch (error) {
      console.error("Error signing up:", error);
      return { error: error as AuthError };
    }
  };

  // Sign out user
  const signOut = async () => {
    try {
      const supabase = getSupabaseClient();
      
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Clear browser storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexus-auth-token');
        localStorage.removeItem('auth-sync-done');
        document.cookie = `nexus-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
      
      // Call Supabase signOut with options to avoid extra server calls
      await supabase.auth.signOut({ scope: 'local' });
      
      // Navigate after everything is cleared
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      
      // Still try to clear local state and redirect even if API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexus-auth-token');
        localStorage.removeItem('auth-sync-done');
        document.cookie = `nexus-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
      
      router.push("/");
      router.refresh();
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      console.error("Error resetting password:", error);
      return { error: error as AuthError };
    }
  };
  
  // Resend confirmation email
  const resendConfirmation = async (email: string) => {
    try {
      const now = Date.now();
      // Check throttling to avoid rate limits
      if (now - lastAuthAttempt < AUTH_THROTTLE_MS) {
        console.log("Email resend throttled to prevent rate limiting");
        return { 
          error: {
            name: "ThrottledError",
            message: "Please wait a moment before trying again"
          } as AuthError 
        };
      }
      
      setLastAuthAttempt(now);
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`
        }
      });
      
      return { error };
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      return { error: error as AuthError };
    }
  };

  // Update user
  const updateUser = async (updates: {
    email?: string;
    password?: string;
    data?: { [key: string]: any };
  }) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser(updates);
      return { error };
    } catch (error) {
      console.error("Error updating user:", error);
      return { error: error as AuthError };
    }
  };

  // Calculate isAuthenticated value
  const isAuthenticated = !!user && !!session;

  // Provide the auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendConfirmation,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
