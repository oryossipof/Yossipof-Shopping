import { Button } from "@/components/ui/button";
import { buildMessage, whatsappUrl } from "@/lib/notify";

interface NotifyDialogProps {
  open: boolean;
  onClose: () => void;
  listName: string;
  phone: string;
}

export function NotifyDialog({ open, onClose, listName, phone }: NotifyDialogProps) {
  if (!open) return null;

  const message = buildMessage(listName);
  const url = whatsappUrl(phone, message);

  const handleSend = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl border border-border p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">שליחת עדכון</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none px-2"
            aria-label="סגירה"
          >
            ✕
          </button>
        </div>

        <div className="rounded-lg bg-muted px-3 py-3">
          <p className="text-[10px] text-muted-foreground mb-1.5">ההודעה שתישלח</p>
          <p className="text-sm text-foreground">{message}</p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          נשלח אל <span dir="ltr" className="font-medium text-foreground">{phone}</span>
        </p>

        <Button className="w-full" disabled={!url} onClick={handleSend}>
          פתיחת וואטסאפ
        </Button>

        {!url && (
          <p className="text-xs text-destructive text-center">
            מספר הטלפון אינו תקין לשליחה בוואטסאפ.
          </p>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          וואטסאפ ייפתח עם ההודעה מוכנה — צריך ללחוץ "שלח" שם.
        </p>
      </div>
    </div>
  );
}
