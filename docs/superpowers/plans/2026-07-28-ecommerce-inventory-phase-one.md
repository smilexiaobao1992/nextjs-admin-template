# Ecommerce Inventory Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an independent `ecommerce-inventory` project from the admin template and deliver the phase-one inventory core: real dashboard, catalog with product images and bulk import, multi-warehouse stock ledger, bundle deduction, audit log, search, and pagination.

**Architecture:** Keep the template's single Next.js/PostgreSQL application and dynamic RBAC. Business routes stay thin, feature folders own queries/actions/UI, and focused `src/lib/<domain>` services own validation, upload, audit, and transactional inventory posting. `stock_movement` is the immutable ledger; `inventory_balance` is the locked query projection.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Better Auth, PostgreSQL 15+, Drizzle ORM, Vitest, Testing Library, ExcelJS, Supabase Storage.

**Reference spec:** `docs/superpowers/specs/2026-07-28-ecommerce-inventory-system-design.md`

---

## Scope and environment facts

- Execute only phase one from the approved spec. Platform transaction imports and alert/statistics formulas remain later plans.
- Source template: `/Users/xujunbao/WebstormProjects/claude/nextjs-admin-template`.
- New project: `/Users/xujunbao/WebstormProjects/claude/ecommerce-inventory`.
- The active local PostgreSQL service listens on `localhost:5432` with role `xujunbao`.
- The template `.env.local` points to an inactive `localhost:55432/admin_template`, and no `admin_template` database exists on the active service. Therefore reproduce the template database from committed migrations into a new `ecommerce_inventory` database instead of claiming to clone unavailable data.
- Use the verified `kailex/web` Supabase Storage boundary for product images, but use the isolated object prefix `ecommerce-inventory/products/`.

## File map

### Foundation and database

- `package.json`: new project identity and ExcelJS/Supabase dependencies.
- `.env.example`: local database and optional storage variables without secrets.
- `README.md`: inventory project setup and phase-one capabilities.
- `src/lib/db/schema.ts`: re-export new domain schemas with existing auth/RBAC schema.
- `src/lib/db/catalog-schema.ts`: categories, units, products, SKUs, bundle components, product import jobs/rows.
- `src/lib/db/warehouse-schema.ts`: warehouses and mandatory locations.
- `src/lib/db/inventory-schema.ts`: documents, lines, bundle snapshots, balances, movements.
- `src/lib/db/audit-schema.ts`: append-only audit events.
- `drizzle/0001_ecommerce_inventory_core.sql`: generated phase-one schema, permissions, menus, and default warehouse/location seed.
- `scripts/verify-rbac-database.ts`: updated seed counts and inventory constraints.
- `scripts/verify-inventory-database.ts`: inventory-specific database constraint verification.

### Shared list and audit boundaries

- `src/lib/pagination/params.ts`: page size, stable sort, and URL query parsing.
- `src/lib/pagination/params.test.ts`: limits and invalid query coverage.
- `src/components/ui/list-pagination.tsx`: reusable page navigation.
- `src/components/ui/search-toolbar.tsx`: URL-backed search/filter form.
- `src/lib/audit/write.ts`: append audit event within the caller's transaction.
- `src/features/audit/queries.ts`: cursor-paginated audit reads.
- `src/features/audit/components/audit-list.tsx`: read-only audit table.
- `src/app/app/audit/page.tsx`: protected operation log page.

### Catalog and product images

- `src/lib/catalog/validate.ts`: normalized product/SKU/BOM validation.
- `src/lib/catalog/validate.test.ts`: validation and no nested-bundle rules.
- `src/lib/catalog/manage.ts`: catalog transactions and audit calls.
- `src/features/catalog/queries.ts`: server-side search/filter/sort/page queries.
- `src/features/catalog/actions.ts`: permission-checked product/SKU/BOM actions.
- `src/features/catalog/components/product-list.tsx`: thumbnail list and controls.
- `src/features/catalog/components/product-form.tsx`: accessible grouped editor.
- `src/app/app/catalog/page.tsx`: catalog route.
- `src/lib/storage/product-images.ts`: storage configuration, path validation, upload/delete/URL resolution.
- `src/lib/storage/product-images.test.ts`: type/size/prefix and missing-config tests.
- `src/lib/uploads/image-upload-client.ts`: client upload/delete helper.
- `src/components/catalog/product-image-upload.tsx`: image preview and selection.
- `src/app/api/products/images/route.ts`: permission-checked upload and delete endpoint.

