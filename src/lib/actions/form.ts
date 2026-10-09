import { z } from "zod";

/**
 * Convert FormData into a plain object for schema parsing.
 * Repeated keys (checkbox groups, multi-selects) become arrays; single keys stay strings.
 */
export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const result: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const key of new Set(formData.keys())) {
    // Next.js adds internal `$ACTION_*` fields to progressive-enhancement submits.
    if (key.startsWith("$ACTION")) {
      continue;
    }
    const values = formData.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

export type FormParseResult<T> =
  | { success: true; data: T }
  | { success: false; fieldErrors: Record<string, string[]> };

/** Validate FormData with a zod schema and return flattened per-field errors on failure. */
export function parseFormData<S extends z.ZodType>(schema: S, formData: FormData): FormParseResult<z.output<S>> {
  const parsed = schema.safeParse(formDataToObject(formData));
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { success: false, fieldErrors };
}

/**
 * Field helpers for HTML form semantics, so schemas read like the form:
 *
 *   const schema = z.object({
 *     name: field.text({ min: 1, max: 80 }),
 *     note: field.optionalText({ max: 500 }),
 *     stock: field.int({ min: 0 }),
 *     enabled: field.checkbox(),
 *     tags: field.list(z.string()),
 *   });
 */
export const field = {
  /** Trimmed required string. */
  text({ min = 1, max = 200 }: { min?: number; max?: number } = {}) {
    return z.string().trim().min(min).max(max);
  },
  /** Trimmed string; empty input becomes null. */
  optionalText({ max = 200 }: { max?: number } = {}) {
    return z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value ?? null),
      z.string().trim().max(max).nullable(),
    );
  },
  /** Integer from a number input. Empty input fails unless a default is supplied. */
  int({ min, max, defaultValue }: { min?: number; max?: number; defaultValue?: number } = {}) {
    let schema = z.number().int();
    if (min !== undefined) schema = schema.min(min);
    if (max !== undefined) schema = schema.max(max);
    return z.preprocess((value) => {
      if (value === undefined || value === "") return defaultValue;
      return typeof value === "string" ? Number(value) : value;
    }, schema);
  },
  /** Checkbox: present ("on" / "true") → true, absent → false. */
  checkbox() {
    return z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());
  },
  /** Repeated field (checkbox group / multi-select). Absent → [], single value → [value]. */
  list<T extends z.ZodType>(item: T) {
    return z.preprocess(
      (value) => (value === undefined || value === "" ? [] : Array.isArray(value) ? value : [value]),
      z.array(item),
    );
  },
  /** Non-empty id from a hidden input. */
  id() {
    return z.string().trim().min(1).max(128);
  },
};
