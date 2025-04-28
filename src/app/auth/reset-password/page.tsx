import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Reset Password | Nexus Platform",
  description: "Reset your Nexus account password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}