import { describe, expect, it } from "vitest";
import { z } from "zod";
import { field, formDataToObject, parseFormData } from "./form";

function fd(entries: Array<[string, string]>) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("formDataToObject", () => {
  it("keeps single values as strings and repeated keys as arrays", () => {
    expect(formDataToObject(fd([["name", "A"], ["tag", "x"], ["tag", "y"], ["$ACTION_ID_1", ""]]))).toEqual({
      name: "A",
      tag: ["x", "y"],
    });
  });
});

describe("parseFormData", () => {
  const schema = z.object({
    name: field.text({ max: 10 }),
    note: field.optionalText(),
    stock: field.int({ min: 0, defaultValue: 0 }),
    enabled: field.checkbox(),
    tags: field.list(z.string()),
  });

  it("applies form semantics", () => {
    const result = parseFormData(schema, fd([["name", "  Pen  "], ["note", "  "], ["stock", "3"], ["enabled", "on"], ["tags", "a"]]));
    expect(result).toEqual({
      success: true,
      data: { name: "Pen", note: null, stock: 3, enabled: true, tags: ["a"] },
    });
  });

  it("defaults absent optional inputs", () => {
    const result = parseFormData(schema, fd([["name", "Pen"]]));
    expect(result).toEqual({
      success: true,
      data: { name: "Pen", note: null, stock: 0, enabled: false, tags: [] },
    });
  });

  it("returns field errors keyed by path", () => {
    const result = parseFormData(schema, fd([["name", ""], ["stock", "-1"]]));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["name", "stock"]);
    }
  });
});