### Catalog import

- `src/lib/imports/catalog-template.ts`: exact column names and template generation.
- `src/lib/imports/catalog-parser.ts`: CSV/XLSX normalization and row validation.
- `src/lib/imports/catalog-parser.test.ts`: fixture-driven parser tests.
- `src/lib/imports/confirm-catalog-import.ts`: atomic confirm and audit.
- `src/features/imports/catalog-actions.ts`: upload/confirm actions.
- `src/features/imports/components/catalog-import-wizard.tsx`: upload, validate, review, confirm, result workflow.
- `src/app/app/catalog/import/page.tsx`: protected import page.

### Warehouse and inventory

- `src/lib/warehouses/manage.ts`: create/update/default warehouse rules and default location creation.
- `src/lib/warehouses/manage.test.ts`: pure validation/default behavior tests.
- `src/features/warehouses/queries.ts`: searchable paginated warehouse/location reads.
- `src/features/warehouses/actions.ts`: permission-checked actions.
- `src/features/warehouses/components/warehouse-list.tsx`: warehouse UI.
- `src/app/app/warehouses/page.tsx`: warehouse page.
- `src/lib/inventory/document-rules.ts`: document behavior matrix and signed effects.
- `src/lib/inventory/document-rules.test.ts`: each document type and bundle expansion tests.
- `src/lib/inventory/post-document.ts`: single-transaction posting and row locks.
- `src/lib/inventory/reverse-document.ts`: one-time mirrored reversal.
- `src/lib/inventory/errors.ts`: stable business error codes.
- `src/features/inventory/queries.ts`: balances, documents, and cursor-paginated movements.
- `src/features/inventory/actions.ts`: create/post/reverse actions.
- `src/features/inventory/components/stock-list.tsx`: stock list with server filters.
- `src/features/inventory/components/document-form.tsx`: draft document editor.
- `src/features/inventory/components/document-list.tsx`: documents and status actions.
- `src/app/app/inventory/page.tsx`: current stock page.
- `src/app/app/inventory/documents/page.tsx`: stock document list.
- `src/app/app/inventory/documents/new/page.tsx`: document creation.
- `src/app/app/inventory/movements/page.tsx`: cursor-paginated ledger.

### Dashboard and final verification

- `src/features/dashboard/queries.ts`: parallel real aggregate queries.
- `src/features/dashboard/components/inventory-dashboard.tsx`: metric cards, warehouse quantities by unit, recent movement/audit tables.
- `src/features/dashboard/queries.test.ts`: query result presentation helpers.
- `src/app/app/page.tsx`: replace template welcome content with inventory dashboard.
- `src/components/layout/menu-icons.tsx`: icons for new seeded menus.
- `src/components/layout/app-shell.test.tsx`: menu and dashboard navigation regression coverage.
- `docs/ui-guidelines.md`: inventory list/form/dashboard interaction conventions.

---

### Task 1: Create the independent project and local database

**Files:**
- Create: `/Users/xujunbao/WebstormProjects/claude/ecommerce-inventory/**`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Verify both source and target before copying**

Run:

```bash
git -C /Users/xujunbao/WebstormProjects/claude/nextjs-admin-template status --short
test ! -e /Users/xujunbao/WebstormProjects/claude/ecommerce-inventory
```

Expected: template worktree is clean and target does not exist.

- [ ] **Step 2: Copy only tracked template files and initialize an independent repository**

Use `git archive HEAD` so `.git`, `.env.local`, `node_modules`, `.next`, Playwright traces, and other local artifacts are excluded. Extract into `ecommerce-inventory`, run `git init`, and confirm `git status --short` lists only the copied baseline.

- [ ] **Step 3: Update project identity and environment documentation**

