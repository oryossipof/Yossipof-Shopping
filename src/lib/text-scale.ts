// The app's text size is controlled here, in the app — not by the device.
//
// Every size in this UI is expressed in rem, so it follows the root font size.
// That means a device with an enlarged system font (or display size) scales the
// whole layout up until it no longer fits the screen and the edges get clipped.
// Trying to detect and compensate for the device's scaling proved unreliable —
// Android enlarges text through several different mechanisms and not all of
// them are measurable from a page.
//
// So the root font size is pinned instead (see styles.css), and the user picks
// the text size from inside the app. The choice is saved per device.

const STORAGE_KEY = "text-size-step";

/** The root font size the layout is designed against. */
const BASE_FONT_PX = 16;

/**
 * Selectable sizes. The top step is the largest the layout is known to survive
 * on a narrow phone — raise it only alongside testing at that width.
 */
export const TEXT_SIZE_STEPS = [1, 1.15, 1.3, 1.5] as const;

/** Index into {@link TEXT_SIZE_STEPS} used when nothing is saved. */
export const DEFAULT_STEP = 0;

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return DEFAULT_STEP;
  return Math.min(Math.max(Math.round(step), 0), TEXT_SIZE_STEPS.length - 1);
}

export function readTextSizeStep(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? DEFAULT_STEP : clampStep(Number(raw));
  } catch {
    // Private mode / blocked storage — fall back to the default.
    return DEFAULT_STEP;
  }
}

export function writeTextSizeStep(step: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampStep(step)));
  } catch {
    // Not being able to remember the choice is not worth failing over.
  }
}

/** Applies a step to the document. Everything sized in rem follows. */
export function applyTextSizeStep(step: number): void {
  try {
    const scale = TEXT_SIZE_STEPS[clampStep(step)];
    document.documentElement.style.fontSize = `${(BASE_FONT_PX * scale).toFixed(2)}px`;
  } catch {
    // Ignore — the pinned size from styles.css still applies.
  }
}

/** Applies the saved choice. Call before first paint to avoid a size flash. */
export function applySavedTextSize(): void {
  applyTextSizeStep(readTextSizeStep());
}
