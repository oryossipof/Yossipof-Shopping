import { useMemo, useState } from "react";
import type { GroceryItem } from "@/lib/grocery-store";
import { Button } from "@/components/ui/button";
import { getCategoryForItem, type GroceryCategory } from "@/lib/grocery-categories";

interface ExportListDialogProps {
  open: boolean;
  onClose: () => void;
  listName: string;
  items: GroceryItem[];
  categories: GroceryCategory[];
}

export function ExportListDialog({ open, onClose, listName, items, categories }: ExportListDialogProps) {
  const [onlyUnchecked, setOnlyUnchecked] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const filtered = onlyUnchecked ? items.filter((i) => !i.checked) : items;
    if (filtered.length === 0) return `📝 ${listName}\n(אין פריטים)`;

    const formatItem = (i: GroceryItem) => {
      const check = i.checked ? "✅" : "▫️";
      const notes = i.notes ? ` (${i.notes})` : "";
      return `${check} ${i.name} - ${i.quantity} ${i.unit}${notes}`;
    };

    let body: string;
    if (groupByCategory) {
      const groups: Record<string, GroceryItem[]> = {};
      for (const it of filtered) {
        const key = it.category ?? getCategoryForItem(it.name, categories).key;
        (groups[key] ||= []).push(it);
      }
      body = categories
        .filter((c) => groups[c.key]?.length)
        .map((cat) => `${cat.emoji} ${cat.label}\n${groups[cat.key].map(formatItem).join("\n")}`)
        .join("\n\n");
    } else {
      body = filtered.map(formatItem).join("\n");
    }

    return `🛒 ${listName}\n\n${body}\n\n—\nנשלח מ״קנייתי״`;
  }, [items, listName, onlyUnchecked, groupByCategory, categories]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: listName, text });
      } catch {
        // user canceled
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listName || "רשימת-קניות"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <h2 className="text-base font-bold text-foreground">📤 ייצוא רשימה</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3 space-y-2 border-b border-border">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnchecked}
              onChange={(e) => setOnlyUnchecked(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            רק פריטים שלא נקנו
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={groupByCategory}
              onChange={(e) => setGroupByCategory(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            קיבוץ לפי קטגוריות
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <textarea
            value={text}
            readOnly
            dir="rtl"
            className="w-full h-64 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="px-4 py-3 border-t border-border grid grid-cols-2 gap-2">
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? "✓ הועתק" : "📋 העתק"}
          </Button>
          <Button onClick={handleWhatsApp} variant="outline" size="sm">
            💬 וואטסאפ
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            💾 הורד קובץ
          </Button>
          <Button onClick={handleShare} size="sm">
            📤 שתף
          </Button>
        </div>
      </div>
    </div>
  );
}
