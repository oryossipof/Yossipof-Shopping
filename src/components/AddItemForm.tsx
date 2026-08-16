import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-utils";

const UNITS = ["יח׳", "ק״ג", "גרם", "ליטר", "מ״ל", "חבילה", "קופסה"];

interface AddItemFormProps {
  onAdd: (name: string, quantity: number, unit: string, imageUrl?: string, notes?: string) => void;
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("יח׳");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(
      name.trim(),
      Number(quantity) || 1,
      unit,
      imagePreview,
      notes.trim() || undefined,
    );
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

        <div className="flex-1 space-y-2">
          {/* Product name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם המוצר..."
            className="w-full rounded-lg bg-muted px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
          />

          {/* Quantity + Unit row */}
          <div className="flex gap-2">
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
            <Button type="submit" className="mr-auto" disabled={!name.trim()}>
              הוסף
            </Button>
          </div>

          {/* Notes toggle + field */}
          {!showNotes ? (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + הוסף הערה
            </button>
          ) : (
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
