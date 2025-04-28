"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/context";
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

// Define schema for form validation
const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type for form values
type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        console.error("Signup error:", error);
        
        // Special handling for different types of signup errors with user-friendly messages
        if (error.name === "ThrottledError") {
          toast.error("Please wait a moment before trying again");
        } else if (error.message?.includes("rate limit")) {
          toast.error("Too many signup attempts. Please try again in a few minutes.");
        } else if (error.message?.includes("already registered")) {
          toast.error("An account with this email already exists. Try logging in instead.");
          // Provide a link to login page
          setTimeout(() => {
            toast.info("You can log in with your existing account or reset your password if you forgot it.");
          }, 1500);
        } else if (error.message?.includes("weak password")) {
          toast.error("Your password is too weak. Please use a stronger password.");
          setTimeout(() => {
            toast.info("A strong password includes uppercase letters, lowercase letters, numbers, and special characters.");
          }, 1500);
        } else if (error.message?.toLowerCase().includes("network")) {
          toast.error("Network error. Please check your internet connection and try again.");
        } else if (error.message?.includes("sign up failed")) {
          toast.error("Sign up failed. Please try again or use a different email address.");
        } else if (error.message?.includes("invalid email")) {
          toast.error("Please enter a valid email address.");
        } else {
          // Generic but still helpful error message
          toast.error(error.message || "Sign up failed. Please try again or contact support if the problem persists.");
        }
        return;
      }
      
      toast.success("Account created successfully! You're now signed in.");
      // Redirect to dashboard instead of login page
      router.push("/dashboard");
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  placeholder="••••••••" 
                  type="password" 
                  autoComplete="new-password"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input 
                  placeholder="••••••••" 
                  type="password" 
                  autoComplete="new-password"
                  disabled={isLoading} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link 
            href="/auth/login" 
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}