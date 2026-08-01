import { describe, expect, it } from "vitest";
import {
  buildListHref,
  clampPage,
  escapeLikePattern,
  parseListQuery,
  totalPages,
} from "./pagination";

describe("list pagination helpers", () => {
  it("parses page, query and page size with sane defaults", () => {
    expect(parseListQuery({})).toEqual({ page: 1, pageSize: 20, q: "", offset: 0 });
    expect(parseListQuery({ page: "3", q: "  alice  ", pageSize: "10" })).toEqual({
      page: 3,
      pageSize: 10,
      q: "alice",
      offset: 20,
    });
  });

  it("rejects non-positive and oversized page sizes", () => {
    expect(parseListQuery({ page: "0", pageSize: "0" }).page).toBe(1);
    expect(parseListQuery({ pageSize: "999" }).pageSize).toBe(100);
  });

  it("computes total pages and clamps the current page", () => {
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(21, 20)).toBe(2);
    expect(clampPage(9, 21, 20)).toBe(2);
  });

  it("escapes LIKE wildcards", () => {
    expect(escapeLikePattern("100%_off\\x")).toBe("100\\%\\_off\\\\x");
  });

  it("builds stable list hrefs", () => {
    expect(buildListHref("/app/users", { page: 1, q: "" })).toBe("/app/users");
    expect(buildListHref("/app/users", { page: 2, q: "a" })).toBe("/app/users?q=a&page=2");
  });
});
