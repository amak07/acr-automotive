"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import { useTheme } from "next-themes";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

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

// Hydration-safe mounted check
function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// Control button component - extracted outside to avoid recreation
interface ControlButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  label: string;
}

function ControlButton({ icon: Icon, onClick, label }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 bg-white/90 hover:bg-acr-red-500 hover:text-white rounded border border-acr-gray-200 transition-colors flex items-center justify-center"
      aria-label={label}
      title={label}
      style={{ minWidth: "44px", minHeight: "44px" }}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export function Mermaid({ chart }: MermaidProps): ReactElement {
  const { resolvedTheme } = useTheme();
  const [svgContent, setSvgContent] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mounted = useHasMounted();
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const fullscreenTransformRef = useRef<ReactZoomPanPinchRef>(null);

  // Render mermaid diagram
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

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

        if (!cancelled) {
          setSvgContent(renderedSvg);
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        if (!cancelled) {
          setSvgContent(
            `<pre style="color: red;">Error rendering diagram: ${error instanceof Error ? error.message : "Unknown error"}</pre>`
          );
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme, mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!mounted) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Fullscreen toggle: 'f' key (not in input fields)
      if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setIsFullscreen((prev) => !prev);
        }
      }

      // Zoom controls
      const activeRef = isFullscreen ? fullscreenTransformRef : transformRef;
      if (!activeRef.current) return;

      // Zoom in: Ctrl/Cmd + +
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        activeRef.current.zoomIn(0.5);
      }

      // Zoom out: Ctrl/Cmd + -
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        activeRef.current.zoomOut(0.5);
      }

      // Reset zoom: Ctrl/Cmd + 0
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        activeRef.current.resetTransform();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [mounted, isFullscreen]);

  // Control handlers
  const handleZoomIn = () => {
    const activeRef = isFullscreen ? fullscreenTransformRef : transformRef;
    activeRef.current?.zoomIn(0.5);
  };

  const handleZoomOut = () => {
    const activeRef = isFullscreen ? fullscreenTransformRef : transformRef;
    activeRef.current?.zoomOut(0.5);
  };

  const handleReset = () => {
    const activeRef = isFullscreen ? fullscreenTransformRef : transformRef;
    activeRef.current?.resetTransform();
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="my-4 flex items-center justify-center rounded-lg border bg-fd-muted p-8">
        <div className="text-fd-muted-foreground">Loading diagram...</div>
      </div>
    );
  }

  // Render diagram with transform wrapper
  const renderDiagram = (fullscreen = false) => (
    <TransformWrapper
      ref={fullscreen ? fullscreenTransformRef : transformRef}
      initialScale={1}
      minScale={0.5}
      maxScale={4}
      doubleClick={{ mode: "toggle", step: 0.5 }}
      wheel={{ step: 0.1 }}
      panning={{ disabled: false }}
      pinch={{ disabled: false }}
    >
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%" }}
        contentStyle={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="w-full [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </TransformComponent>
    </TransformWrapper>
  );

  return (
    <>
      {/* Main diagram container */}
      <div className="group relative my-4 rounded-lg border bg-fd-background p-4">
        {/* Desktop controls - top-right, show on hover */}
        <div className="absolute top-2 right-2 z-10 hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ControlButton icon={ZoomIn} onClick={handleZoomIn} label="Zoom In" />
          <ControlButton
            icon={ZoomOut}
            onClick={handleZoomOut}
            label="Zoom Out"
          />
          <ControlButton
            icon={RotateCcw}
            onClick={handleReset}
            label="Reset Zoom"
          />
          <ControlButton
            icon={Maximize2}
            onClick={() => setIsFullscreen(true)}
            label="Fullscreen"
          />
        </div>

        {/* Mobile controls - bottom-center, always visible */}
        <div className="flex md:hidden absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 gap-1 bg-white/90 rounded-lg p-1 border border-acr-gray-200 shadow-sm">
          <ControlButton icon={ZoomIn} onClick={handleZoomIn} label="Zoom In" />
          <ControlButton
            icon={ZoomOut}
            onClick={handleZoomOut}
            label="Zoom Out"
          />
          <ControlButton
            icon={RotateCcw}
            onClick={handleReset}
            label="Reset Zoom"
          />
          <ControlButton
            icon={Maximize2}
            onClick={() => setIsFullscreen(true)}
            label="Fullscreen"
          />
        </div>

        {/* Main diagram area */}
        <div
          className="w-full min-h-75 relative"
          role="img"
          aria-label="Architecture diagram"
        >
          {renderDiagram()}
        </div>

        {/* Footer tip */}
        <div className="mt-2 border-t bg-fd-muted/30 px-4 py-2 text-xs text-fd-muted-foreground">
          💡 Tip: Use zoom controls or scroll wheel to adjust view. Press
          &apos;f&apos; for fullscreen.
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog.Root open={isFullscreen} onOpenChange={setIsFullscreen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50" />
          <Dialog.Content className="fixed inset-4 md:inset-8 z-50 bg-white rounded-lg p-6 overflow-auto">
            <Dialog.Title className="sr-only">Fullscreen Diagram</Dialog.Title>
            <Dialog.Description className="sr-only">
              Interactive diagram in fullscreen mode. Use zoom controls or
              keyboard shortcuts to navigate.
            </Dialog.Description>

            {/* Fullscreen controls - always visible */}
            <div className="absolute top-4 right-4 z-10 flex gap-1 bg-white/90 rounded-lg p-1 border border-acr-gray-200 shadow-lg">
              <ControlButton
                icon={ZoomIn}
                onClick={handleZoomIn}
                label="Zoom In"
              />
              <ControlButton
                icon={ZoomOut}
                onClick={handleZoomOut}
                label="Zoom Out"
              />
              <ControlButton
                icon={RotateCcw}
                onClick={handleReset}
                label="Reset Zoom"
              />
            </div>

            {/* Close button */}
            <Dialog.Close className="absolute top-4 left-4 p-2 hover:bg-acr-gray-100 rounded border border-acr-gray-200 bg-white/90 shadow-lg transition-colors">
              <X className="w-6 h-6" />
              <span className="sr-only">Close fullscreen</span>
            </Dialog.Close>

            {/* Fullscreen diagram */}
            <div className="w-full h-full min-h-100 flex items-center justify-center pt-16">
              {renderDiagram(true)}
            </div>

            {/* Fullscreen footer tip */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 rounded-lg px-4 py-2 text-xs text-acr-gray-600 border border-acr-gray-200 shadow-lg">
              💡 Scroll wheel or pinch to zoom • Drag to pan • Press Esc to exit
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
