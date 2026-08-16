#!/usr/bin/env node
/**
 * כלי גיבוי והעברה של רשימות הקניות
 * ==================================
 *
 * שלוש פקודות:
 *   node migrate.mjs backup    — מוריד את כל הנתונים לקובץ backup.json
 *   node migrate.mjs restore   — מעלה את backup.json למסד החדש
 *   node migrate.mjs verify    — בודק ששני המסדים מכילים את אותו דבר
 *
 * לא צריך להתקין כלום. דורש Node.js 18 ומעלה.
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(DIR, "migrate-config.json");
const BACKUP_PATH = path.join(DIR, "backup.json");

const TABLES = ["saved_lists", "grocery_items"];
const PAGE_SIZE = 1000;
const INSERT_BATCH = 200;

// ---------- עזרי תצוגה ----------

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const log = (msg = "") => console.log(msg);
const ok = (msg) => console.log(`${c.green}✓${c.reset} ${msg}`);
const warn = (msg) => console.log(`${c.yellow}!${c.reset} ${msg}`);
const step = (msg) => console.log(`${c.cyan}→${c.reset} ${msg}`);

function fail(msg, hint) {
  console.error(`\n${c.red}${c.bold}✗ ${msg}${c.reset}`);
  if (hint) console.error(`${c.dim}${hint}${c.reset}`);
  console.error();
  process.exit(1);
}

// ---------- הגדרות ----------

const CONFIG_TEMPLATE = {
  _הסבר: "מלאו את הערכים. את הישנים תמצאו בקובץ .env של הפרויקט; את החדשים ב-Supabase → Project Settings → API",
  ישן: {
    url: "https://xxxxx.supabase.co",
    key: "eyJhbGci...",
  },
  חדש: {
    url: "https://yyyyy.supabase.co",
    key: "eyJhbGci...",
  },
};

async function loadConfig({ needNew }) {
  if (!existsSync(CONFIG_PATH)) {
    await writeFile(CONFIG_PATH, JSON.stringify(CONFIG_TEMPLATE, null, 2), "utf8");
    fail(
      "לא נמצא קובץ הגדרות — יצרתי אחד חדש: migrate-config.json",
      "פתחו אותו, מלאו את הכתובות והמפתחות, ואז הריצו שוב את הפקודה.",
    );
  }

  let cfg;
  try {
    cfg = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  } catch {
    fail("קובץ ההגדרות אינו תקין", "ודאו שלא נמחקו סוגריים או פסיקים בעריכה.");
  }

  const check = (side, label) => {
    const s = cfg[side];
    if (!s?.url || !s?.key || s.url.includes("xxxxx") || s.url.includes("yyyyy") || s.key.startsWith("eyJhbGci...")) {
      fail(`חסרים פרטי החיבור ל${label}`, "מלאו אותם ב-migrate-config.json והריצו שוב.");
    }
    return { url: s.url.replace(/\/+$/, ""), key: s.key.trim() };
  };

  return {
    old: check("ישן", "מסד הישן"),
    new: needNew ? check("חדש", "מסד החדש") : null,
  };
}

// ---------- גישה ל-Supabase ----------

function headers(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

async function request(url, options, what) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    fail(`אין תקשורת עם השרת בזמן ${what}`, `בדקו את חיבור האינטרנט ואת הכתובת.\n${e.message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const hints = {
      401: "המפתח שגוי או פג תוקף. העתיקו מחדש את המפתח 'anon public'.",
      404: "הטבלה לא קיימת. במסד החדש — הריצו קודם את supabase/setup.sql.",
      403: "אין הרשאה. ודאו שהרצתם את כל setup.sql, כולל חלק ההרשאות.",
    };
    fail(
      `השרת החזיר שגיאה ${res.status} בזמן ${what}`,
      `${hints[res.status] ?? ""}\n${body.slice(0, 300)}`,
    );
  }

  return res;
}

async function fetchAll(conn, table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const url = `${conn.url}/rest/v1/${table}?select=*&order=id.asc&limit=${PAGE_SIZE}&offset=${from}`;
    const res = await request(url, { headers: headers(conn.key) }, `קריאת ${table}`);
    const page = await res.json();
    rows.push(...page);
    process.stdout.write(`\r  ${table}: ${rows.length} שורות`);
    if (page.length < PAGE_SIZE) break;
  }
  process.stdout.write("\n");
  return rows;
}

async function countRows(conn, table) {
  const url = `${conn.url}/rest/v1/${table}?select=id&limit=1`;
  const res = await request(
    url,
    { headers: headers(conn.key, { Prefer: "count=exact", Range: "0-0" }) },
    `ספירת ${table}`,
  );
  const range = res.headers.get("content-range") ?? "";
  return Number(range.split("/")[1]) || 0;
}

async function insertRows(conn, table, rows) {
  if (rows.length === 0) return 0;
  let done = 0;

  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const batch = rows.slice(i, i + INSERT_BATCH);
    const url = `${conn.url}/rest/v1/${table}`;
    await request(
      url,
      {
        method: "POST",
        headers: headers(conn.key, {
          "Content-Type": "application/json",
          // merge-duplicates => אפשר להריץ שוב בלי ליצור כפילויות
          Prefer: "return=minimal,resolution=merge-duplicates",
        }),
        body: JSON.stringify(batch),
      },
      `כתיבת ${table}`,
    );
    done += batch.length;
    process.stdout.write(`\r  ${table}: ${done}/${rows.length} שורות`);
  }

  process.stdout.write("\n");
  return done;
}

// ---------- פקודות ----------

async function backup() {
  log(`\n${c.bold}📦 גיבוי הנתונים מהמסד הישן${c.reset}\n`);
  const cfg = await loadConfig({ needNew: false });
  step(`מתחבר אל ${cfg.old.url}`);

  const data = {};
  for (const table of TABLES) {
    data[table] = await fetchAll(cfg.old, table);
  }

  const payload = {
    נוצר: new Date().toISOString(),
    מקור: cfg.old.url,
    נתונים: data,
  };
  await writeFile(BACKUP_PATH, JSON.stringify(payload, null, 2), "utf8");

  const lists = data.saved_lists.length;
  const items = data.grocery_items.length;
  const phones = new Set(data.saved_lists.map((r) => r.phone_number));

  log();
  ok(`נשמרו ${lists} רשימות ו-${items} מוצרים (${phones.size} מספרי טלפון)`);
  ok(`הקובץ: ${c.bold}backup.json${c.reset}`);

  if (lists === 0 && items === 0) {
    warn("המסד ריק. אם ציפיתם לנתונים — ודאו שהכתובת והמפתח שייכים לפרויקט הנכון.");
  } else {
    log(`\n${c.dim}שמרו עותק של backup.json במקום בטוח לפני שממשיכים.${c.reset}`);
  }
  log();
}

async function restore() {
  log(`\n${c.bold}📤 העלאת הנתונים למסד החדש${c.reset}\n`);

  if (!existsSync(BACKUP_PATH)) {
    fail("לא נמצא קובץ backup.json", "הריצו קודם:  node migrate.mjs backup");
  }

  const cfg = await loadConfig({ needNew: true });
  const payload = JSON.parse(await readFile(BACKUP_PATH, "utf8"));
  const data = payload.נתונים;

  if (cfg.new.url === cfg.old.url) {
    fail("המסד החדש והישן זהים", "בדקו שהזנתם כתובת שונה תחת 'חדש' בקובץ ההגדרות.");
  }

  step(`מעלה אל ${cfg.new.url}`);
  log(`${c.dim}  (הרשימות קודם, אחר כך המוצרים — כדי שהקישור ביניהם יישמר)${c.reset}`);

  // הסדר קריטי: grocery_items מצביע על saved_lists
  for (const table of TABLES) {
    await insertRows(cfg.new, table, data[table] ?? []);
  }

  log();
  ok("ההעלאה הושלמה");
  log(`\n${c.dim}עכשיו הריצו:  node migrate.mjs verify${c.reset}\n`);
}

async function verify() {
  log(`\n${c.bold}🔍 השוואה בין שני המסדים${c.reset}\n`);
  const cfg = await loadConfig({ needNew: true });

  let allMatch = true;
  for (const table of TABLES) {
    const [before, after] = await Promise.all([
      countRows(cfg.old, table),
      countRows(cfg.new, table),
    ]);
    const match = before === after;
    allMatch &&= match;
    const mark = match ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
    log(`  ${mark} ${table.padEnd(16)} ישן: ${String(before).padStart(5)}   חדש: ${String(after).padStart(5)}`);
  }

  log();
  if (allMatch) {
    ok("הכל תואם. הנתונים הועברו בהצלחה.");
    log(`\n${c.bold}הצעד האחרון:${c.reset}`);
    log("  1. עדכנו את .env לכתובת ולמפתח החדשים");
    log("  2. npm run build");
    log("  3. פרסמו מחדש\n");
  } else {
    warn("יש פער בין המסדים.");
    log(`${c.dim}  אם החדש גדול יותר — כנראה הרצתם restore פעמיים על נתונים שונים.`);
    log(`  אם קטן יותר — הריצו restore שוב; הוא מדלג על מה שכבר קיים.${c.reset}\n`);
  }
}

// ---------- הפעלה ----------

const commands = { backup, restore, verify };
const cmd = process.argv[2];

if (!commands[cmd]) {
  log(`
${c.bold}כלי העברת רשימות הקניות${c.reset}

  ${c.cyan}node migrate.mjs backup${c.reset}    הורדת הנתונים מהמסד הישן
  ${c.cyan}node migrate.mjs restore${c.reset}   העלאתם למסד החדש
  ${c.cyan}node migrate.mjs verify${c.reset}    בדיקה ששניהם זהים

${c.dim}הריצו לפי הסדר. ההגדרות נמצאות ב-migrate-config.json${c.reset}
`);
  process.exit(1);
}

const [major] = process.versions.node.split(".").map(Number);
if (major < 18) {
  fail(`נדרש Node.js 18 ומעלה (מותקן: ${process.versions.node})`, "עדכנו מ-nodejs.org");
}

commands[cmd]().catch((e) => fail("שגיאה בלתי צפויה", e.stack));
