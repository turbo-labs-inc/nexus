import { Metadata } from "next";
import { LoginForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Sign In | Nexus Platform",
  description: "Sign in to your Nexus account",
};

export default function LoginPage() {
  return (
    <div className="mb-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and password to access your account
        </p>
      </div>
      
      <LoginForm />
    </div>
  );
}