import { useEffect } from "react";

interface NoticeProps {
  message: string | null;
  onDismiss: () => void;
  /** How long the pill stays up, in ms. */
  duration?: number;
}

/**
 * A small self-dismissing status pill at the bottom of the screen. Used for
 * feedback that doesn't belong next to any single control — currently the
 * "how many items were skipped" summary after an import.
 */
export function Notice({ message, onDismiss, duration = 3500 }: NoticeProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] max-w-[calc(100vw-2rem)] rounded-full bg-foreground text-background px-4 py-2 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
      onClick={onDismiss}
    >
      {message}
    </div>
  );
}
