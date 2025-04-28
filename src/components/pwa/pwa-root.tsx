"use client";

import { useEffect } from "react";

import { registerServiceWorker } from "@/lib/pwa/register-sw";

import InstallPrompt from "./install-prompt";
import UpdateNotification from "./update-notification";

export function PWARoot() {
  useEffect(() => {
    // Register service worker on component mount
    registerServiceWorker();
  }, []);

  return (
    <>
      <InstallPrompt />
      <UpdateNotification />
    </>
  );
}
