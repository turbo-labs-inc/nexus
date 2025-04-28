"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Define schema for form validation
const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  avatar_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
});

// Type for form values
type ProfileFormValues = z.infer<typeof profileSchema>;

// Type for profile data
type ProfileData = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string;
};

interface ProfileFormProps {
  initialData: ProfileData | null;
  userId: string;
}

export function ProfileForm({ initialData, userId }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      avatar_url: initialData?.avatar_url || "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          avatar_url: data.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      
      if (error) {
        toast.error(error.message || "Failed to update profile");
        return;
      }
      
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your full name" 
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
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/avatar.png" 
                  disabled={isLoading} 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Email: {initialData?.email || "Not available"}
            </p>
            <p className="text-sm text-muted-foreground">
              Account type: {initialData?.role || "user"}
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}