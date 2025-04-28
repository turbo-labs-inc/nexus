# Supabase User Authentication Implementation

## Overview

This document outlines the implementation of user authentication using Supabase and Oslo in our Next.js PWA. We'll create a complete authentication system with registration, login, profile management, and session handling that works seamlessly across mobile and desktop devices.

## Tech Stack Components

For this authentication implementation, we'll use:

1. **Supabase** - Serverless Postgres database with built-in auth functionality
2. **Oslo** - Zero vendor lock-in authentication library
3. **Next.js 15** - For server-side authentication handling
4. **Zod** - For form validation
5. **Shadcn/UI** - For authentication UI components

## Implementation Steps

### 1. Set Up Supabase Project

First, create a new Supabase project:

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Create a new project with a name like "mcp-client-pwa"
3. Note your project URL and anon key for later use

### 2. Install Required Dependencies

```bash
# Install Supabase client and auth-related packages
npm install @supabase/supabase-js @oslo/auth oslo zod react-hook-form @hookform/resolvers/zod
```

### 3. Configure Supabase Client

Create a Supabase client configuration file:

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Add environment variables to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Create Authentication Context

Set up an authentication context to manage user state throughout the application:

```typescript
// src/context/auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const response = await supabase.auth.signUp({
      email,
      password,
    });
    return response;
  };

  const signIn = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return response;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 5. Add Auth Provider to Layout

Update the root layout to include the auth provider:

```typescript
// src/app/layout.tsx (updated)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { ServiceWorkerRegistration } from './service-worker';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/context/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MCP Client PWA',
  description: 'Mobile-first PWA for interacting with MCP servers',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <ServiceWorkerRegistration />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 6. Create Authentication Forms with Oslo

First, let's set up Oslo for authentication:

```typescript
// src/lib/auth.ts
import { Oslo } from "@oslo/auth";
import { Lucia } from "lucia";
import { Argon2id } from "oslo/password";
import { SupabaseAdapter } from "@lucia-auth/adapter-supabase";
import { supabase } from "./supabase";

// Create Supabase adapter for Lucia
const adapter = new SupabaseAdapter(supabase, {
  user: "auth.users",
  session: "auth.sessions",
});

// Initialize Lucia with Supabase adapter
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      emailVerified: attributes.email_verified,
    };
  },
});

// Initialize Oslo for password hashing
export const oslo = new Oslo({
  password: new Argon2id(),
});

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return await oslo.password.hash(password);
}

// Helper function to verify passwords
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await oslo.password.verify(password, hash);
}
```

Now, let's create the authentication forms:

```typescript
// src/components/auth/register-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await signUp(data.email, data.password);

      if (error) {
        setError(error.message);
        return;
      }

      // Registration successful
      router.push('/auth/verify-email');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">
          Enter your email and create a password to get started
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

```typescript
// src/components/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        setError('Invalid email or password');
        return;
      }

      // Login successful
      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p>
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-medium text-primary">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### 7. Create Authentication Pages

```typescript
// src/app/auth/register/page.tsx
import { RegisterForm } from '@/components/auth/register-form';
import { MobileContainer } from '@/components/layout/mobile-container';

export default function RegisterPage() {
  return (
    <MobileContainer>
      <RegisterForm />
    </MobileContainer>
  );
}
```

```typescript
// src/app/auth/login/page.tsx
import { LoginForm } from '@/components/auth/login-form';
import { MobileContainer } from '@/components/layout/mobile-container';

export default function LoginPage() {
  return (
    <MobileContainer>
      <LoginForm />
    </MobileContainer>
  );
}
```

```typescript
// src/app/auth/verify-email/page.tsx
import { MobileContainer } from '@/components/layout/mobile-container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <MobileContainer>
      <div className="mx-auto max-w-md space-y-6 p-4 text-center">
        <h1 className="text-3xl font-bold">Check Your Email</h1>
        <p className="text-muted-foreground">
          We've sent you a verification link. Please check your email and click the link to verify your account.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/auth/login">Return to Login</Link>
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
```