Set package name to `ecommerce-inventory`. Keep the existing engines and scripts. Add these optional storage keys to `.env.example` without values:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=inventory-images
```

Document that the service role is server-only.

- [ ] **Step 4: Install the two justified dependencies**

Run:

```bash
npm install exceljs @supabase/supabase-js
```

Expected: `package.json` and `package-lock.json` update; no other new runtime dependency is added directly. ExcelJS covers both CSV and XLSX parsing, and Supabase JS replaces custom object-storage HTTP code.

- [ ] **Step 5: Create an independent local database**

Run read-only existence checks first. If `ecommerce_inventory` is absent, create it with role `xujunbao`. Create `.env.local` by copying the template values without printing secrets, then replace only database host/port/name with `localhost:5432/ecommerce_inventory`, generate a new Better Auth secret, and set `BETTER_AUTH_URL=http://localhost:3000`.

Run:

```bash
npm run db:migrate
npm run db:verify
```

Expected: the new database contains the template auth/RBAC schema and seed data. Do not modify any existing database.

- [ ] **Step 6: Commit the independent baseline**

```bash
git add .
git commit -m "chore: initialize ecommerce inventory project"
```

### Task 2: Add the phase-one schema, permissions, and seed data

**Files:**
- Create: `src/lib/db/catalog-schema.ts`
- Create: `src/lib/db/warehouse-schema.ts`
- Create: `src/lib/db/inventory-schema.ts`
- Create: `src/lib/db/audit-schema.ts`
- Modify: `src/lib/db/schema.ts`
- Create: `drizzle/0001_ecommerce_inventory_core.sql`
- Modify: `scripts/verify-rbac-database.ts`
- Create: `scripts/verify-inventory-database.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the schema constraint verification first**

Add a `db:verify:inventory` script and verification cases for unique SKU code, positive BOM quantity, no duplicate components, one default warehouse, required location, non-negative balance, unique reversal, and seeded permissions/menus/default warehouse.

- [ ] **Step 2: Run the verification and confirm it fails**

Run: `npm run db:verify:inventory`

Expected: FAIL because phase-one tables do not exist.

- [ ] **Step 3: Define focused domain tables and enums**

Use `numeric(18, 4)` for quantities. Include database checks for positive document-line quantities, nonzero adjustment quantities, valid image-path length, unique `(sku_id, warehouse_id, location_id)` balances, and unique `reversal_of_document_id` where non-null.

Export each domain table through `src/lib/db/schema.ts` so Better Auth and current imports remain unchanged.

- [ ] **Step 4: Generate and inspect the migration**

Run:

```bash
npm run db:generate -- --name ecommerce_inventory_core
```

Expected: `drizzle/0001_ecommerce_inventory_core.sql` plus updated journal/snapshot. Inspect the SQL before applying. Append idempotent seed inserts for phase-one permission keys, nested menus, `MAIN` default warehouse, and its `DEFAULT` location.

- [ ] **Step 5: Migrate and verify**

Run:

```bash
npm run db:migrate
npm run db:verify
npm run db:verify:inventory
```

Expected: all database checks pass.

- [ ] **Step 6: Commit the schema**

```bash
git add src/lib/db package.json scripts drizzle
git commit -m "feat: add inventory core schema"
```

### Task 3: Add audit writing and read-only operation logs

**Files:**
- Create: `src/lib/audit/write.ts`
- Create: `src/lib/audit/write.test.ts`
- Create: `src/features/audit/queries.ts`
- Create: `src/features/audit/components/audit-list.tsx`
- Create: `src/app/app/audit/page.tsx`

- [ ] **Step 1: Write failing audit sanitization tests**

Cover removal of `password`, `token`, `secret`, and connection URL values from nested before/after payloads while preserving business fields.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test -- src/lib/audit/write.test.ts`

Expected: FAIL because the audit writer does not exist.

- [ ] **Step 3: Implement the transaction-aware audit interface**

Expose one API that accepts the current Drizzle transaction so an audit event cannot commit separately from its business write:

```ts
export type AuditInput = {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  result?: "success" | "failure";
};

export async function writeAuditEvent(tx: DbTransaction, input: AuditInput): Promise<void>;
```

- [ ] **Step 4: Add cursor-paginated queries and protected UI**

Order only by `(created_at, id)` ascending or descending. Search/filter by actor, entity type, action, result, and time range. Require `audit:read`; do not expose update/delete actions.

- [ ] **Step 5: Run tests and commit**

