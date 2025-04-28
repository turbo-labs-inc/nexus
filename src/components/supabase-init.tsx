"use client";

import { useEffect, useState } from "react";
import { setupBasicDatabaseTables } from "@/lib/supabase/setup";

export function SupabaseInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initSupabase() {
      try {
        // Check database tables
        await setupBasicDatabaseTables();
        setInitialized(true);
      } catch (error) {
        console.error("Error initializing Supabase:", error);
      }
    }

    // Only run in development mode
    if (process.env.NODE_ENV === 'development') {
      initSupabase();
    } else {
      setInitialized(true);
    }
  }, []);

  return null; // This component doesn't render anything
}