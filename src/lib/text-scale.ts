// Keeps the app usable on devices where the user raised the system / browser
// font scale. The header controls then grow past the edge of the viewport and,
// in RTL, get clipped off the left. This measures how much the browser is
// actually enlarging text and, when it went past the cap, scales it back down.
//
// Two separate settings can enlarge text, and they need different levers:
//
//   - the browser's default font size, which shows up as a root font-size
//     above 16px and is corrected by overriding the root font-size
//   - Chrome for Android's "text scaling" slider, which multiplies computed
//     font sizes through the text autosizer and is corrected by
//     `text-size-adjust`
//
// Devices doing neither (desktop, iOS) measure 1 and are left untouched.

/**
 * Largest text multiplier the layout is allowed to receive. Text still gets
 * bigger than default on a device with an enlarged system font — just not so
 * big that the layout breaks. Tune this after looking at a real device.
 */
export const MAX_TEXT_SCALE = 1.3;

/** The root font size the design assumes. */
const BASE_FONT_PX = 16;

const PROBE_TEXT = "אבגדהוזחטיכלמנסעפצקרשת ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789";

export interface TextScale {
  /** Root font size relative to 16px. */
  root: number;
  /** Multiplier the text autosizer is applying on top of that. */
  autosize: number;
  /** The two combined — what the layout actually receives. */
  total: number;
}

function makeProbe(optOut: boolean): HTMLDivElement {
  const probe = document.createElement("div");
  // Full page width and at a normal position, so Chrome's text autosizer
  // treats the probe like real content rather than skipping it.
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:100%;visibility:hidden;pointer-events:none;" +
    "z-index:-1;font-size:16px;line-height:1;margin:0;padding:0";
  if (optOut) {
    probe.style.setProperty("-webkit-text-size-adjust", "none");
    probe.style.setProperty("text-size-adjust", "none");
  }
  const span = document.createElement("span");
  span.textContent = PROBE_TEXT;
  probe.appendChild(span);
  return probe;
}

/**
 * Measures both enlargement channels. Never throws — a browser that gives
 * unusable numbers reports no scaling rather than breaking the app.
 */
export function measureTextScale(): TextScale {
  const none: TextScale = { root: 1, autosize: 1, total: 1 };
  try {
    if (typeof document === "undefined" || !document.body) return none;

    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const root = Number.isFinite(rootPx) && rootPx > 0 ? Math.max(rootPx / BASE_FONT_PX, 1) : 1;

    // Two identical probes, one opted out of autosizing: their height ratio is
    // the multiplier the autosizer is applying.
    const baseline = makeProbe(true);
    const scaled = makeProbe(false);
    document.body.appendChild(baseline);
    document.body.appendChild(scaled);
    const baseH = (baseline.firstChild as HTMLElement).getBoundingClientRect().height;
    const scaledH = (scaled.firstChild as HTMLElement).getBoundingClientRect().height;
    baseline.remove();
    scaled.remove();

    const autosize = baseH > 0 && scaledH > 0 ? Math.max(scaledH / baseH, 1) : 1;

    const total = root * autosize;
    return Number.isFinite(total) ? { root, autosize, total } : none;
  } catch {
    return none;
  }
}

/**
 * Measures the applied text scale and caps it at {@link MAX_TEXT_SCALE}.
 *
 * Safe to call repeatedly: it clears any correction it previously applied
 * before measuring, so it always reads the device's raw scale rather than its
 * own output.
 */
export function applyTextScaleCap(): void {
  try {
    const root = document.documentElement;

    root.style.removeProperty("font-size");
    root.style.removeProperty("-webkit-text-size-adjust");
    root.style.removeProperty("text-size-adjust");

    const scale = measureTextScale();
    if (scale.total <= MAX_TEXT_SCALE) {
      root.style.setProperty("--text-scale", String(scale.total));
      report(scale, scale.total);
      return;
    }

    // How much of the enlargement has to come back off.
    const needed = MAX_TEXT_SCALE / scale.total;

    // Take it off the root font size first — that lever is exact and it is
    // where an enlarged browser default shows up. Never shrink below the
    // design's own base size.
    const rootPx = scale.root * BASE_FONT_PX;
    const cappedRootPx = Math.max(BASE_FONT_PX, rootPx * needed);
    if (cappedRootPx < rootPx - 0.01) {
      root.style.fontSize = `${cappedRootPx.toFixed(2)}px`;
    }

    // Whatever the root font size could not absorb is autosizing; hand the
    // remainder to text-size-adjust.
    const remainder = needed / (cappedRootPx / rootPx);
    if (remainder < 0.999) {
      const percent = `${(remainder * 100).toFixed(2)}%`;
      root.style.setProperty("-webkit-text-size-adjust", percent);
      root.style.setProperty("text-size-adjust", percent);
    }

    root.style.setProperty("--text-scale", String(MAX_TEXT_SCALE));
    report(scale, MAX_TEXT_SCALE);
  } catch {
    // Ignore — an uncapped layout is still better than a blank screen.
  }
}

function report(scale: TextScale, effective: number): void {
  // Readable over remote debugging when tuning MAX_TEXT_SCALE on a device.
  (window as unknown as { __textScale?: TextScale }).__textScale = scale;
  if (Math.abs(scale.total - 1) > 0.01) {
    console.info(
      `[text-scale] root=${scale.root.toFixed(3)} autosize=${scale.autosize.toFixed(3)} ` +
        `total=${scale.total.toFixed(3)} effective=${effective.toFixed(3)}`,
    );
  }
}

/**
 * Applies the cap now and keeps it correct as the device changes: rotation,
 * window resize, and returning to a backgrounded PWA (the font setting can be
 * changed while the app is not in the foreground).
 */
export function watchTextScale(): () => void {
  let timer: number | undefined;
  const rerun = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(applyTextScaleCap, 150);
  };

  applyTextScaleCap();
  window.addEventListener("resize", rerun);
  window.addEventListener("orientationchange", rerun);
  window.addEventListener("pageshow", rerun);

  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("resize", rerun);
    window.removeEventListener("orientationchange", rerun);
    window.removeEventListener("pageshow", rerun);
  };
}
