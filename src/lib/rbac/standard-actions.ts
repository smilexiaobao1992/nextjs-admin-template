import { isValidPermissionKey } from "./validate";

/** Common operation nodes that can be generated under a page in one step. */
export const STANDARD_ACTIONS = [
  { verb: "create", title: "新增" },
  { verb: "update", title: "编辑" },
  { verb: "delete", title: "删除" },
  { verb: "export", title: "导出" },
] as const;

export type StandardActionVerb = (typeof STANDARD_ACTIONS)[number]["verb"];

/** Verbs pre-checked in the "create page" form. */
export const DEFAULT_STANDARD_ACTION_VERBS: StandardActionVerb[] = ["create", "update", "delete"];

export function isStandardActionVerb(value: string): value is StandardActionVerb {
  return STANDARD_ACTIONS.some((item) => item.verb === value);
}

/**
 * Derive operation nodes from a page permission key: `orders:read` + ["create"]
 * → `{ title: "新增", permissionKey: "orders:create" }`. Returns [] when the page
 * has no valid key, because actions must belong to a named resource.
 */
export function deriveStandardActions(pagePermissionKey: string | null | undefined, verbs: readonly string[]) {
  const key = pagePermissionKey?.trim().toLowerCase() ?? "";
  if (!isValidPermissionKey(key)) {
    return [];
  }
  const resource = key.split(":")[0];
  const requested = new Set(verbs.filter(isStandardActionVerb));

  return STANDARD_ACTIONS.filter((item) => requested.has(item.verb))
    .map((item) => ({ title: item.title, permissionKey: `${resource}:${item.verb}` }))
    .filter((item) => item.permissionKey !== key && isValidPermissionKey(item.permissionKey))
    .map((item, index) => ({ ...item, sortOrder: (index + 1) * 10 }));
}
