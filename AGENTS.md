<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Architecture & Coding Rules (`nextjs-admin-template`)

## 1. Directory & Layering Conventions
- **Thin Routes (`src/app/app/**/page.tsx`)**: Route files only perform permission checks (`requirePermission`), parse `searchParams`, fetch data in parallel (`Promise.all`), and compose feature components.
- **Thick Features (`src/features/<domain>/`)**: Put domain queries (`queries.ts`), Server Actions (`actions.ts`), notice dictionaries (`messages.ts`), and domain UI components (`components/`) here.
- **Shared UI (`src/components/ui/` & `src/components/layout/`)**: Pure, reusable UI primitives (`Button`, `Input`, `Textarea`, `Select`, `Badge`, `Switch`, `Checkbox`, `Tabs`, `DropdownMenu`, `Dialog`, `Table`, `StatusNotice`, `ConfirmSubmitButton`, `GuardedEditForm`) and layout shells (`AppShell`, `PageHeader`).
- **Core Infrastructure (`src/lib/`)**: Auth & session (`src/lib/auth/`), RBAC engine (`src/lib/rbac/`), Server Action pipeline (`src/lib/actions/`), audit log (`src/lib/audit/`), pagination (`src/lib/list/`), and Drizzle schema (`src/lib/db/schema.ts`).

## 2. Dynamic Database Menu & Permission Tree (CRITICAL)
- **Never hardcode sidebar menus or permissions in code.** All navigation and permission nodes live in the PostgreSQL `menu` table (`directory` / `page` / `action` node types) and `role_menu` grant table.
- **Server-side authorization is mandatory**: Every protected page and Server Action must enforce permissions via `requirePermission("resource:verb")` (or `defineAction({ permission: "resource:verb", ... })`).
- **Conditional UI rendering**: Use `await can(session, "resource:verb")` from `@/lib/auth/session` to hide/disable buttons for unauthorized users. Hiding UI is never a substitute for server-side `requirePermission`.

## 3. Server Actions, Validation & Atomic Audit Logging
- **Use `defineAction` (`@/lib/actions/define-action`) + `field` (`@/lib/actions/form`)** for all new feature Server Actions.
- **Atomic Transactions**: Every protected write operation MUST commit its business mutation and `writeAuditLog(await audit({ ... }), tx)` inside the SAME `db.transaction(async (tx) => { ... })`.
- **No Console Pollution**: Do not leave `console.log`, `console.warn`, or `console.error` in `src/` production code.
- **Notice Feedback**: Redirects append `?notice=<code>` via `withNotice`. Render feedback on the page using `<StatusNotice notice={params.notice} messages={...} />`.

## 4. UI & Dual-Theme Styling
- Use `<PageHeader eyebrow="…" title="…" description="…" actions={…} />` at the top of every `/app/*` page.
- Use theme-aware shadow utilities (`shadow-card`, `shadow-card-raised`, `shadow-soft`) defined in `src/app/globals.css` instead of hardcoded `shadow-[...]` values so both **Graphite** and **Indigo** themes render accurately.
- Follow `docs/ui-guidelines.md`: tabular numbers (`tabular-nums`) for counts/dates/IDs, explicit `aria-label` on icon buttons, `aria-hidden="true"` on decorative icons, and `<SubmitButton>` for form submissions.

## 5. Scaffolding & Quality Gate Commands
- Scaffold a new CRUD feature module: `npm run scaffold:feature -- <kebab-name>`
- Database migrations: edit `src/lib/db/schema.ts` → `npm run db:generate` → `npm run db:migrate`
- Before finishing any task, verify:
  - `npm run check` (runs ESLint with `--max-warnings=0`, TypeScript `--noEmit`, and Vitest unit tests)
  - `npm run build`
