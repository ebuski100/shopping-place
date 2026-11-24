"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import { usePwaStandaloneMode } from "@/components/PwaInstall";

type NavigationContextValue = {
  canGoBack: boolean;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);
const BACK_GUARD_STATE_KEY = "__shoppingPlaceBackGuard";

function getCurrentRouteKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function hasBackGuard(value: unknown) {
  return (
    typeof value === "object" &&
    value !== null &&
    BACK_GUARD_STATE_KEY in value &&
    (value as Record<string, unknown>)[BACK_GUARD_STATE_KEY] === true
  );
}

function RouteTracker({ onRouteChange }: { onRouteChange: (route: string) => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = `${pathname}${search ? `?${search}` : ""}`;

  useEffect(() => {
    onRouteChange(routeKey);
  }, [onRouteChange, routeKey]);

  return null;
}

export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isStandalone = usePwaStandaloneMode();
  const [canGoBack, setCanGoBack] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [exitAttempted, setExitAttempted] = useState(false);
  const [closeBlocked, setCloseBlocked] = useState(false);
  const exitAttemptedRef = useRef(false);
  const closeCheckTimerRef = useRef<number | null>(null);
  const routeStackRef = useRef<string[]>([]);
  const routeIndexRef = useRef(-1);
  const currentRouteRef = useRef("");
  const routeReadyRef = useRef(false);
  const pendingPopRef = useRef(false);
  const pendingHomeResetRef = useRef(false);
  const pendingGuardRestoreRef = useRef<"stay" | "home" | null>(null);
  const guardInstalledRef = useRef(false);

  const installBackGuard = useCallback((force = false) => {
    if (!isStandalone || guardInstalledRef.current) return;

    const currentState =
      typeof window.history.state === "object" && window.history.state !== null
        ? window.history.state
        : {};

    if (force || hasBackGuard(currentState)) {
      window.history.replaceState(
        { ...currentState, [BACK_GUARD_STATE_KEY]: false },
        "",
        window.location.href,
      );
    }

    window.history.pushState(
      { ...window.history.state, [BACK_GUARD_STATE_KEY]: true },
      "",
      window.location.href,
    );
    guardInstalledRef.current = true;
  }, [isStandalone]);

  const handleRouteChange = useCallback((route: string) => {
    if (!routeReadyRef.current) {
      routeReadyRef.current = true;
      currentRouteRef.current = route;
      routeStackRef.current = [route];
      routeIndexRef.current = 0;
      setRouteReady(true);
      setCanGoBack(false);
      return;
    }

    if (route === currentRouteRef.current) return;

    if (pendingHomeResetRef.current && route.split("?")[0] === "/") {
      pendingHomeResetRef.current = false;
      pendingPopRef.current = false;
      currentRouteRef.current = route;
      routeStackRef.current = [route];
      routeIndexRef.current = 0;
      setCanGoBack(false);
      guardInstalledRef.current = false;
      installBackGuard(true);
      return;
    }

    const stack = routeStackRef.current;
    const currentIndex = routeIndexRef.current;

    if (pendingPopRef.current) {
      pendingPopRef.current = false;
      const previousIndex = stack.lastIndexOf(route, currentIndex - 1);
      const nextIndex = stack.indexOf(route, currentIndex + 1);
      if (previousIndex >= 0) {
        routeIndexRef.current = previousIndex;
      } else if (nextIndex >= 0) {
        routeIndexRef.current = nextIndex;
      } else {
        stack.splice(currentIndex + 1);
        stack.push(route);
        routeIndexRef.current = stack.length - 1;
      }
    } else {
      stack.splice(currentIndex + 1);
      stack.push(route);
      routeIndexRef.current = stack.length - 1;
    }

    currentRouteRef.current = route;
    setCanGoBack(routeIndexRef.current > 0);
  }, [installBackGuard]);

  useEffect(() => {
    if (isStandalone && routeReady && routeIndexRef.current === 0) {
      installBackGuard();
    }
  }, [installBackGuard, isStandalone, routeReady]);

  useEffect(() => {
    if (!isStandalone) return;

    function handlePopState(event: PopStateEvent) {
      const destination = getCurrentRouteKey();
      const stack = routeStackRef.current;
      const currentIndex = routeIndexRef.current;

      if (pendingGuardRestoreRef.current) {
        const restoreAction = pendingGuardRestoreRef.current;
        pendingGuardRestoreRef.current = null;
        if (hasBackGuard(event.state)) guardInstalledRef.current = true;

        if (restoreAction === "home") {
          pendingHomeResetRef.current = true;
          router.replace("/");
        }
        return;
      }

      const knownDestination = stack.lastIndexOf(destination);
      if (
        destination !== currentRouteRef.current &&
        knownDestination >= 0 &&
        knownDestination !== currentIndex
      ) {
        pendingPopRef.current = true;
        return;
      }

      if (destination !== currentRouteRef.current) {
        // Ignore forward history entries that belong to an earlier browser
        // session or cannot be identified as part of this in-app route stack.
        const isForward = knownDestination > currentIndex;
        if (isForward) {
          pendingPopRef.current = true;
          return;
        }
      }

      if (currentIndex > 0) {
        pendingPopRef.current = true;
        return;
      }

      guardInstalledRef.current = false;

      if (currentRouteRef.current.split("?")[0] === "/") {
        exitAttemptedRef.current = false;
        setExitDialogOpen(true);
        setExitAttempted(false);
        setCloseBlocked(false);
        pendingGuardRestoreRef.current = "stay";
      } else {
        pendingGuardRestoreRef.current = "home";
      }

      // Restore the just-popped same-app guard entry. This keeps browser
      // forward history intact while allowing us to handle the hardware back.
      window.history.forward();
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isStandalone, router]);

  const stayInApp = useCallback(() => {
    if (closeCheckTimerRef.current !== null) {
      window.clearTimeout(closeCheckTimerRef.current);
      closeCheckTimerRef.current = null;
    }
    exitAttemptedRef.current = false;
    setExitDialogOpen(false);
    setExitAttempted(false);
    setCloseBlocked(false);
  }, []);

  const attemptExit = useCallback(() => {
    if (exitAttemptedRef.current) return;

    exitAttemptedRef.current = true;
    setExitAttempted(true);
    setCloseBlocked(false);
    try {
      window.close();
    } catch {
      setCloseBlocked(true);
      return;
    }

    closeCheckTimerRef.current = window.setTimeout(() => {
      closeCheckTimerRef.current = null;
      if (!window.closed) setCloseBlocked(true);
    }, 250);
  }, []);

  return (
    <NavigationContext.Provider value={{ canGoBack }}>
      <Suspense fallback={null}>
        <RouteTracker onRouteChange={handleRouteChange} />
      </Suspense>
      {children}
      <Modal
        open={exitDialogOpen}
        onClose={stayInApp}
        title="Do you want to exit Shopping Place?"
      >
        <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300">
          <p>Are you sure you want to leave? You can always come back and continue shopping.</p>
          {closeBlocked && (
            <p role="status" className="rounded-lg bg-gray-100 p-3 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              This browser did not allow the app to close. You can close Shopping Place using your device&apos;s normal app controls.
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={stayInApp}
              className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Stay
            </button>
            <button
              type="button"
              onClick={attemptExit}
              disabled={exitAttempted}
              aria-busy={exitAttempted && !closeBlocked}
              className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exitAttempted ? "Exit requested" : "Exit app"}
            </button>
          </div>
        </div>
      </Modal>
    </NavigationContext.Provider>
  );
}

export function useSmartBack(fallback = "/") {
  const router = useRouter();
  const navigation = useContext(NavigationContext);

  return useCallback(() => {
    if (navigation?.canGoBack) {
      router.back();
      return;
    }

    if (window.location.pathname !== fallback.split("?")[0]) {
      router.push(fallback);
    }
  }, [fallback, navigation?.canGoBack, router]);
}

export function useCanGoBack() {
  return useContext(NavigationContext)?.canGoBack ?? false;
}
