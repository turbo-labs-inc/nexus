import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/auth/profile-form";

export const metadata: Metadata = {
  title: "Profile | Nexus Platform",
  description: "Manage your Nexus profile",
};

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirect=/profile");
  }

  // Fetch profile data from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">Profile</h1>
        
        <div className="rounded-lg border bg-card p-6 shadow">
          <ProfileForm initialData={profile} userId={session.user.id} />
        </div>
      </div>
    </div>
  );
}