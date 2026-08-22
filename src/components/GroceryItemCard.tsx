import { useState } from "react";
import type { GroceryItem } from "@/lib/grocery-store";
import { DUPLICATE_MESSAGE } from "@/lib/normalize-name";
import type { WriteResult } from "@/hooks/use-grocery-list";

interface GroceryItemCardProps {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (
    id: string,
    updates: Partial<Pick<GroceryItem, "name" | "quantity" | "unit" | "notes">>,
  ) => Promise<WriteResult>;
}

const UNITS = ["יח'", "ק\"ג", "גרם", "ליטר", "מ\"ל", "חבילה", "קופסה"];

export function GroceryItemCard({ item, onToggle, onRemove, onEdit }: GroceryItemCardProps) {
  const [editing, setEditing] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQty, setEditQty] = useState(String(item.quantity));
  const [editUnit, setEditUnit] = useState(item.unit);
  const [editNotes, setEditNotes] = useState(item.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (editName.trim()) {
      const qty = Number(editQty);
      const result = await onEdit(item.id, {
        name: editName.trim(),
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        unit: editUnit,
        notes: editNotes,
      });
      // Stay in edit mode so the name can be corrected without retyping.
      if (!result.ok) {
        setError(DUPLICATE_MESSAGE);
        return;
      }
    }
    setError(null);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
    setEditNotes(item.notes ?? "");
    setError(null);
    setEditing(false);
  };

  const startEditing = () => {
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
    setEditNotes(item.notes ?? "");
    setError(null);
    setEditing(true);
  };

  return (
    <>
      <div
        className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
          item.checked ? "bg-item-checked opacity-60" : "bg-card"
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.id)}
          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            item.checked
              ? "bg-success border-success"
              : "border-border hover:border-primary/50"
          }`}
        >
          {item.checked && (
            <svg className="w-4 h-4 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Image thumbnail */}
        {item.imageUrl && (
          <button
            onClick={() => setShowImage(true)}
            className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
            />
          </button>
        )}

        {/* Name + quantity or edit form */}
        {editing ? (
          <div className="flex-1 min-w-0 space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={!!error}
              className={`w-full rounded-lg border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 ${
                error ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
              }`}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2 items-center">
              <input
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button
                onClick={handleSave}
                className="text-xs px-2 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                שמור
              </button>
              <button
                onClick={handleCancel}
                className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
              >
                ביטול
              </button>
            </div>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="הערה (אופציונלי)"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ) : (
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => !item.checked && startEditing()}
          >
            <p className={`text-base font-medium truncate ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {item.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {item.quantity} {item.unit}
            </p>
            {item.notes && (
              <p className={`text-xs mt-0.5 italic ${item.checked ? "text-muted-foreground" : "text-primary/80"} break-words`}>
                📝 {item.notes}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!editing && (
          <div className="flex gap-1 flex-shrink-0">
            {!item.checked && (
              <button
                onClick={startEditing}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-all"
                aria-label="ערוך פריט"
              >
                <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onRemove(item.id)}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-all"
              aria-label="הסר פריט"
            >
              <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Full-screen image preview */}
      {showImage && item.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setShowImage(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full rounded-2xl object-contain max-h-[70vh]"
            />
            <p className="text-center text-white mt-3 text-lg font-medium">{item.name}</p>
            {item.notes && (
              <p className="text-center text-white/80 mt-1 text-sm italic">📝 {item.notes}</p>
            )}
            <button
              onClick={() => setShowImage(false)}
              className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-card text-foreground flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
              aria-label="סגור תמונה"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
