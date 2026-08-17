-- ============================================================
-- הקמת מסד הנתונים בפרויקט Supabase חדש
-- ============================================================
-- הריצו את כל הקובץ פעם אחת ב:
--   Supabase Dashboard → SQL Editor → New query → הדביקו → Run
--
-- זהו איחוד של כל המיגרציות המקוריות לקובץ אחד.
-- ============================================================

-- ---------- טבלאות ----------

CREATE TABLE IF NOT EXISTS public.saved_lists (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number   TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  items          JSONB       DEFAULT '[]'::jsonb,
  category_order JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent upgrade for databases created before category_order existed.
-- Purely additive: existing rows are untouched and get category_order = NULL,
-- which the app treats as "use the default category order".
ALTER TABLE public.saved_lists ADD COLUMN IF NOT EXISTS category_order JSONB;

CREATE TABLE IF NOT EXISTS public.grocery_items (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number  TEXT        NOT NULL,
  list_id       UUID        REFERENCES public.saved_lists(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  quantity      NUMERIC     NOT NULL DEFAULT 1,
  unit          TEXT        NOT NULL DEFAULT 'יח',
  image_url     TEXT,
  checked       BOOLEAN     NOT NULL DEFAULT false,
  category      TEXT,
  notes         TEXT,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- אינדקסים ----------

CREATE INDEX IF NOT EXISTS idx_saved_lists_phone     ON public.saved_lists(phone_number);
CREATE INDEX IF NOT EXISTS idx_grocery_items_phone   ON public.grocery_items(phone_number);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON public.grocery_items(list_id);

-- ---------- הרשאות (RLS) ----------
--
-- ⚠️  שימו לב: המדיניות כאן פתוחה, בדיוק כמו באפליקציה המקורית.
--     מספר הטלפון הוא "הסיסמה" — אין אימות SMS.
--     המשמעות: מי שמשיג את המפתח הציבורי (שנמצא בקוד שרץ בדפדפן)
--     יכול תיאורטית לגשת לרשימות של מספרים אחרים.
--
--     בשביל רשימת קניות משפחתית זה בדרך כלל מקובל.
--     אם תרצו אבטחה אמיתית — צריך להוסיף התחברות אמיתית (Supabase Auth).

ALTER TABLE public.saved_lists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public access saved_lists"   ON public.saved_lists;
DROP POLICY IF EXISTS "public access grocery_items" ON public.grocery_items;

CREATE POLICY "public access saved_lists"
  ON public.saved_lists FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public access grocery_items"
  ON public.grocery_items FOR ALL USING (true) WITH CHECK (true);

-- ---------- סנכרון בזמן אמת בין מכשירים ----------

ALTER TABLE public.grocery_items REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_items;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- כבר נוסף, אפשר להתעלם
END $$;
