"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

const STORAGE_KEY = "adblend-side-panel-width";
const DEFAULT_SIDE_WIDTH = 400;
const MIN_SIDE_WIDTH = 280;
const MIN_MAIN_WIDTH = 360;
const HANDLE_WIDTH_PX = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readStoredWidth(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_SIDE_WIDTH;
}

type ResizableSplitPaneProps = {
  main: ReactNode;
  side: ReactNode;
};

export default function ResizableSplitPane({
  main,
  side,
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [sideWidth, setSideWidth] = useState(DEFAULT_SIDE_WIDTH);
  const [maxSideWidth, setMaxSideWidth] = useState(520);
  const [isLargeLayout, setIsLargeLayout] = useState(false);

  useEffect(() => {
    // Must run after hydration: server and first client paint use DEFAULT_SIDE_WIDTH.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
    setSideWidth(clamp(readStoredWidth(), MIN_SIDE_WIDTH, 520));
  }, []);

  const computeMaxSideWidth = (containerWidth: number): number =>
    Math.max(
      MIN_SIDE_WIDTH,
      containerWidth - MIN_MAIN_WIDTH - HANDLE_WIDTH_PX,
    );

  const applySideWidth = useCallback((next: number, max: number) => {
    const clamped = clamp(next, MIN_SIDE_WIDTH, max);
    setSideWidth(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(clamped)));
    } catch {
      /* private mode / storage full */
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const syncLayout = () => setIsLargeLayout(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (!isLargeLayout) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const container = containerRef.current;
      if (!container) return;
      const max = computeMaxSideWidth(container.offsetWidth);
      setMaxSideWidth(max);
      setSideWidth((current) => clamp(current, MIN_SIDE_WIDTH, max));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isLargeLayout]);

  const endDrag = useCallback((target: HTMLDivElement, pointerId: number) => {
    dragRef.current = null;
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  }, []);

  const onHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isLargeLayout) return;
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startWidth: sideWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { startX, startWidth } = dragRef.current;
    const container = containerRef.current;
    const max = container
      ? computeMaxSideWidth(container.offsetWidth)
      : maxSideWidth;
    applySideWidth(startWidth + (event.clientX - startX), max);
  };

  const onHandlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    endDrag(event.currentTarget, event.pointerId);
  };

  const onHandleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isLargeLayout) return;
    const step = event.shiftKey ? 48 : 16;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      applySideWidth(sideWidth + step, maxSideWidth);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      applySideWidth(sideWidth - step, maxSideWidth);
    } else if (event.key === "Home") {
      event.preventDefault();
      applySideWidth(DEFAULT_SIDE_WIDTH, maxSideWidth);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
    >
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {main}
      </main>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(sideWidth)}
        aria-valuemin={MIN_SIDE_WIDTH}
        aria-valuemax={Math.round(maxSideWidth)}
        aria-label="Resize chat and publisher panels"
        tabIndex={isLargeLayout ? 0 : -1}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        onKeyDown={onHandleKeyDown}
        onDoubleClick={() => applySideWidth(DEFAULT_SIDE_WIDTH, maxSideWidth)}
        className="split-handle hidden shrink-0 lg:block"
      />

      <aside
        className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden max-lg:max-h-[42vh] lg:shrink-0 lg:max-h-full"
        style={isLargeLayout ? { width: sideWidth } : undefined}
      >
        {side}
      </aside>
    </div>
  );
}
