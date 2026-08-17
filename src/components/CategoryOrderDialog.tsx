import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORY_ORDER, getCategory, resolveCategoryOrder } from "@/lib/grocery-categories";

interface CategoryOrderDialogProps {
  open: boolean;
  onClose: () => void;
  listName: string;
  initialOrder: string[] | null;
  onSave: (order: string[] | null) => void;
}

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function CategoryOrderDialog({
  open,
  onClose,
  listName,
  initialOrder,
  onSave,
}: CategoryOrderDialogProps) {
  const [order, setOrder] = useState<string[]>(CATEGORY_ORDER);

  useEffect(() => {
    if (open) setOrder(resolveCategoryOrder(initialOrder));
  }, [open, initialOrder]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleReset = () => setOrder(CATEGORY_ORDER);

  const handleSave = () => {
    onSave(arraysEqual(order, CATEGORY_ORDER) ? null : order);
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
            ⚙️ סדר קטגוריות — {listName}
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
          סדרו את הקטגוריות לפי הסדר בו אתם עוברים בין המחלקות בחנות. הרשימה
          תוצג תמיד בסדר הזה, עד שתשנו אותו שוב.
        </p>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {order.map((key, index) => {
            const cat = getCategory(key);
            return (
              <div
                key={key}
                className="flex items-center gap-2 rounded-xl bg-muted/50 p-2.5"
              >
                <span className="text-base">{cat.emoji}</span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {cat.label}
                </span>
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
                  disabled={index === order.length - 1}
                  className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="הזז למטה"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            );
          })}
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
