"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { checkForUpdate, applyUpdate } from "@/lib/pwa/register-sw";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function UpdateNotification() {
  const [_updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleUpdate = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const isUpdateAvailable = await checkForUpdate(registration);

        if (isUpdateAvailable) {
          setUpdateAvailable(true);

          toast(
            <div className="flex flex-col gap-2">
              <div className="font-medium">Update Available</div>
              <p className="text-sm text-muted-foreground">
                A new version of the app is available.
              </p>
              <Button size="sm" className="mt-2 w-full" onClick={() => applyUpdate(registration)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Now
              </Button>
            </div>,
            {
              duration: Infinity,
            }
          );
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    handleUpdate();

    // Listen for update events from the service worker
    window.addEventListener("pwaUpdateReady", () => {
      setUpdateAvailable(true);
    });

    return () => {
      window.removeEventListener("pwaUpdateReady", () => {
        setUpdateAvailable(true);
      });
    };
  }, []);

  return null;
}
