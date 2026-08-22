import { useState } from "react";
import {
  TEXT_SIZE_STEPS,
  applyTextSizeStep,
  clampStep,
  readTextSizeStep,
  writeTextSizeStep,
} from "@/lib/text-scale";

/**
 * Lets the user pick the app's text size on this device. Needed because the
 * app deliberately ignores the device's own font/display scaling, which used
 * to push the layout wider than the screen.
 */
export function TextSizeControl() {
  const [step, setStep] = useState(readTextSizeStep);

  const change = (next: number) => {
    const clamped = clampStep(next);
    if (clamped === step) return;
    setStep(clamped);
    writeTextSizeStep(clamped);
    applyTextSizeStep(clamped);
  };

  const btn =
    "flex-shrink-0 w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center leading-none";

  return (
    <div className="flex items-center flex-shrink-0" title="גודל הטקסט באפליקציה">
      <button
        onClick={() => change(step - 1)}
        disabled={step === 0}
        className={btn}
        aria-label="הקטן את הטקסט"
      >
        <span className="text-[11px]">א−</span>
      </button>
      <button
        onClick={() => change(step + 1)}
        disabled={step === TEXT_SIZE_STEPS.length - 1}
        className={btn}
        aria-label="הגדל את הטקסט"
      >
        <span className="text-[15px]">א+</span>
      </button>
    </div>
  );
}