Run: `npm run test -- src/lib/audit/write.test.ts`

Expected: PASS.

```bash
git add src/lib/audit src/features/audit src/app/app/audit
git commit -m "feat: add operation audit log"
```

### Task 4: Add shared server-side search and pagination

**Files:**
- Create: `src/lib/pagination/params.ts`
- Create: `src/lib/pagination/params.test.ts`
- Create: `src/components/ui/list-pagination.tsx`
- Create: `src/components/ui/search-toolbar.tsx`

- [ ] **Step 1: Write failing parameter tests**

Cover default page 1, default size 20, allowed sizes 20/50/100, maximum 100, invalid sort fallback, stable ID tiebreaker, preserved URL filters, and opaque cursor validation.

- [ ] **Step 2: Run and confirm failure**

Run: `npm run test -- src/lib/pagination/params.test.ts`

Expected: FAIL because shared pagination does not exist.

- [ ] **Step 3: Implement minimal helpers and accessible controls**

Keep URL query state server-readable. Pagination controls must preserve current search/filter/sort values and expose disabled previous/next states.

- [ ] **Step 4: Run tests and commit**

```bash
npm run test -- src/lib/pagination/params.test.ts
git add src/lib/pagination src/components/ui/list-pagination.tsx src/components/ui/search-toolbar.tsx
git commit -m "feat: add reusable list pagination"
```

### Task 5: Build catalog management and product images

**Files:**
- Create/modify all catalog and product-image files listed in the file map.
- Modify: `next.config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write failing catalog and storage tests**

Cover normalized codes, duplicate component rejection, nested-bundle rejection, positive component quantities, JPG/PNG/WebP validation, 2MB limit, storage-prefix delete guard, path-to-public-URL resolution, and missing-storage configuration.

- [ ] **Step 2: Run focused tests and confirm failure**

Run:

```bash
npm run test -- src/lib/catalog/validate.test.ts src/lib/storage/product-images.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement catalog transactions**

Create/update/disable products, SKUs, and bundle components inside transactions. Recheck uniqueness and nested-bundle rules server-side. Write audit events in the same transaction. Never delete historical catalog rows referenced by inventory documents.

- [ ] **Step 4: Implement image storage by adapting the proven boundary**

Port the small server-storage, client-upload, and preview pattern from `kailex/web`, replacing its permission middleware with `requirePermission("catalog:write")`. Store only paths under `ecommerce-inventory/products/`. Upload new image first, save the product, delete the new image on save failure, and delete the old image only after a successful replacement.

- [ ] **Step 5: Implement the catalog list and form**

Add URL-backed server search over product name, product code, SKU, and barcode. Use page sizes 20/50/100, stable sort, thumbnail/empty image treatment, field-local validation, pending buttons, and page-level success state.

- [ ] **Step 6: Run tests, static checks, and commit**

```bash
npm run test -- src/lib/catalog/validate.test.ts src/lib/storage/product-images.test.ts
npm run lint
npm run typecheck
git add src/lib/catalog src/lib/storage src/lib/uploads src/features/catalog src/components/catalog src/app/app/catalog src/app/api/products next.config.ts .env.example
git commit -m "feat: add catalog and product images"
```

### Task 6: Add CSV/XLSX catalog import

**Files:**
- Create/modify all catalog-import files listed in the file map.

- [ ] **Step 1: Create fixtures and failing parser tests**

