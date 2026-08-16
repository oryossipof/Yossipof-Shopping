import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ShoppingList } from "@/hooks/use-lists";

interface ListSwitcherProps {
  lists: ShoppingList[];
  currentListId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onClose: () => void;
}

export function ListSwitcher({
  lists,
  currentListId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onClose,
}: ListSwitcherProps) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    const name = newName.trim() || "רשימה חדשה";
    onCreate(name);
    setNewName("");
    setShowNew(false);
    onClose();
  };

  const handleRename = (id: string) => {
    if (editName.trim()) onRename(id, editName.trim());
    setEditingId(null);
  };

  return (
    <>
      {/* Click-away overlay */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 z-[70] w-[min(20rem,calc(100vw-1rem))] bg-card rounded-2xl shadow-2xl border border-border max-h-[70vh] flex flex-col animate-in slide-in-from-top-2 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">הרשימות שלי</h2>
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

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {lists.map((list) => {
            const isCurrent = list.id === currentListId;
            const isEditing = editingId === list.id;
            const isConfirming = confirmDeleteId === list.id;

            return (
              <div
                key={list.id}
                className={`flex items-center gap-2 rounded-xl p-3 transition-colors ${
                  isCurrent ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {/* Checkmark for current */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isCurrent ? (
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>

                {/* Name / edit */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(list.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(list.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ) : (
                  <button
                    className="flex-1 text-right font-medium text-foreground truncate min-w-0"
                    onClick={() => {
                      onSelect(list.id);
                      onClose();
                    }}
                  >
                    {list.name}
                  </button>
                )}

                {/* Edit button */}
                {!isEditing && !isConfirming && (
                  <button
                    onClick={() => {
                      setEditingId(list.id);
                      setEditName(list.name);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center"
                    aria-label="ערוך שם"
                  >
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                    </svg>
                  </button>
                )}

                {/* Delete */}
                {isConfirming ? (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => { onDelete(list.id); setConfirmDeleteId(null); }}>
                      מחק
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                      ביטול
                    </Button>
                  </>
                ) : (
                  !isEditing && (
                    <button
                      onClick={() => setConfirmDeleteId(list.id)}
                      className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center"
                      aria-label="מחק רשימה"
                    >
                      <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Create new */}
        <div className="p-3 border-t border-border">
          {showNew ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="שם הרשימה החדשה..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowNew(false);
                }}
                className="flex-1 rounded-lg bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button onClick={handleCreate}>צור</Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>ביטול</Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowNew(true)}>
              ➕ רשימה חדשה
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
