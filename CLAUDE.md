# CLAUDE.md

הנחיות לעבודה עם Claude Code בריפו הזה.

## מה זה

**רשימת קניות** — PWA משפחתי לניהול רשימות קניות. אפליקציית SPA בעברית, RTL,
עם התקנה כאפליקציה באנדרואיד/אייפון ותמיכה מלאה בעבודה בלי אינטרנט. הזיהוי
של המשתמשים הוא לפי מספר טלפון בלבד (בלי אימות SMS) — ראו את אזהרת האבטחה
ב-README.md וב-`supabase/setup.sql`.

## הסטאק

- **בנייה**: Vite 7 + React 19 + TypeScript (strict mode, `noEmit: true`)
- **עיצוב**: Tailwind CSS 4 (plugin של Vite, לא PostCSS) + `tw-animate-css`.
  הצבעים מוגדרים כמשתני CSS ב-`oklch` בקובץ `src/styles.css`, וממופים ל-utility
  classes דרך בלוק `@theme inline`. **כל צבע חייב פורמט `oklch`** (ראו הערה
  בראש הקובץ).
- **רכיבי UI**: shadcn/ui מקומי תחת `src/components/ui/` (מבוסס Radix UI +
  `class-variance-authority` + `clsx`/`tailwind-merge` דרך `src/lib/utils.ts`)
- **מסד נתונים / backend**: Supabase (Postgres + Realtime + REST), ללא שרת
  משלה — כל הקריאות ל-DB מתבצעות ישירות מהדפדפן דרך
  `src/integrations/supabase/client.ts`
- **PWA**: `vite-plugin-pwa` (Workbox) — service worker עם `registerType:
  "autoUpdate"`, מוגדר ב-`vite.config.ts`
- **Alias נתיבים**: `@/*` מצביע ל-`src/*` (מוגדר גם ב-`tsconfig.json` וגם
  ב-`vite.config.ts`)
- **פריסה**: Netlify (`netlify.toml`) או Vercel (`vercel.json`), סטטי לחלוטין

## מבנה הקוד

```
src/
├── App.tsx                       המסך הראשי — state, סינון, קיבוץ לפי קטגוריה
├── main.tsx                      נקודת כניסה + רישום ה-service worker
├── ErrorBoundary.tsx             מסך שגיאה ידידותי (React error boundary)
├── components/
│   ├── ui/                       רכיבי בסיס (shadcn/ui: button, input, dialog...)
│   ├── AddItemForm.tsx           טופס הוספת מוצר
│   ├── GroceryItemCard.tsx       כרטיס מוצר בודד
│   ├── ListSwitcher.tsx          מעבר/יצירה/מחיקה/שינוי שם של רשימות
│   ├── PhoneGate.tsx             מסך כניסה לפי מספר טלפון
│   ├── ImportItemsDialog.tsx     ייבוא פריטים מקובץ
│   ├── ImportFromListDialog.tsx  ייבוא פריטים מרשימה אחרת
│   ├── ExportListDialog.tsx      ייצוא/שיתוף רשימה
│   └── NotifyDialog.tsx          שליחת עדכון בוואטסאפ
├── hooks/
│   ├── use-grocery-list.ts       CRUD על פריטים + סנכרון בזמן אמת (Supabase
│   │                             Realtime channel) + כתיבה ל-offline cache
│   └── use-lists.ts              ניהול רשימות קניות (saved_lists)
├── lib/
│   ├── grocery-store.ts          טיפוסי הליבה: GroceryItem, SavedList
│   ├── grocery-categories.ts     מילון סיווג מוצרים לקטגוריות בעברית
│   ├── offline-cache.ts          שכבת localStorage — עבודה בלי אינטרנט
│   ├── use-phone.ts               state של מספר הטלפון + הרשימה הנוכחית
│   ├── notify.ts                  בניית הודעת וואטסאפ
│   ├── image-utils.ts             עיבוד תמונות (למשל דחיסה לפני שמירה)
│   └── utils.ts                   `cn()` — מיזוג classNames (clsx + tailwind-merge)
├── integrations/supabase/
│   ├── client.ts                  יצירת ה-Supabase client מתוך משתני סביבה
│   └── types.ts                   טיפוסי הסכמה שנוצרו מ-Supabase
└── styles.css                     הגדרת מערכת העיצוב (Tailwind, oklch, RTL)

supabase/setup.sql                 סכמת ה-DB המלאה (טבלאות, אינדקסים, RLS, realtime)
public/                            אייקונים, manifest, _redirects (Netlify)
```

**זרימת נתונים**: `App.tsx` משתמש ב-`usePhone` (מזהה המשתמש), `useLists`
(רשימות) ו-`useGroceryList` (פריטים ברשימה הנוכחית). `useGroceryList` טוען
תחילה מה-cache המקומי לרינדור מיידי, ואז שולף מ-Supabase ומעדכן; שינויים
מתקבלים גם בזמן אמת דרך `postgres_changes` channel, וכל שינוי ב-`items`
נכתב חזרה ל-cache.

## פקודות

```bash
npm install
npm run dev       # שרת פיתוח, http://localhost:5173
npm run build     # בדיקת build לייצור (כולל type-check דרך vite build)
npm run preview   # תצוגה מקומית של גרסת ה-build
```

אין בריפו test runner, linter, או פקודת `typecheck` נפרדת — `npm run build`
הוא הדרך היחידה לוודא שאין שגיאות TypeScript, ויש להריץ אותו לפני סיום כל
משימה.

## כללים חשובים

- **עברית ו-RTL**: כל טקסט שמוצג למשתמש חייב להיות בעברית. הממשק כולו RTL
  (`dir="rtl"` מוגדר ב-`index.html` וב-manifest של ה-PWA). שמרו על כיווניות
  נכונה גם ברכיבים חדשים (יישור טקסט, אייקונים, מרווחים).
- **בלי מפתחות בקוד**: אסור לכתוב API keys, סודות, או פרטי חיבור בקוד.
  משתני הסביבה היחידים הם `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_PUBLISHABLE_KEY`
  (ראו `.env.example`), ונטענים דרך `import.meta.env` (ראו
  `src/integrations/supabase/client.ts`).
- **שינוי סכמת מסד הנתונים**: כל שינוי בטבלאות, עמודות, אינדקסים או RLS
  policies חייב להתעדכן במקביל ב-`supabase/setup.sql` — זהו מקור האמת היחיד
  לסכמה (אין תיקיית migrations נפרדת).
- **תמיכה אופליין**: פיצ'ר שנוגע בנתונים (קריאה/כתיבה של פריטים או רשימות)
  צריך להתחשב ב-`src/lib/offline-cache.ts` ובהתנהגות כשאין רשת — לוודא
  שהמידע מוצג מה-cache כשאין חיבור, ושה-cache מתעדכן בהתאם לשינויים חדשים.
  שימו לב גם להגדרות ה-`runtimeCaching` של Workbox ב-`vite.config.ts`
  (`NetworkFirst` לקריאות REST של Supabase).
- **לפני סיום משימה**: להריץ `npm run build` ולוודא שאין שגיאות TypeScript.
