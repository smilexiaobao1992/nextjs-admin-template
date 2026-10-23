export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export type SortOrder = "asc" | "desc";

export type ListQueryInput = {
  page?: string | string[] | undefined;
  q?: string | string[] | undefined;
  pageSize?: string | string[] | undefined;
  sort?: string | string[] | undefined;
  order?: string | string[] | undefined;
};

export type ParsedListQuery = {
  page: number;
  pageSize: number;
  q: string;
  offset: number;
  sort: string;
  order: SortOrder;
};

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

/** Parse common list search params: page, q, pageSize, sort, order. */
export function parseListQuery(
  input: ListQueryInput,
  defaults?: {
    pageSize?: number;
    sort?: string;
    order?: SortOrder;
    allowedSorts?: readonly string[];
  },
): ParsedListQuery {
  const pageSizeDefault = defaults?.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = parsePositiveInt(firstString(input.page), 1);
  const rawPageSize = parsePositiveInt(firstString(input.pageSize), pageSizeDefault);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize));
  const q = firstString(input.q).trim().slice(0, 100);

  const rawSort = firstString(input.sort).trim().slice(0, 40);
  const defaultSort = defaults?.sort ?? "";
  const sort = defaults?.allowedSorts
    ? defaults.allowedSorts.includes(rawSort)
      ? rawSort
      : defaultSort
    : rawSort || defaultSort;

  const rawOrder = firstString(input.order).trim().toLowerCase();
  const order: SortOrder =
    rawOrder === "asc" || rawOrder === "desc" ? rawOrder : (defaults?.order ?? "desc");

  return {
    page,
    pageSize,
    q,
    offset: (page - 1) * pageSize,
    sort,
    order,
  };
}

export function totalPages(total: number, pageSize: number): number {
  if (total <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page: number, total: number, pageSize: number): number {
  const pages = totalPages(total, pageSize);
  return Math.min(Math.max(1, page), pages);
}

/** Escape LIKE wildcards in user-provided search text. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function buildListHref(
  pathname: string,
  params: {
    page?: number;
    q?: string;
    pageSize?: number;
    sort?: string;
    order?: SortOrder;
  },
): string {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  if (params.pageSize && params.pageSize !== DEFAULT_PAGE_SIZE) {
    search.set("pageSize", String(params.pageSize));
  }
  if (params.sort) {
    search.set("sort", params.sort);
    if (params.order) {
      search.set("order", params.order);
    }
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
