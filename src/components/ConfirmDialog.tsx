import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Explains what is about to happen, including anything irreversible. */
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * A small yes/no gate in front of an action that cannot be undone. Styled to
 * match the app's other dialogs (see ImportItemsDialog).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-xs bg-card rounded-2xl shadow-2xl border border-border p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
