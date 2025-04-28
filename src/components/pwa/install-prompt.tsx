"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { isAppInstalled } from "@/lib/pwa/register-sw";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isAppInstalled());

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", () => setIsInstalled(true));
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    // Log outcome but avoid console in production
    if (process.env.NODE_ENV !== "production") {
      console.log(`User response to install prompt: ${outcome}`);
    }

    // We've used the prompt, clear it
    setInstallPrompt(null);
  };

  // Don't show the button if the app is already installed or can't be installed
  if (isInstalled || !installPrompt) {
    return null;
  }

  return (
    <Button onClick={handleInstallClick} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}
