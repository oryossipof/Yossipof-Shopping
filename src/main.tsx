import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { watchTextScale } from "./lib/text-scale";
import "./styles.css";

// Keep the installed app up to date without prompting the user.
registerSW({ immediate: true });

// Cap an oversized system font scale before the first paint, and keep it
// capped across rotation and resume.
watchTextScale();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