Use in-memory CSV/XLSX buffers for valid rows, duplicate SKU, missing name/code/unit, conflicting barcode, excessive row count, extra unknown columns, and a mixed valid/error file.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm run test -- src/lib/imports/catalog-parser.test.ts`

Expected: FAIL because parser/template modules do not exist.

- [ ] **Step 3: Implement one normalized row model**

Exact phase-one template columns:

```ts
type CatalogImportRow = {
  productCode: string;
  productName: string;
  categoryName?: string;
  brand?: string;
  skuCode: string;
  skuName: string;
  barcode?: string;
  unit: string;
  isBundle: boolean;
};
```

Do not import image files or external image URLs from the workbook; images are uploaded through the authenticated product editor.

- [ ] **Step 4: Implement staged, atomic confirmation**

Parsing writes import job/row state only. Confirmation must reject unresolved included rows and create the selected valid products/SKUs in one transaction with one batch audit event. Re-confirming a completed job returns the existing result.

- [ ] **Step 5: Build the five-step wizard and verify**

Use “上传 → 校验 → 修正/排除 → 确认 → 结果”, visible row/error counts, downloadable template/error report, and duplicate-submit protection.

- [ ] **Step 6: Run tests and commit**

```bash
npm run test -- src/lib/imports/catalog-parser.test.ts
npm run lint
npm run typecheck
git add src/lib/imports src/features/imports src/app/app/catalog/import
git commit -m "feat: add catalog bulk import"
```

### Task 7: Add warehouse and mandatory default-location management

**Files:**
- Create/modify all warehouse files listed in the file map.

- [ ] **Step 1: Write failing warehouse rule tests**

Cover normalized warehouse/location codes, automatic `DEFAULT` location, one active default warehouse, default reassignment, and rejection of disabling the final active default.

- [ ] **Step 2: Run and confirm failure**

Run: `npm run test -- src/lib/warehouses/manage.test.ts`

- [ ] **Step 3: Implement transactional warehouse management and audit**

Lock warehouse rows while changing defaults. Create `DEFAULT` location in the same transaction as a warehouse. Never delete a location referenced by balances or movements.

- [ ] **Step 4: Build searchable paginated warehouse UI**

Show default/status labels, location count, single main action, accessible dialogs/forms, and server-side page/search/status filters.

- [ ] **Step 5: Verify and commit**

```bash
npm run test -- src/lib/warehouses/manage.test.ts
npm run lint
npm run typecheck
git add src/lib/warehouses src/features/warehouses src/app/app/warehouses
git commit -m "feat: add warehouse management"
```

### Task 8: Implement the immutable inventory ledger

**Files:**
- Create/modify all inventory rule/posting/reversal files listed in the file map.

- [ ] **Step 1: Write failing document-rule tests**

Cover every matrix row from spec section 7.1, signed effects, required source/target locations, no same-location transfer, no negative count, bundle allowed only on outbound, bundle component aggregation, and insufficient component details.

- [ ] **Step 2: Run and confirm failure**

Run: `npm run test -- src/lib/inventory/document-rules.test.ts`

- [ ] **Step 3: Implement pure effect planning**

Return deterministic, base-SKU effects sorted by `(skuId, warehouseId, locationId)`:

```ts
type StockEffect = {
  skuId: string;
  warehouseId: string;
  locationId: string;
  quantityDelta: string;
  sourceLineId: string;
};

