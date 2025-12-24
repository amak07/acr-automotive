"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import { useTheme } from "next-themes";

interface MermaidProps {
  chart: string;
}

// Cache for mermaid instance
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;

function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid");
  }
  return mermaidPromise;
}

// Use useSyncExternalStore for hydration-safe mounting detection
// This avoids the ESLint error about setState in useEffect
function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Mermaid({ chart }: MermaidProps): ReactElement {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const mounted = useHasMounted();

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const renderDiagram = async () => {
      const mermaid = await getMermaid();

      // Initialize mermaid with theme
      mermaid.default.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "inherit",
      });

      try {
        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.default.render(id, chart);
        setSvg(renderedSvg);
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        setSvg(
          `<pre style="color: red;">Error rendering diagram: ${error instanceof Error ? error.message : "Unknown error"}</pre>`
        );
      }
    };

    renderDiagram();
  }, [chart, resolvedTheme, mounted]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="my-4 flex items-center justify-center rounded-lg border bg-fd-muted p-8">
        <div className="text-fd-muted-foreground">Loading diagram...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto rounded-lg border bg-fd-background p-4 [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
