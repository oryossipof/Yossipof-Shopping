import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type GroceryCategory,
  getAllCategories,
  getCategory,
  generateCategoryKey,
  resolveCategoryOrder,
} from "@/lib/grocery-categories";

interface CategoryManagerDialogProps {
  open: boolean;
  onClose: () => void;
  listName: string;
  initialCategories: GroceryCategory[] | null;
  initialOrder: string[] | null;
  // `contentChanged` is true when a category was added, renamed, or deleted
  // — not for a pure reorder or an emoji-only edit, neither of which affects
  // what the AI should classify products into.
  onSave: (categories: GroceryCategory[], deletedKeys: string[], contentChanged: boolean) => void;
}

export function CategoryManagerDialog({
  open,
  onClose,
  listName,
  initialCategories,
  initialOrder,
  onSave,
}: CategoryManagerDialogProps) {
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const initialKeysRef = useRef<Set<string>>(new Set());
  const initialLabelsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!open) return;
    const start =
      initialCategories && initialCategories.length > 0
        ? initialCategories.map((c) => ({ ...c }))
        : resolveCategoryOrder(initialOrder).map((k) => getCategory(k));
    setCategories(start);
    initialKeysRef.current = new Set(start.map((c) => c.key));
    initialLabelsRef.current = new Map(start.map((c) => [c.key, c.label]));
    setNewLabel("");
    setNewEmoji("");
  }, [open, initialCategories, initialOrder]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    setCategories((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateField = (key: string, field: "label" | "emoji", value: string) => {
    if (key === "other") return;
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  };

  const handleDelete = (key: string) => {
    if (key === "other") return;
    setCategories((prev) => prev.filter((c) => c.key !== key));
  };

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    const key = generateCategoryKey(
      label,
      categories.map((c) => c.key),
    );
    setCategories((prev) => [...prev, { key, label, emoji: newEmoji.trim() || "🏷️" }]);
    setNewLabel("");
    setNewEmoji("");
  };

  const handleReset = () => setCategories(getAllCategories());

  const handleSave = () => {
    const deletedKeys = [...initialKeysRef.current].filter(
      (k) => !categories.some((c) => c.key === k),
    );
    const addedOrRenamed = categories.some(
      (c) => initialLabelsRef.current.get(c.key) !== c.label,
    );
    const contentChanged = deletedKeys.length > 0 || addedOrRenamed;
    onSave(categories, deletedKeys, contentChanged);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            ⚙️ קטגוריות — {listName}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <p className="px-4 pt-3 text-xs text-muted-foreground">
          הוסיפו, שנו שם, מחקו וסדרו את הקטגוריות של הרשימה הזו. הוספה, שינוי
          שם או מחיקה של קטגוריה יגרמו לכל המוצרים ברשימה לעבור סיווג מחדש
          אוטומטי על ידי ה-AI, למקרה שמוצר מתאים עכשיו לקטגוריה טוב יותר.
          הקטגוריה "אחר" תמיד קיימת ולא ניתן למחוק או לשנות אותה.
        </p>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {categories.map((cat, index) => (
            <div
              key={cat.key}
              className="flex items-center gap-2 rounded-xl bg-muted/50 p-2.5"
            >
              <input
                type="text"
                value={cat.emoji}
                onChange={(e) => updateField(cat.key, "emoji", e.target.value)}
                disabled={cat.key === "other"}
                className="w-9 rounded-lg border border-border bg-background px-1 py-1 text-center text-base focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="אימוג'י"
              />
              <input
                type="text"
                value={cat.label}
                onChange={(e) => updateField(cat.key, "label", e.target.value)}
                disabled={cat.key === "other"}
                className="flex-1 min-w-0 rounded-lg border border-border bg-background px-2 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="שם קטגוריה"
              />
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="הזז למעלה"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === categories.length - 1}
                className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="הזז למטה"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {cat.key !== "other" && (
                <button
                  onClick={() => handleDelete(cat.key)}
                  className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0"
                  aria-label="מחק קטגוריה"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add category */}
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-2.5 mt-2">
            <input
              type="text"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              placeholder="🏷️"
              className="w-9 rounded-lg border border-border bg-background px-1 py-1 text-center text-base focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="אימוג'י לקטגוריה חדשה"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="שם קטגוריה חדשה..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 min-w-0 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="שם קטגוריה חדשה"
            />
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              הוסף
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border grid grid-cols-2 gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            איפוס לברירת מחדל
          </Button>
          <Button onClick={handleSave} size="sm">
            שמור
          </Button>
        </div>
      </div>
    </div>
  );
}
