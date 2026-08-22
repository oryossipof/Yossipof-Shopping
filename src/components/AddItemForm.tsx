import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-utils";
import { DUPLICATE_MESSAGE } from "@/lib/normalize-name";
import type { WriteResult } from "@/hooks/use-grocery-list";

const UNITS = ["יח׳", "ק״ג", "גרם", "ליטר", "מ״ל", "חבילה", "קופסה"];

interface AddItemFormProps {
  onAdd: (
    name: string,
    quantity: number,
    unit: string,
    imageUrl?: string,
    notes?: string,
  ) => Promise<WriteResult>;
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("יח׳");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
    } catch {
      setImagePreview(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await onAdd(
      name.trim(),
      Number(quantity) || 1,
      unit,
      imagePreview,
      notes.trim() || undefined,
    );
    // Keep everything the user typed so they can adjust the name and retry.
    if (!result.ok) {
      setError(DUPLICATE_MESSAGE);
      return;
    }
    setError(null);
    setName("");
    setQuantity("1");
    setUnit("יח׳");
    setNotes("");
    setShowNotes(false);
    setImagePreview(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
      <div className="flex gap-3 items-start">
        {/* Image upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="תמונה" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="flex-1 min-w-0 space-y-2">
          {/* Product name */}
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="שם המוצר..."
            aria-invalid={!!error}
            className={`w-full rounded-lg bg-muted px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 text-base ${
              error ? "ring-2 ring-destructive/50 focus:ring-destructive/50" : "focus:ring-primary/30"
            }`}
          />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}

          {/* Quantity + Unit row */}
          <div className="flex flex-wrap gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onFocus={(e) => e.target.select()}
              min="0.1"
              step="0.1"
              className="w-20 rounded-lg bg-muted px-3 py-2 text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-lg bg-muted px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {/* Note toggle — an icon so it shares this row instead of taking
                one of its own */}
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              aria-label={showNotes ? "בטל הערה" : "הוסף הערה"}
              aria-pressed={showNotes}
              title="הוסף הערה"
              className={`flex-shrink-0 w-11 rounded-lg border flex items-center justify-center transition-colors ${
                showNotes || notes.trim()
                  ? "bg-primary/15 border-primary/50"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {/* Pencil supplied by the user (Desktop/pen.svg), inlined so it
                  ships with the bundle and works offline. */}
              <svg viewBox="0 0 16 16" className="w-7 h-7" aria-hidden="true">
                <g transform="rotate(45 8 8)">
                  <polygon points="7,13 9,13 8,16" fill="#212121" />
                  <polygon points="6.5,11.5 9.5,11.5 9,13 7,13" fill="#A1887F" />
                  <rect x="6.5" y="4" width="3" height="7.5" fill="#FFEB3B" stroke="#444" strokeWidth="0.4" />
                  <rect x="7.8" y="4" width="0.4" height="7.5" fill="#212121" />
                  <rect x="6.5" y="3.2" width="3" height="0.8" fill="#B0BEC5" stroke="#444" strokeWidth="0.2" />
                  <rect x="6.5" y="1.5" width="3" height="1.7" fill="#F48FB1" stroke="#444" strokeWidth="0.2" />
                </g>
              </svg>
            </button>
            <Button type="submit" disabled={!name.trim()}>
              הוסף
            </Button>
          </div>

          {/* Note field, shown only once the icon is toggled on */}
          {showNotes && (
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערה (למשל: כמה שיותר קשיחות)"
              autoFocus
              className="w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>
      </div>
    </form>
  );
}
