import { describe, expect, it } from "vitest";
import { buildCsv, escapeCsvCell } from "./csv";

describe("CSV export helpers", () => {
  it("escapes quotes, commas, newlines and neutralizes formula injection", () => {
    expect(escapeCsvCell("normal")).toBe("normal");
    expect(escapeCsvCell('a,"b"')).toBe('"a,""b"""');
    expect(escapeCsvCell("=CMD|' /C calc'!A0")).toBe("'=CMD|' /C calc'!A0");
    expect(escapeCsvCell("+100")).toBe("'+100");
    expect(escapeCsvCell(null)).toBe("");
  });

  it("prepends UTF-8 BOM and formats rows", () => {
    const csv = buildCsv(
      [{ name: "张三", email: "zhangsan@example.com" }],
      [
        { header: "姓名", value: (row) => row.name },
        { header: "邮箱", value: (row) => row.email },
      ],
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("姓名,邮箱\r\n张三,zhangsan@example.com\r\n");
  });
});
