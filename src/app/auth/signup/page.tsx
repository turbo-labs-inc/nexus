import { Metadata } from "next";
import { SignupForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Sign Up | Nexus Platform",
  description: "Create a new Nexus account",
};

export default function SignupPage() {
  return (
    <div className="mb-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Create a new account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in the form below to create your Nexus account
        </p>
      </div>
      
      <SignupForm />
    </div>
  );
}