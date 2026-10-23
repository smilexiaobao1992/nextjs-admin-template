import { PageHeader } from "@/components/layout/page-header";
import { FileText, Folder, KeyRound, ListTree, Plus, Sparkles } from "lucide-react";
import { MENU_ICON_OPTIONS } from "@/components/layout/menu-icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { GuardedDirectoryLink, GuardedEditForm } from "@/components/ui/guarded-edit-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusNotice } from "@/components/ui/status-notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { createMenuAction, deleteMenuAction, updateMenuAction } from "@/features/rbac/actions";
import { rbacNoticeMessages } from "@/features/rbac/messages";
import { can, requirePermission } from "@/lib/auth/session";
import { MENU_NODE_TYPES, type MenuNodeType } from "@/lib/db/schema";
import { listAllMenus, type MenuNode } from "@/lib/rbac/permissions";
import {
  DEFAULT_STANDARD_ACTION_VERBS,
  derivePagePermissionKeyFromHref,
  STANDARD_ACTIONS,
} from "@/lib/rbac/standard-actions";
import { cn } from "@/lib/utils";

const TYPE_META: Record<MenuNodeType, { label: string; icon: typeof Folder; hint: string }> = {
  directory: { label: "菜单分组", icon: Folder, hint: "侧边栏的一级折叠目录（如「系统设置」），用于归类多个页面。" },
  page: { label: "菜单页面", icon: FileText, hint: "侧边栏可点击进入的页面。创建时可一键生成该页面的「新增、编辑、删除」操作权限。" },
  action: { label: "页面按钮权限", icon: KeyRound, hint: "页面内部的操作按钮或接口权限（不会出现在左侧菜单栏，供「角色管理」勾选授权）。" },
};

function byOrder(a: MenuNode, b: MenuNode) {
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "zh-CN");
}

function createHref(type: MenuNodeType, parentId?: string) {
  const params = new URLSearchParams({ mode: "create", type });
  if (parentId) {
    params.set("parent", parentId);
  }
  return `/app/menus?${params.toString()}#rbac-detail`;
}

/** Parents a node of this type may be placed under (null = top level). */
function parentCandidates(nodes: MenuNode[], type: MenuNodeType, selfId?: string) {
  const allowed: MenuNodeType[] = type === "page" ? ["directory"] : type === "action" ? ["page", "directory"] : [];
  return nodes.filter((item) => allowed.includes(item.type) && item.id !== selfId).sort(byOrder);
}

/** Derive resource prefix from a page node (either from its permissionKey or its href). */
function resolveResourcePrefix(page: MenuNode | undefined): string {
  if (!page) {
    return "orders";
  }
  const fromKey = page.permissionKey?.split(":")[0];
  if (fromKey) {
    return fromKey;
  }
  const derived = derivePagePermissionKeyFromHref(page.href);
  return derived ? derived.split(":")[0] : "orders";
}

