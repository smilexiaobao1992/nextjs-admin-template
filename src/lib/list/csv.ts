const UTF8_BOM = "\uFEFF";
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

/**
 * Format a single CSV cell and neutralize spreadsheet formula injection
 * (`=`, `+`, `-`, `@` at the start of a cell) before quoting.
 */
export function escapeCsvCell(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return "";
  }
  const text = raw instanceof Date ? raw.toISOString() : String(raw);
  const safe = FORMULA_PREFIX_RE.test(text) ? `'${text}` : text;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Build a RFC-4180 CSV string with a leading UTF-8 BOM so Microsoft Excel
 * and WPS open Chinese characters cleanly without encoding issues.
 */
export function buildCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const headerLine = columns.map((col) => escapeCsvCell(col.header)).join(",");
  const bodyLines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(col.value(row))).join(","),
  );
  return UTF8_BOM + [headerLine, ...bodyLines].join("\r\n") + "\r\n";
}

export function createCsvResponse(csv: string, filename: string): Response {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${cleanName}"`,
      "Cache-Control": "no-store",
    },
  });
}
