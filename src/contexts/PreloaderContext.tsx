"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface PreloaderContextValue {
  /** Whether the page's Preloader has fully completed (faded out + removed from DOM) */
  isPageReady: boolean;
  /** Call this from the Preloader's onComplete callback to signal readiness */
  markPageReady: () => void;
}

const PreloaderContext = createContext<PreloaderContextValue>({
  isPageReady: false,
  markPageReady: () => {},
});

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const [isPageReady, setIsPageReady] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // Reset on route change
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setIsPageReady(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const markPageReady = useCallback(() => {
    setIsPageReady(true);
  }, []);

  return (
    <PreloaderContext.Provider value={{ isPageReady, markPageReady }}>
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  return useContext(PreloaderContext);
}
