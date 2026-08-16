import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface ImportItemsDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (names: string[]) => void;
}

function parseText(text: string): string[] {
  return text
    .split(/\r?\n|,|;|•|·/)
    .map((line) =>
      line
        // strip checkbox markers, bullets, numbering
        .replace(/^[\s\-\*\+\u2022\u25CB\u25A1\u2610\u2611\u2713\u2714\[\]xX\d\.\)]+/u, "")
        .trim(),
    )
    .filter((line) => line.length > 0 && line.length < 100);
}

export function ImportItemsDialog({ open, onClose, onImport }: ImportItemsDialogProps) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText((prev) => (prev ? `${prev}\n${content}` : content));
    if (fileRef.current) fileRef.current.value = "";
  };

  const items = parseText(text);

  const handleSubmit = () => {
    if (items.length === 0) return;
    onImport(items);
    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">ייבוא רשימה</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            aria-label="סגור"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <p className="text-xs text-muted-foreground">
            הדבק רשימה מ-Notes או העלה קובץ טקסט. כל שורה תהפוך לפריט עם כמות 1 יח׳.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="חלב&#10;לחם&#10;ביצים..."
            dir="rtl"
            className="w-full h-48 rounded-lg bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-base resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={handleFile}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              📄 העלאת קובץ
            </Button>
            <span className="text-xs text-muted-foreground">
              {items.length > 0 ? `${items.length} פריטים יתווספו` : "אין פריטים"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={items.length === 0} className="flex-1">
            ייבא {items.length > 0 ? `(${items.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
