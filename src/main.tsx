import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { applySavedTextSize } from "./lib/text-scale";
import "./styles.css";

// Keep the installed app up to date without prompting the user.
registerSW({ immediate: true });

// Apply the user's saved text size before the first paint.
applySavedTextSize();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
