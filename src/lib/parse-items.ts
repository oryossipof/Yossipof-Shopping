// Turning free text into a list of product names.

const MAX_NAME_LENGTH = 100;

/**
 * Splits what was typed into the add box. Deliberately simple: only commas,
 * semicolons and line breaks separate products, and nothing is stripped from
 * the start of a name — "7up" and "3% חלב" must survive intact.
 */
export function splitTypedNames(text: string): string[] {
  return text
    .split(/\r?\n|,|;/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.length < MAX_NAME_LENGTH);
}

/**
 * Parses a pasted or uploaded list, where lines often carry checkbox marks,
 * bullets or numbering that are not part of the product name.
 */
export function parseImportedNames(text: string): string[] {
  return text
    .split(/\r?\n|,|;|•|·/)
    .map((line) =>
      line
        // strip checkbox markers, bullets, numbering
        .replace(/^[\s\-\*\+•○□☐☑✓✔\[\]xX\d\.\)]+/u, "")
        .trim(),
    )
    .filter((line) => line.length > 0 && line.length < MAX_NAME_LENGTH);
}
