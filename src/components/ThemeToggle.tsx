import { useState } from "react";
import { applyTheme, readTheme, writeTheme, type Theme } from "@/lib/theme";

/** Switches between the light and dark palettes and remembers the choice. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    writeTheme(next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "עבור למצב בהיר" : "עבור למצב כהה"}
      title={theme === "dark" ? "מצב בהיר" : "מצב כהה"}
      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
    >
      <span className="text-[0.875rem] leading-none">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