export function planStockEffects(input: DocumentDraft, bundles: BundleSnapshot[]): StockEffect[];
```

- [ ] **Step 4: Implement transactional posting**

Inside one database transaction: lock document, reject non-draft state, expand bundle snapshot, lock/create balances in deterministic order, reject resulting negative balances, insert immutable movements with balance-after, update balances, mark posted, and append audit event.

- [ ] **Step 5: Implement one-time reversal**

Lock original document, reject non-posted/reversal documents, insert one posted reversal with exact negated original movements, update balances, set original to reversed, and write audit in one transaction. Enforce unique `reversal_of_document_id` in PostgreSQL.

- [ ] **Step 6: Add database-backed verification cases**

Extend `scripts/verify-inventory-database.ts` with commit-and-rollback-safe cases for insufficient stock, transfer conservation, duplicate reversal, and balance equals movement sum.

- [ ] **Step 7: Verify and commit**

```bash
npm run test -- src/lib/inventory/document-rules.test.ts
npm run db:verify:inventory
npm run lint
npm run typecheck
git add src/lib/inventory scripts/verify-inventory-database.ts
git commit -m "feat: add transactional inventory ledger"
```

### Task 9: Build inventory pages with search and pagination

**Files:**
- Create/modify all inventory feature and route files listed in the file map.

- [ ] **Step 1: Add query presentation tests**

Cover stable stock/document page ordering, page-size limit, movement cursor encoding/decoding, permission-derived actions, and business error messages.

- [ ] **Step 2: Implement server-side queries**

Stock filters: keyword, warehouse, location, active status, in-stock status. Document filters: keyword, type, status, warehouse, business date. Movement filters: SKU, warehouse, document, direction, time range; only time ascending/descending cursor sort.

- [ ] **Step 3: Implement document workflows**

Use a grouped draft form with default warehouse/location, line add/remove, bundle preview, affected-stock preview, field errors, duplicate-submit protection, and an explicit posting confirmation listing affected SKUs/locations/quantities.

- [ ] **Step 4: Implement list/detail traceability**

Make balance rows link to filtered movements and movement rows link to source document. Posted/reversed documents are read-only. Only permitted users see post/reverse controls; server actions always recheck permissions.

- [ ] **Step 5: Verify and commit**

```bash
npm run test -- src/features/inventory
npm run lint
npm run typecheck
git add src/features/inventory src/app/app/inventory
git commit -m "feat: add inventory operations UI"
```

### Task 10: Replace the welcome page with the real inventory dashboard

**Files:**
- Create: `src/features/dashboard/queries.ts`
- Create: `src/features/dashboard/queries.test.ts`
- Create: `src/features/dashboard/components/inventory-dashboard.tsx`
- Modify: `src/app/app/page.tsx`
- Modify: `src/components/layout/menu-icons.tsx`
- Modify: `src/components/layout/app-shell.test.tsx`

- [ ] **Step 1: Write failing dashboard presentation tests**

Cover empty state, product/SKU/bundle counts, stocked SKU count, quantity groups by unit without cross-unit addition, warehouse count, draft count, recent movement/audit rows, and forbidden notice.

- [ ] **Step 2: Run and confirm failure**

Run: `npm run test -- src/features/dashboard/queries.test.ts src/components/layout/app-shell.test.tsx`

- [ ] **Step 3: Implement parallel bounded queries**

Run independent aggregate queries in parallel. Limit recent movement and audit queries to 8 rows. Group quantity by unit in SQL and never render one mixed-unit total.

- [ ] **Step 4: Implement the calm action-oriented dashboard**

Use restrained metric cards, meaningful empty states, one primary “新建入库单” action, links from cards to pre-filtered lists, and no fake chart data. Preserve the existing forbidden notice.

- [ ] **Step 5: Verify and commit**

```bash
npm run test -- src/features/dashboard/queries.test.ts src/components/layout/app-shell.test.tsx
npm run lint
npm run typecheck
git add src/features/dashboard src/app/app/page.tsx src/components/layout
git commit -m "feat: add inventory dashboard"
```

### Task 11: Complete full verification and real browser acceptance

**Files:**
- Modify only files required by defects found during verification.
- Modify: `README.md`
- Modify: `docs/ui-guidelines.md`

- [ ] **Step 1: Run database verification from a clean database**

Create a temporary verification database with an explicit narrow name, apply migrations, run both verification scripts, then drop only that verified temporary database.

- [ ] **Step 2: Run the complete quality gate**

```bash
npm run check
npm run build
```

Expected: lint, typecheck, all Vitest files, and production build pass.

- [ ] **Step 3: Start the app and exercise the real phase-one path**

Create a local admin without passing its password on the command line. Verify in browser: login → dashboard → product create/image upload → catalog import → warehouse create → inbound post → bundle outbound → insufficient stock rejection → transfer → stocktake → reversal → audit log.

- [ ] **Step 4: Verify list and responsive behavior**

For catalog, warehouses, stock, documents, movements, and audit: verify search, filters, stable pagination, empty/error states, keyboard focus, and mobile viewing. Confirm no page loads the complete history into the browser.

- [ ] **Step 5: Inspect key query plans**

Use representative catalog, stock, document, movement, and audit queries with `EXPLAIN`. Record any intentional small-table sequential scan; fix missing indexes or N+1 patterns before completion.

- [ ] **Step 6: Update documentation and commit fixes**

Document local setup, storage configuration, image limits, import template, document status model, and verification commands.

```bash
git add .
git commit -m "docs: complete inventory phase one setup"
```

- [ ] **Step 7: Confirm template isolation**

Verify the new repository contains all business work and `/Users/xujunbao/WebstormProjects/claude/nextjs-admin-template` has no uncommitted business changes. Remove the inventory spec/plan from the template working tree in a separate cleanup commit only after confirming both documents exist in the new project.

