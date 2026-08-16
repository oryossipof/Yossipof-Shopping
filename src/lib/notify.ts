// שליחת התראה בוואטסאפ דרך קישור wa.me.
// אין כאן API בתשלום ואין מכסה — הקישור פותח את וואטסאפ עם ההודעה מוכנה,
// והמשתמש לוחץ "שלח" בעצמו.

/**
 * הופך מספר ישראלי לפורמט הבינלאומי ש-wa.me דורש.
 *   050-123-4567    → 972501234567
 *   +972 50 1234567 → 972501234567
 * מחזיר null אם המספר אינו תקין.
 */
export function toWhatsAppNumber(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;

  // 00 בתחילת המספר היא קידומת יציאה בינלאומית
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.startsWith("972")) {
    // כבר בינלאומי; מסירים 0 מיותר אחרי הקידומת (972-050-…)
    digits = "972" + digits.slice(3).replace(/^0+/, "");
  } else if (digits.startsWith("0")) {
    digits = "972" + digits.replace(/^0+/, "");
  }

  // מספר ישראלי תקין: 972 + 9 ספרות
  if (digits.startsWith("972") && digits.length !== 12) return null;
  if (digits.length < 8 || digits.length > 15) return null;

  return digits;
}

export function buildMessage(listName: string): string {
  return `סיימתי לעדכן את הרשימה "${listName}" 🛒`;
}

export function whatsappUrl(phone: string, message: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
