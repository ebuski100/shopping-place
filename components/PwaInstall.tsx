"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Download } from "lucide-react";
import Modal from "@/components/Modal";

type InstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
}

type PwaInstallContextValue = {
  canInstall: boolean;
  isPrompting: boolean;
  isStandalone: boolean;
  supportsIOSSafariInstructions: boolean;
  showInstallExperience: () => void;
  installApp: () => Promise<void>;
  isIOSInstructionsOpen: boolean;
  closeIOSInstructions: () => void;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isIOSSafari() {
  const userAgent = navigator.userAgent;
  const otherIOSBrowsers =
    /CriOS|FxiOS|EdgiOS|OPiOS|DdgA|DuckDuckGo|GSA|Vivaldi|Brave/i;

  return (
    isIOSDevice() &&
    /Safari/i.test(userAgent) &&
    !otherIOSBrowsers.test(userAgent)
  );
}

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getInstallEnvironmentSnapshot() {
  if (typeof window === "undefined") return "loading";

  return `${isStandaloneMode() ? "1" : "0"}:${isIOSSafari() ? "1" : "0"}`;
}

function subscribeToInstallEnvironment(callback: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", callback);

  return () => displayMode.removeEventListener("change", callback);
}

export function PwaInstallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<DeferredInstallPrompt | null>(null);
  const [isIOSInstructionsOpen, setIsIOSInstructionsOpen] = useState(false);
  const installedRef = useRef(false);
  const environment = useSyncExternalStore(
    subscribeToInstallEnvironment,
    getInstallEnvironmentSnapshot,
    () => "loading",
  );
  const [standaloneAtLaunch, supportsIOSSafariInstructions] =
    environment === "loading"
      ? [false, false]
      : environment.split(":").map((value) => value === "1");

  useEffect(() => {
    installedRef.current = standaloneAtLaunch || isInstalled;

    function handleBeforeInstallPrompt(event: Event) {
      if (installedRef.current) return;

      // The homepage and mobile navigation provide an in-app install action.
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
    }

    function handleAppInstalled() {
      installedRef.current = true;
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsIOSInstructionsOpen(false);
    }

    function handleDisplayModeChange(event: MediaQueryListEvent) {
      if (event.matches) {
        installedRef.current = true;
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsIOSInstructionsOpen(false);
      }
    }

    const displayMode = window.matchMedia("(display-mode: standalone)");

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleAppInstalled);
    displayMode.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayMode.removeEventListener("change", handleDisplayModeChange);
    };
  }, [isInstalled, standaloneAtLaunch]);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      setIsPrompting(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
        }
      } catch {
        // The prompt may be dismissed or become unavailable before activation.
      } finally {
        // A prompt event can only be used once, whether accepted or dismissed.
        setDeferredPrompt(null);
        setIsPrompting(false);
      }

      return;
    }

    if (supportsIOSSafariInstructions) {
      setIsIOSInstructionsOpen(true);
    }
  }, [deferredPrompt, supportsIOSSafariInstructions]);

  const closeIOSInstructions = useCallback(() => {
    setIsIOSInstructionsOpen(false);
  }, []);

  const showInstallExperience = useCallback(() => {
    setIsIOSInstructionsOpen(true);
  }, []);

  const canInstall =
    environment !== "loading" &&
    !standaloneAtLaunch &&
    !isInstalled &&
    (deferredPrompt !== null || supportsIOSSafariInstructions);

  return (
    <PwaInstallContext.Provider
      value={{
        canInstall,
        isPrompting,
        isStandalone: standaloneAtLaunch,
        supportsIOSSafariInstructions,
        showInstallExperience,
        installApp,
        isIOSInstructionsOpen,
        closeIOSInstructions,
      }}
    >
      {children}
      <IOSInstallInstructions />
    </PwaInstallContext.Provider>
  );
}

export function usePwaStandaloneMode() {
  return useContext(PwaInstallContext)?.isStandalone ?? false;
}

function IOSInstallInstructions() {
  const context = useContext(PwaInstallContext);

  if (!context) return null;

  return (
    <Modal
      open={context.isIOSInstructionsOpen}
      onClose={context.closeIOSInstructions}
      title="Install Shopping Place"
    >
      <div className="text-sm text-gray-700 dark:text-gray-300">
        <p>To add Shopping Place to your iPhone or iPad Home Screen:</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5">
          <li>In Safari, tap the Share icon.</li>
          <li>Select Add to Home Screen.</li>
          <li>Confirm by tapping Add.</li>
        </ol>
      </div>
    </Modal>
  );
}

export function InstallAppButton({
  variant = "home",
  onClick,
}: {
  variant?: "home" | "menu";
  onClick?: () => void;
}) {
  const context = useContext(PwaInstallContext);

  if (!context?.canInstall) return null;
  const installContext = context;

  function handleClick() {
    onClick?.();
    if (installContext.supportsIOSSafariInstructions) {
      installContext.showInstallExperience();
    } else {
      void installContext.installApp();
    }
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={installContext.isPrompting}
        aria-busy={installContext.isPrompting}
        className="mt-2 flex w-full items-center gap-2 border-t border-gray-200 px-2 pt-4 text-left text-sm font-medium text-green-700 transition hover:text-green-800 dark:border-gray-700 dark:text-green-400 dark:hover:text-green-300"
      >
        {installContext.isPrompting ? (
          <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-green-300 border-t-green-700 dark:border-green-800 dark:border-t-green-300" />
        ) : (
          <Download size={18} />
        )}
        {installContext.isPrompting ? "Opening install prompt…" : "Install Shopping Place"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={installContext.isPrompting}
      aria-busy={installContext.isPrompting}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
    >
      {installContext.isPrompting ? (
        <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-green-300 border-t-white" />
      ) : (
        <Download size={18} />
      )}
      {installContext.isPrompting ? "Opening install prompt…" : "Install Shopping Place"}
    </button>
  );
}
