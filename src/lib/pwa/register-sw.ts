// PWA Service Worker registration and management utilities

/**
 * Registers the service worker for PWA functionality
 * @returns Promise that resolves when registration is complete
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | undefined> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered with scope:", registration.scope);

    // Setup update handler
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          // New service worker is installed but waiting to activate
          dispatchUpdateReadyEvent();
        }
      });
    });

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return undefined;
  }
};

/**
 * Checks if an update to the service worker is available
 * @param registration Service worker registration
 * @returns Promise that resolves to boolean indicating if update is available
 */
export const checkForUpdate = async (registration: ServiceWorkerRegistration): Promise<boolean> => {
  try {
    await registration.update();
    return !!registration.waiting;
  } catch (error) {
    console.error("Error checking for service worker update:", error);
    return false;
  }
};

/**
 * Applies a pending service worker update
 * @param registration Service worker registration
 */
export const applyUpdate = (registration: ServiceWorkerRegistration): void => {
  if (!registration.waiting) return;

  // Send message to the waiting service worker to skip waiting
  registration.waiting.postMessage({ type: "SKIP_WAITING" });

  // Reload page to apply the new service worker
  window.location.reload();
};

/**
 * Dispatches a custom event when a new service worker is ready
 */
const dispatchUpdateReadyEvent = (): void => {
  window.dispatchEvent(new CustomEvent("pwaUpdateReady"));
};

/**
 * Checks if the app is currently installed (in standalone mode)
 * @returns Boolean indicating if app is in standalone mode
 */
export const isAppInstalled = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
};

/**
 * Checks if the app can be installed
 * @returns Boolean indicating if app can be installed
 */
export const canInstallApp = (): boolean => {
  return "BeforeInstallPromptEvent" in window;
};

// Create a type for the BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

// Store the install prompt for later use
let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Sets up a handler for the beforeinstallprompt event
 * This should be called on a top-level component like the layout
 */
export const setupInstallHandler = (): void => {
  if (typeof window === "undefined") return;

  // Clear any existing prompt
  deferredPrompt = null;

  // Listen for the beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the default prompt
    e.preventDefault();

    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;

    // Notify the app that the app can be installed
    window.dispatchEvent(new CustomEvent("pwaInstallable"));
  });

  // Listen for app installed event
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent("pwaInstalled"));
  });
};

/**
 * Shows the install prompt if available
 * @returns Promise resolving to a boolean indicating if installation was accepted
 */
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) return false;

  try {
    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferred prompt
    deferredPrompt = null;

    return outcome === "accepted";
  } catch (error) {
    console.error("Error showing install prompt:", error);
    return false;
  }
};