export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; selected?: string; mode?: string; type?: string; parent?: string }>;
}) {
  const session = await requirePermission("menus:read");
  const params = await searchParams;
  const [nodes, canWrite] = await Promise.all([
    listAllMenus(),
    can(session, "menus:write"),
  ]);
  const byId = new Map(nodes.map((item) => [item.id, item]));
  const navChildrenOf = (parentId: string | null) =>
    nodes.filter((item) => item.parentId === parentId && item.type !== "action").sort(byOrder);
  const actionsOf = (parentId: string) =>
    nodes.filter((item) => item.parentId === parentId && item.type === "action").sort(byOrder);

  const createType = MENU_NODE_TYPES.find((type) => type === params.type) ?? "page";
  const createMode = canWrite && params.mode === "create";
  const createParent = params.parent ? byId.get(params.parent) : undefined;
  const selected = byId.get(params.selected ?? "") ?? navChildrenOf(null)[0] ?? null;

  function treeRow(node: MenuNode, depth: number) {
    const Icon = TYPE_META[node.type].icon;
    const active =
      !createMode &&
      (selected?.id === node.id || (selected?.type === "action" && selected.parentId === node.id));
    const pageActionsCount = actionsOf(node.id).length;

    return (
      <div key={node.id}>
        <GuardedDirectoryLink
          href={`/app/menus?selected=${encodeURIComponent(node.id)}#rbac-detail`}
          style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
          className={cn(
            "flex min-h-10 min-w-0 items-center gap-2 rounded-lg py-2 pr-3 text-sm transition-[background-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active ? "bg-primary text-primary-foreground" : "hover:bg-secondary/75 hover:text-secondary-foreground",
          )}
        >
          <Icon aria-hidden="true" className={cn("size-3.5 shrink-0", active ? "" : "text-muted-foreground")} />
          <span className="min-w-0 flex-1 truncate font-medium">{node.title}</span>
          {!node.isVisible ? (
            <span className={cn("shrink-0 text-[11px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
              已隐藏
            </span>
          ) : pageActionsCount > 0 ? (
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] tabular-nums", active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {pageActionsCount} 个操作
            </span>
          ) : null}
        </GuardedDirectoryLink>
        {navChildrenOf(node.id).map((child) => treeRow(child, depth + 1))}
      </div>
    );
  }

  const pageCount = nodes.filter((item) => item.type === "page").length;
  const actionCount = nodes.filter((item) => item.type === "action").length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="导航与权限点"
        title="菜单与权限设置"
        description="左侧管理后台菜单栏的「分组」与「页面」；点击任一页面即可在右侧配置它的「页面内操作按钮权限」（如新增、编辑、删除），无需手动编写权限编码。"
      />

      <StatusNotice notice={params.notice} messages={rbacNoticeMessages} />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <Card className="overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-semibold">侧栏菜单结构</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pageCount} 个页面 · {actionCount} 个操作按钮
              </p>
            </div>
            {canWrite ? (
              <div className="flex gap-1.5">
                <GuardedDirectoryLink
                  href={createHref("directory")}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary/70 px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus aria-hidden="true" className="size-3.5" />分组
                </GuardedDirectoryLink>
                <GuardedDirectoryLink
                  href={createHref("page")}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary/70 px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus aria-hidden="true" className="size-3.5" />页面
                </GuardedDirectoryLink>
              </div>
            ) : null}
          </div>

          {nodes.length === 0 ? (
            <EmptyState
              icon={ListTree}
              title="还没有菜单"
              description={canWrite ? "点击右上角添加第一个菜单分组或页面。" : "请联系管理员配置菜单。"}
            />
          ) : (
            <nav aria-label="菜单与权限结构" className="max-h-[60vh] space-y-0.5 overflow-y-auto p-2.5 lg:max-h-[calc(100vh-12rem)]">
              {navChildrenOf(null).map((node) => treeRow(node, 0))}
            </nav>
          )}
        </Card>

        <div className="min-w-0 space-y-5">
          <Card
            key={createMode ? `create-${createType}-${params.parent ?? ""}` : selected?.id ?? "empty"}
            id="rbac-detail"
            className="min-w-0 scroll-mt-20 p-5 sm:p-6"
          >
            {createMode ? (
              <>
                <DetailHeading
                  type={createType}
                  title={`新增${TYPE_META[createType].label}`}
                  subtitle={TYPE_META[createType].hint}
                />
                <MenuNodeForm
                  action={createMenuAction}
                  type={createType}
                  parents={parentCandidates(nodes, createType)}
                  defaultParentId={createParent?.id}
                  parentNode={createParent}
                  submitLabel={`创建${TYPE_META[createType].label}`}
                />
              </>
            ) : selected ? (
              <>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <DetailHeading
                    type={selected.type}
                    title={canWrite ? `${selected.title} · ${TYPE_META[selected.type].label}` : selected.title}
                    subtitle={
                      selected.isSystem
                        ? "系统内置节点：支持修改显示名称、图标、排序和侧栏显隐状态。"
                        : TYPE_META[selected.type].hint
                    }
                  />
                  {canWrite ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {selected.type === "directory" ? (
                        <GuardedDirectoryLink
                          href={createHref("page", selected.id)}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-input/80 bg-card px-3 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Plus aria-hidden="true" className="size-3.5" />在此分组下新增页面
                        </GuardedDirectoryLink>
                      ) : null}
                      {selected.type === "action" && selected.parentId ? (
                        <GuardedDirectoryLink
                          href={`/app/menus?selected=${encodeURIComponent(selected.parentId)}#rbac-detail`}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-input/80 bg-card px-3 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          返回所属页面
                        </GuardedDirectoryLink>
                      ) : null}
                      {!selected.isSystem ? (
                        <form action={deleteMenuAction}>
                          <input type="hidden" name="id" value={selected.id} />
                          {selected.type === "action" && selected.parentId ? (
                            <input type="hidden" name="returnTo" value={selected.parentId} />
                          ) : null}
                          <ConfirmSubmitButton
                            size="sm"
                            variant="destructive"
                            pendingLabel="删除中…"
                            confirmLabel="确认删除"
                            confirmMessage={`确认删除“${selected.title}”？存在下级节点或已授权给角色时无法删除。`}
                          >
                            删除
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {canWrite ? (
                  <MenuNodeForm
                    action={updateMenuAction}
                    type={selected.type}
                    node={selected}
                    parents={parentCandidates(nodes, selected.type, selected.id)}
                    defaultParentId={selected.parentId ?? undefined}
                    parentNode={byId.get(selected.parentId ?? "")}
                    submitLabel="保存设置"
                  />
                ) : (
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-muted-foreground">所属分组</dt><dd className="mt-1 font-medium">{byId.get(selected.parentId ?? "")?.title ?? "顶级菜单"}</dd></div>
                    <div><dt className="text-muted-foreground">访问限制</dt><dd className="mt-1 font-medium">{selected.permissionKey ? "需角色授权访问" : "登录即可访问"}</dd></div>
                    {selected.type === "page" ? <div><dt className="text-muted-foreground">页面路径</dt><dd className="mt-1 font-mono">{selected.href}</dd></div> : null}
                    {selected.type !== "action" ? <div><dt className="text-muted-foreground">侧栏显示</dt><dd className="mt-1 font-medium">{selected.isVisible ? "显示" : "隐藏"}</dd></div> : null}
                  </dl>
                )}
              </>
            ) : (
              <EmptyState
                icon={ListTree}
                title="请选择菜单节点"
                description="从左侧选择要查看或编辑的菜单分组或页面。"
              />
            )}
          </Card>

          {!createMode && selected && selected.type !== "action" ? (
            <PageActionsPanel
              parent={selected}
              actions={actionsOf(selected.id)}
              canWrite={canWrite}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PageActionsPanel({
  parent,
  actions,
  canWrite,
}: {
  parent: MenuNode;
  actions: MenuNode[];
  canWrite: boolean;
}) {
  const resource = resolveResourcePrefix(parent);
  const existingKeys = new Set(actions.map((item) => item.permissionKey));
  const missingStandardActions = STANDARD_ACTIONS.filter(
    (item) => !existingKeys.has(`${resource}:${item.verb}`),
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">「{parent.title}」页面内的操作按钮权限</h3>
            <Badge variant="secondary">{actions.length} 个按钮权限</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            控制进入「{parent.title}」后能否执行新增、编辑、删除等操作。添加后即可在「角色管理」中按岗位勾选。
          </p>
        </div>
        {canWrite ? (
          <GuardedDirectoryLink
            href={createHref("action", parent.id)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-input/80 bg-card px-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            自定义按钮权限
          </GuardedDirectoryLink>
        ) : null}
      </div>

      {canWrite && parent.type === "page" && missingStandardActions.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3.5 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
            一键添加常用操作：
          </span>
          {missingStandardActions.map((item, idx) => (
            <form key={item.verb} action={createMenuAction}>
              <input type="hidden" name="type" value="action" />
              <input type="hidden" name="parentId" value={parent.id} />
              <input type="hidden" name="returnTo" value={parent.id} />
              <input type="hidden" name="title" value={`${item.title}${parent.title}`} />
              <input type="hidden" name="permissionKey" value={`${resource}:${item.verb}`} />
              <input type="hidden" name="sortOrder" value={(actions.length + idx + 1) * 10} />
              <input type="hidden" name="isVisible" value="on" />
              <button
                type="submit"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden="true" className="size-3" />
                {item.title}
              </button>
            </form>
          ))}
        </div>
      ) : null}

      {actions.length === 0 ? (
        <div className="mt-4 rounded-lg bg-muted/35 px-4 py-6 text-center text-sm text-muted-foreground">
          当前页面还没有细分的操作按钮权限，所有能访问该页面的角色拥有相同权限。
          {canWrite && parent.type === "page" ? " 可点击上方「一键添加常用操作」快速生成。" : ""}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border/60 rounded-lg border border-border/70">
          {actions.map((action) => (
            <div key={action.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <KeyRound aria-hidden="true" className="size-4 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{action.title}</span>
                    {action.isSystem ? <Badge variant="outline">系统内置</Badge> : null}
                  </div>
                </div>
              </div>
              {canWrite ? (
                <div className="flex items-center gap-2">
                  <GuardedDirectoryLink
                    href={`/app/menus?selected=${encodeURIComponent(action.id)}#rbac-detail`}
                    className="inline-flex h-8 items-center rounded-md border border-border/80 bg-card px-2.5 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    编辑
                  </GuardedDirectoryLink>
                  {!action.isSystem ? (
                    <form action={deleteMenuAction}>
                      <input type="hidden" name="id" value={action.id} />
                      <input type="hidden" name="returnTo" value={parent.id} />
                      <ConfirmSubmitButton
                        size="sm"
                        variant="destructive"
                        pendingLabel="删除中…"
                        confirmLabel="确认删除"
                        confirmMessage={`确认删除操作权限“${action.title}”？若已分配给角色，请先在角色管理中取消勾选。`}
                      >
                        删除
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DetailHeading({ type, title, subtitle }: { type: MenuNodeType; title: string; subtitle: string }) {
  const Icon = TYPE_META[type].icon;
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <h2 className="break-words font-semibold">{title}</h2>
        <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function MenuNodeForm({
  action,
  type,
  node,
  parents,
  defaultParentId,
  parentNode,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  type: MenuNodeType;
  node?: MenuNode;
  parents: MenuNode[];
  defaultParentId?: string;
  parentNode?: MenuNode;
  submitLabel: string;
}) {
  const prefix = node ? `menu-${node.id}` : "menu-new";
  const locked = Boolean(node?.isSystem);
  const parentRequired = type === "action";
  const suggestedResource = resolveResourcePrefix(parentNode);
  const keyPlaceholder = type === "action" ? `${suggestedResource}:export` : "orders:read";
  const isPublicPage = Boolean(node && type === "page" && !node.permissionKey);

  return (
    <GuardedEditForm action={action} className={cn("space-y-5", !node && "mt-6")}>
      {node ? (
        <>
          <input type="hidden" name="id" value={node.id} />
          <input type="hidden" name="nodeType" value={type} />
        </>
      ) : (
        <input type="hidden" name="type" value={type} />
      )}
      {type === "action" && (node?.parentId || defaultParentId) ? (
        <input type="hidden" name="returnTo" value={node?.parentId ?? defaultParentId} />
      ) : null}
      {type === "action" ? (
        <input type="hidden" name="resourcePrefix" value={suggestedResource} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-title`}>
            {type === "directory" ? "分组名称" : type === "page" ? "页面名称" : "按钮/操作名称"}
          </Label>
          <Input
            id={`${prefix}-title`}
            name="title"
            defaultValue={node?.title}
            required
            maxLength={80}
            placeholder={
              type === "directory"
                ? "例如：业务管理"
                : type === "page"
                  ? "例如：订单管理"
                  : "例如：导出订单、审核通过"
            }
          />
        </div>

        {type !== "directory" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-parent`}>
              {type === "page" ? "所属菜单分组" : "所属页面"}
            </Label>
            <Select id={`${prefix}-parent`} name="parentId" defaultValue={defaultParentId ?? ""} disabled={locked} required={parentRequired}>
              {parentRequired ? null : <option value="">顶级（直接显示在侧栏顶层）</option>}
              {parents.map((item) => (
                <option key={item.id} value={item.id}>
                  {TYPE_META[item.type].label} · {item.title}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {type === "page" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-href`}>页面访问路径</Label>
            <Input
              id={`${prefix}-href`}
              name="href"
              defaultValue={node?.href}
              required
              disabled={locked}
              placeholder="/app/orders"
              pattern="/.*"
            />
            <p className="text-xs text-muted-foreground">对应代码中的路由地址（以 /app/ 开头），系统会自动为您生成配套权限标识。</p>
          </div>
        ) : null}

        {type === "page" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-access`}>访问权限要求</Label>
            <Select
              id={`${prefix}-access`}
              name="accessMode"
              defaultValue={isPublicPage ? "public" : "protected"}
              disabled={locked}
            >
              <option value="protected">需在「角色管理」中勾选授权后才能访问（推荐）</option>
              <option value="public">所有登录用户均可直接访问</option>
            </Select>
          </div>
        ) : null}

        {type !== "action" ? (
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-icon`}>菜单图标</Label>
            <Select id={`${prefix}-icon`} name="icon" defaultValue={node?.icon ?? (type === "directory" ? "Settings" : "LayoutDashboard")}>
              {MENU_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`${prefix}-sort`}>显示排序（数字越小越靠前）</Label>
          <Input id={`${prefix}-sort`} name="sortOrder" type="number" defaultValue={node?.sortOrder ?? 100} />
        </div>
      </div>

      {type !== "directory" ? (
        <details className="rounded-lg border border-border/70 bg-muted/25 px-4 py-2.5 text-xs">
          <summary className="cursor-pointer font-medium text-muted-foreground select-none hover:text-foreground">
            开发者高级选项（可选：自定义代码权限标识，留空将自动生成）
          </summary>
          <div className="mt-3 max-w-md space-y-1.5 pb-1">
            <Label htmlFor={`${prefix}-key`} className="text-xs">
              {type === "page" ? "页面权限标识（Permission Key）" : "操作权限标识（Permission Key）"}
            </Label>
            <Input
              id={`${prefix}-key`}
              name="permissionKey"
              defaultValue={node?.permissionKey ?? ""}
              disabled={locked}
              placeholder={
                type === "page"
                  ? "留空自动生成，如 /app/orders → orders:read"
                  : `留空自动生成，如需代码校验可填如 ${keyPlaceholder}`
              }
              pattern="[a-z][a-z0-9_]*:[a-z][a-z0-9_]*"
              className="h-9 font-mono text-xs"
            />
          </div>
        </details>
      ) : null}

      {locked ? (
        <>
          {/* Disabled inputs are not submitted; the server keeps the locked values. */}
          <input type="hidden" name="parentId" value={node?.parentId ?? ""} />
          <input type="hidden" name="href" value={node?.href ?? ""} />
          <input type="hidden" name="permissionKey" value={node?.permissionKey ?? ""} />
          <input type="hidden" name="accessMode" value={isPublicPage ? "public" : "protected"} />
        </>
      ) : null}

          {!node && type === "page" ? (
        <fieldset className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-4">
          <legend className="px-1 text-sm font-medium">同时生成该页面的常用操作按钮权限</legend>
          <p className="text-xs text-muted-foreground">
            勾选后将自动在该页面下创建对应的操作权限点，方便稍后在「角色管理」中直接为不同岗位分配新增、编辑、删除权限。
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {STANDARD_ACTIONS.map((item) => (
              <label key={item.verb} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  name="standardActions"
                  value={item.verb}
                  defaultChecked={DEFAULT_STANDARD_ACTION_VERBS.includes(item.verb)}
                />
                <span>{item.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
        {type !== "action" ? (
          <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm">
            <Switch name="isVisible" defaultChecked={node?.isVisible ?? true} />
            在左侧菜单栏中显示
          </label>
        ) : (
          <input type="hidden" name="isVisible" value="on" />
        )}
        <SubmitButton pendingLabel="保存中…">{submitLabel}</SubmitButton>
      </div>
    </GuardedEditForm>
  );
}
