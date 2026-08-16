import { useState } from "react";
import { Button } from "@/components/ui/button";
import { normalizePhone } from "@/lib/use-phone";

interface PhoneGateProps {
  onSubmit: (phone: string) => void;
}

export function PhoneGate({ onSubmit }: PhoneGateProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePhone(value);
    if (normalized.length < 7) {
      setError("מספר טלפון לא תקין");
      return;
    }
    onSubmit(normalized);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card rounded-2xl shadow-sm border border-border p-6 space-y-4"
      >
        <div className="text-center space-y-2">
          <span className="text-4xl block">🛒</span>
          <h1 className="text-2xl font-bold text-foreground">רשימת קניות משותפת</h1>
          <p className="text-sm text-muted-foreground">
            הזיני מספר טלפון כדי לפתוח את הרשימה. כל מי שמשתמש באותו מספר יראה ויערוך את אותה רשימה.
          </p>
        </div>

        <input
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="050-1234567"
          className="w-full rounded-lg bg-muted px-4 py-3 text-foreground text-lg text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          autoFocus
        />

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button type="submit" className="w-full" disabled={!value.trim()}>
          המשך
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ללא אימות SMS - כל מי שמכיר את המספר יוכל לראות את הרשימה.
        </p>
      </form>
    </div>
  );
}
