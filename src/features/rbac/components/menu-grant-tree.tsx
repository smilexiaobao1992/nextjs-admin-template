"use client";

import { useEffect, useRef, useState } from "react";
import type { MenuNodeType } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export type GrantTreeNode = {
  id: string;
  parentId: string | null;
  type: MenuNodeType;
  title: string;
  permissionKey: string | null;
  sortOrder: number;
};

function byOrder(a: GrantTreeNode, b: GrantTreeNode) {
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "zh-CN");
}

/**
 * Next checked set after toggling one node.
 * Checking an action also grants its page; unchecking a page revokes its actions.
 */
export function toggleGrant(
  nodes: GrantTreeNode[],
  checked: ReadonlySet<string>,
  nodeId: string,
  nextChecked: boolean,
): Set<string> {
  const byId = new Map(nodes.map((item) => [item.id, item]));
  const node = byId.get(nodeId);
  const next = new Set(checked);
  if (!node?.permissionKey) {
    return next;
  }

  if (nextChecked) {
    next.add(node.id);
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (node.type === "action" && parent?.type === "page" && parent.permissionKey) {
      next.add(parent.id);
    }
    return next;
  }

  next.delete(node.id);
  if (node.type === "page") {
    for (const item of nodes) {
      if (item.parentId === node.id) {
        next.delete(item.id);
      }
    }
  }
  return next;
}

function TriStateCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="size-4"
    />
  );
}

export function MenuGrantTree({
  nodes,
  grantedIds,
  editableIds,
  readOnly = false,
}: {
  nodes: GrantTreeNode[];
  grantedIds: string[];
  /** Nodes the current actor may grant; null means every node. */
  editableIds: string[] | null;
  readOnly?: boolean;
}) {
  const [checked, setChecked] = useState(() => new Set(grantedIds));
  const editable = editableIds ? new Set(editableIds) : null;
  const canToggle = (node: GrantTreeNode) =>
    !readOnly && Boolean(node.permissionKey) && (editable === null || editable.has(node.id));
  const childrenOf = (parentId: string | null) => nodes.filter((item) => item.parentId === parentId).sort(byOrder);

  function toggle(nodeId: string, nextChecked: boolean) {
    setChecked((current) => toggleGrant(nodes, current, nodeId, nextChecked));
  }

  function toggleGroup(group: GrantTreeNode[], nextChecked: boolean) {
    setChecked((current) => {
      let next = new Set(current);
      const ordered = nextChecked ? group : [...group].reverse();
      for (const node of ordered) {
        if (canToggle(node)) {
          next = toggleGrant(nodes, next, node.id, nextChecked);
        }
      }
      return next;
    });
  }

  function grantableDescendants(node: GrantTreeNode): GrantTreeNode[] {
    return childrenOf(node.id).flatMap((child) => [
      ...(child.permissionKey ? [child] : []),
      ...grantableDescendants(child),
    ]);
  }

  function renderActions(parent: GrantTreeNode) {
    const actions = childrenOf(parent.id).filter((item) => item.type === "action");
    if (actions.length === 0) {
      return null;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <label
            key={action.id}
            className={cn(
              "flex min-h-9 items-center gap-2 rounded-lg border border-border/70 bg-card/70 px-3 text-sm",
              canToggle(action) ? "cursor-pointer hover:bg-accent" : "opacity-60",
            )}
          >
            <input
              type="checkbox"
              checked={checked.has(action.id)}
              disabled={!canToggle(action)}
              onChange={(event) => toggle(action.id, event.target.checked)}
              className="size-4"
            />
            <span>{action.title}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{action.permissionKey}</span>
          </label>
        ))}
      </div>
    );
  }

  function renderPage(page: GrantTreeNode) {
    return (
      <div key={page.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center">
        <label className={cn("flex min-w-0 items-center gap-2.5", canToggle(page) ? "cursor-pointer" : "")}>
          {page.permissionKey ? (
            <input
              type="checkbox"
              checked={checked.has(page.id)}
              disabled={!canToggle(page)}
              onChange={(event) => toggle(page.id, event.target.checked)}
              className="size-4"
            />
          ) : (
            <span className="size-4" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{page.title}</span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">
              {page.permissionKey ?? "登录即可访问"}
            </span>
          </span>
        </label>
        {renderActions(page)}
      </div>
    );
  }

  const roots = childrenOf(null);
  const rootPages = roots.filter((item) => item.type === "page");
  const directories = roots.filter((item) => item.type === "directory");

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">权限范围</legend>
      <p className="mb-3 text-xs text-muted-foreground">勾选页面即可访问；勾选操作会自动勾选所属页面。</p>

      {[...checked].map((id) => (
        <input key={id} type="hidden" name="menuIds" value={id} />
      ))}

      <div className="divide-y divide-border/70 overflow-hidden rounded-lg bg-secondary/35">
        {rootPages.length > 0 ? <div className="divide-y divide-border/50">{rootPages.map(renderPage)}</div> : null}

        {directories.map((directory) => {
          const group = grantableDescendants(directory);
          if (group.length === 0) {
            return null;
          }
          const checkedCount = group.filter((item) => checked.has(item.id)).length;
          const groupEditable = group.some(canToggle);
          const directActions = childrenOf(directory.id).filter((item) => item.type === "action");
          return (
            <section key={directory.id}>
              <div className="flex items-center gap-2.5 bg-secondary/50 px-4 py-2.5">
                <TriStateCheckbox
                  label={`全选${directory.title}`}
                  checked={checkedCount === group.length}
                  indeterminate={checkedCount > 0 && checkedCount < group.length}
                  disabled={!groupEditable}
                  onChange={(value) => toggleGroup(group, value)}
                />
                <span className="text-sm font-semibold">{directory.title}</span>
                <span className="text-xs text-muted-foreground">{checkedCount}/{group.length}</span>
              </div>
              <div className="divide-y divide-border/50">
                {childrenOf(directory.id).filter((item) => item.type === "page").map(renderPage)}
                {directActions.length > 0 ? <div className="px-4 py-3">{renderActions(directory)}</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </fieldset>
  );
}
