/** Append (or replace) `?notice=<code>` on an internal href, preserving other params and the hash. */
export function withNotice(href: string, notice: string): string {
  const [pathAndQuery, hash = ""] = href.split("#", 2);
  const [pathname, query = ""] = pathAndQuery.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("notice", notice);
  return `${pathname}?${params.toString()}${hash ? `#${hash}` : ""}`;
}
