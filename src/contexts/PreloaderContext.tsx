"use client";

import { createContext, useContext, useState, useCallback } from "react";
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
  const pathname = usePathname();
  const [readyPathname, setReadyPathname] = useState<string | null>(null);

  // Derived: page is ready only when markPageReady was called for the current pathname
  // Automatically resets to false on navigation (pathname changes, readyPathname doesn't match)
  const isPageReady = readyPathname === pathname;

  const markPageReady = useCallback(() => {
    setReadyPathname(pathname);
  }, [pathname]);

  return (
    <PreloaderContext.Provider value={{ isPageReady, markPageReady }}>
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  return useContext(PreloaderContext);
}
