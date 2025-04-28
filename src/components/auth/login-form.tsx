"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/context";
import { syncAuthToCookies } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define schema for form validation
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Type for form values
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn, isAuthenticated, resendConfirmation } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  console.log("Redirect URL:", redirectTo); // Debug redirect URL
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [emailForConfirmation, setEmailForConfirmation] = useState("");

  // Try to sync auth on component mount
  useEffect(() => {
    syncAuthToCookies();

    // Auto-redirect if already authenticated
    if (isAuthenticated) {
      console.log("User already authenticated, redirecting to:", redirectTo);
      router.push(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle resending confirmation email
  const handleResendConfirmation = async () => {
    if (!emailForConfirmation) return;
    
    setIsLoading(true);
    try {
      const { error } = await resendConfirmation(emailForConfirmation);
      
      if (error) {
        console.error("Error resending confirmation:", error);
        if (error.name === "ThrottledError") {
          toast.error("Please wait a moment before trying again");
        } else if (error.message?.includes("rate limit")) {
          toast.error("Too many attempts. Please try again in a few minutes.");
        } else {
          toast.error(error.message || "Failed to resend confirmation email");
        }
      } else {
        toast.success("Confirmation email sent! Please check your inbox.");
        setShowConfirmationDialog(false);
      }
    } catch (error) {
      console.error("Unexpected error resending confirmation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log("Attempting to sign in with:", data.email);
      const { error } = await signIn(data.email, data.password);

      if (error) {
        console.error("Auth error:", error);
        
        // Special handling for different types of auth errors with user-friendly messages
        if (error.name === "ThrottledError") {
          toast.error("Please wait a moment before trying again");
        } else if (error.message?.includes("rate limit")) {
          toast.error("Too many login attempts. Please try again in a few minutes.");
        } else if (error.message?.includes("Invalid login credentials")) {
          toast.error("The email or password you entered is incorrect. Please try again.");
        } else if (error.message?.includes("Email not confirmed") || error.message?.includes("confirmation")) {
          // Save the email for the resend confirmation dialog
          setEmailForConfirmation(data.email);
          setShowConfirmationDialog(true);
          
          toast.error("Please check your email and confirm your account before logging in.");
        } else if (error.message?.includes("User not found")) {
          toast.error("No account found with this email. Please check your email or sign up for a new account.");
        } else if (error.message?.toLowerCase().includes("network")) {
          toast.error("Network error. Please check your internet connection and try again.");
        } else {
          // Generic but still helpful error message
          toast.error(error.message || "Login failed. Please try again or contact support if the problem persists.");
        }
        return;
      }

      console.log("Login successful, redirecting to:", redirectTo);
      toast.success("Login successful");

      // Manually sync auth to cookies
      syncAuthToCookies();

      // Add a slight delay to ensure session is properly set
      setTimeout(() => {
        // Get token from localStorage and verify it exists
        const token = localStorage.getItem("nexus-auth-token");
        if (token) {
          console.log("Auth token confirmed in localStorage, length:", token.length);
        } else {
          console.error("No auth token found in localStorage after login!");
        }

        router.push(redirectTo);
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="Nexus" className="h-10" />
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/auth/reset-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </form>
      </Form>
      
      {/* Confirmation Email Dialog */}
      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email Confirmation Required</AlertDialogTitle>
            <AlertDialogDescription>
              Your email address needs to be confirmed before you can log in. We've sent a confirmation email to <strong>{emailForConfirmation}</strong>.
              <br /><br />
              Check your inbox and click the confirmation link. If you can't find the email, check your spam folder or click below to resend the confirmation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleResendConfirmation();
              }}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Resend Confirmation Email"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
