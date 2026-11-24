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

type NavigationContextValue = {
  canGoBack: boolean;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

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
  const [canGoBack, setCanGoBack] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const routeStackRef = useRef<string[]>([]);
  const routeIndexRef = useRef(-1);
  const currentRouteRef = useRef("");

  const handleRouteChange = useCallback((route: string) => {
    if (!routeReady) {
      currentRouteRef.current = route;
      routeStackRef.current = [route];
      routeIndexRef.current = 0;
      setRouteReady(true);
      setCanGoBack(false);
      return;
    }

    if (route === currentRouteRef.current) return;

    const stack = routeStackRef.current;
    const currentIndex = routeIndexRef.current;

    // Intelligent back navigation: detect movement to an adjacent tracked route.
    const previousIndex = currentIndex - 1;
    const nextIndex = currentIndex + 1;

    if (previousIndex >= 0 && stack[previousIndex] === route) {
      routeIndexRef.current = previousIndex;
    } else if (nextIndex < stack.length && stack[nextIndex] === route) {
      routeIndexRef.current = nextIndex;
    } else {
      stack.splice(currentIndex + 1);
      stack.push(route);
      routeIndexRef.current = stack.length - 1;
    }

    currentRouteRef.current = route;
    setCanGoBack(routeIndexRef.current > 0);
  }, [routeReady]);

  return (
    <NavigationContext.Provider value={{ canGoBack }}>
      <Suspense fallback={null}>
        <RouteTracker onRouteChange={handleRouteChange} />
      </Suspense>
      {children}
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