### 8. Create Protected Routes with Authentication Middleware

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/register", "/auth/verify-email"];
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath));

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath && path !== "/") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
```

### 9. Create User Profile Management

```typescript
// src/components/auth/profile-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: user?.email || '',
    },
  });

  // Load user profile data
  useState(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          form.setValue('fullName', data.full_name || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }

    loadProfile();
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;

    setIsSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: data.fullName,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        setError('Failed to update profile. Please try again.');
        console.error('Error updating profile:', error);
        return;
      }

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

```typescript
// src/app/profile/page.tsx
import { ProfileForm } from '@/components/auth/profile-form';
import { MobileContainer } from '@/components/layout/mobile-container';

export default function ProfilePage() {
  return (
    <MobileContainer>
      <div className="py-10">
        <h1 className="mb-6 text-2xl font-bold">Your Profile</h1>
        <ProfileForm />
      </div>
    </MobileContainer>
  );
}
```

### 10. Create User Dashboard

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { MobileContainer } from '@/components/layout/mobile-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (!user) {
    return (
      <MobileContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <p>Loading...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="mb-8">
          <p className="text-muted-foreground">
            Welcome back, {user.email}!
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Update your profile details and preferences.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/profile">View Profile</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>
                Start a conversation with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Access the chat interface to interact with AI models.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/chat">Open Chat</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
}
```

### 11. Update Header with Authentication Status

```typescript
// src/components/layout/header.tsx (updated)
'use client';

import React from 'react';
import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { DesktopNav } from './desktop-nav';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  // Different nav items based on authentication status
  const navItems = user
    ? [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Chat', href: '/chat' },
        { title: 'Documents', href: '/documents' },
        { title: 'Projects', href: '/projects' },
      ]
    : [
        { title: 'Home', href: '/' },
        { title: 'Features', href: '/#features' },
        { title: 'About', href: '/#about' },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold">
            MCP Client
          </Link>
        </div>
        <MobileNav items={navItems} />
        <DesktopNav items={navItems} />

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
```

### 12. Set Up Supabase Database Schema

Create a SQL migration file to set up the necessary tables:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to create a profile when a new user is created
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_profile_for_user();
```

Run this SQL in the Supabase SQL Editor to set up your database schema.

### 13. Create a Working Example

Let's create a simple example that demonstrates the authentication flow:

```typescript
// src/app/page.tsx (updated)
import { MobileContainer } from '@/components/layout/mobile-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  return (
    <MobileContainer>
      <div className="py-10">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">Welcome to MCP Client</h1>
        <p className="mb-8 text-muted-foreground">
          A mobile-first PWA for interacting with MCP servers
        </p>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/auth/register">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Secure Authentication</CardTitle>
              <CardDescription>
                Powered by Supabase and Oslo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create an account to access all features and save your preferences across devices.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Optimized</CardTitle>
              <CardDescription>
                Works seamlessly on all devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Enjoy a responsive experience that adapts perfectly to your phone, tablet, or desktop.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
}
```

## Testing Authentication

To verify that our authentication implementation works correctly, we'll test the following flows:

1. **Registration Flow**:

   - Navigate to /auth/register
   - Fill out the registration form
   - Submit and verify email verification page appears
   - Check Supabase for the new user record

2. **Login Flow**:

   - Navigate to /auth/login
   - Enter credentials
   - Verify successful redirect to dashboard

3. **Profile Management**:

   - Navigate to /profile
   - Update profile information
   - Verify changes are saved to Supabase

4. **Authentication State**:
   - Verify protected routes redirect unauthenticated users
   - Verify authenticated users can access protected routes
   - Test sign out functionality

## Conclusion

This implementation provides a complete authentication system using Supabase and Oslo in our Next.js PWA. The key features include:

1. **User Registration and Login**: Secure authentication with email and password
2. **Profile Management**: Allow users to update their profile information
3. **Protected Routes**: Middleware to control access to authenticated routes
4. **Responsive UI**: Mobile-optimized authentication forms and user interface
5. **Session Management**: Persistent sessions with Supabase Auth

The authentication system is now ready to be integrated with other components of the application, such as the chat interface and MCP client functionality.
