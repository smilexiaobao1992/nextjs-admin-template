# Admin Template Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sidebar groups clickable across their full row and refresh the reusable admin shell with the approved graphite, warm-canvas, and coral visual system.

**Architecture:** Preserve the existing Next.js App Router, dynamic RBAC menu data, and Tailwind v4 component structure. Fix the interaction inside `NavGroup`, then propagate the approved visual language through existing theme tokens and shared primitives before applying only page-specific layout classes that shared components cannot cover.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

---

## File map

- `src/components/layout/app-shell.test.tsx`: regression coverage for row-wide sidebar group toggling.
- `src/components/layout/app-sidebar.tsx`: semantic group button and graphite navigation visuals.
- `src/components/layout/app-shell.tsx`: canvas spacing, shell separation, desktop rail transition.
- `src/components/layout/user-header.tsx`: warm workspace header and user identity treatment.
- `src/app/globals.css`: approved OKLCH tokens for light and dark modes.
- `src/components/ui/button.tsx`: coral primary actions and consistent control depth.
- `src/components/ui/card.tsx`: panel elevation without generic borders.
- `src/components/ui/input.tsx`: warm input surface and focused state.
- `src/components/ui/select.tsx`: select surface aligned with inputs.
- `src/components/ui/table.tsx`: quieter table separators and intentional row hover.
- `src/app/app/roles/page.tsx`: graphite/coral directory selection and coherent panels.
- `src/app/app/menus/page.tsx`: coherent menu tree and edit surface.
- `src/app/app/permissions/page.tsx`: coherent permission directory and edit surface.
- `docs/ui-guidelines.md`: durable visual vocabulary and usage rules.

### Task 1: Make the full sidebar group row interactive

**Files:**
- Modify: `src/components/layout/app-shell.test.tsx`
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1: Replace the arrow-only regression with a row-name regression**

In the nested-menu test, click the group by its accessible name and assert that the same row changes state:

```tsx
const settingsToggle = screen.getByRole("button", { name: "系统设置" });
expect(settingsToggle).toHaveAttribute("aria-expanded", "true");

fireEvent.click(settingsToggle);
expect(settingsToggle).toHaveAttribute("aria-expanded", "false");
expect(screen.queryByRole("link", { name: "用户" })).not.toBeInTheDocument();

fireEvent.click(settingsToggle);
expect(settingsToggle).toHaveAttribute("aria-expanded", "true");
expect(screen.getByRole("link", { name: "用户" })).toHaveAttribute("href", "/app/users");
```

Add a separate render of `AppSidebar` or a shell state fixture with `collapsed` enabled and assert that the route-less `系统设置` group is still a link to its first child:

```tsx
expect(screen.getByRole("link", { name: "系统设置" })).toHaveAttribute("href", "/app/users");
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test -- src/components/layout/app-shell.test.tsx`

Expected: FAIL because the current full row is not a button named `系统设置`; only the chevron button has an expanded/collapsed action label.

- [ ] **Step 3: Implement one row-wide button for route-less groups**

Keep the existing `if (collapsed)` early return unchanged so a route-less group in the collapsed rail still links to `children[0].href`. Only after that branch, extract the expanded-rail state change into `toggleExpanded`. For `item.href === ""`, render one full-width semantic button:

```tsx
const toggleExpanded = () => {
  if (expanded) {
    setOpen(false);
    setClosedOnPath(pathname);
  } else {
    setOpen(true);
    setClosedOnPath(null);
  }
};

<button
  type="button"
  onClick={toggleExpanded}
  aria-expanded={expanded}
  className={cn(
    "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium",
    "transition-[background-color,color,transform] active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    groupActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
  )}
>
  <MenuIcon name={item.icon} className="size-4 shrink-0" />
  <span className="min-w-0 flex-1 truncate">{item.title}</span>
  <ChevronDown
    aria-hidden="true"
    className={cn("size-4 transition-transform", expanded ? "rotate-0" : "-rotate-90")}
  />
</button>
```

Keep a parent link and a separate 40px chevron button only when `item.href` is non-empty, because navigation and expansion remain distinct actions in that case.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm run test -- src/components/layout/app-shell.test.tsx`

Expected: the existing shell tests and the new expanded-row and collapsed-destination assertions pass.

- [ ] **Step 5: Commit the interaction fix**

```bash
git add src/components/layout/app-shell.test.tsx src/components/layout/app-sidebar.tsx
git commit -m "fix: make sidebar groups fully clickable"
```

### Task 2: Apply the approved visual system at shared boundaries

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/user-header.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/table.tsx`

- [ ] **Step 1: Replace neutral theme tokens with named graphite-workspace roles**

Keep existing semantic tokens and add sidebar-specific roles in `@theme`:

```css
--color-background: oklch(0.965 0.008 80);
--color-foreground: oklch(0.22 0.01 70);
--color-card: oklch(0.99 0.004 80);
--color-card-foreground: oklch(0.22 0.01 70);
--color-primary: oklch(0.65 0.17 38);
--color-primary-foreground: oklch(0.985 0.006 70);
--color-secondary: oklch(0.925 0.012 75);
--color-secondary-foreground: oklch(0.29 0.015 70);
--color-muted: oklch(0.925 0.01 75);
--color-muted-foreground: oklch(0.5 0.014 70);
--color-accent: oklch(0.91 0.024 50);
--color-accent-foreground: oklch(0.31 0.035 38);
--color-border: oklch(0.865 0.012 75);
--color-input: oklch(0.82 0.014 75);
--color-ring: oklch(0.65 0.17 38);
--color-sidebar: oklch(0.22 0.008 70);
--color-sidebar-foreground: oklch(0.92 0.008 75);
--color-sidebar-muted: oklch(0.68 0.01 75);
--color-sidebar-accent: oklch(0.3 0.014 65);
--color-sidebar-accent-foreground: oklch(0.96 0.006 75);
--color-sidebar-ring: oklch(0.72 0.14 38);
```

Add equivalent dark tokens with a near-black graphite canvas, stepped card luminance, and a brighter coral primary. Keep destructive red separate from primary coral. Preserve the existing radius scale and reduced-motion behavior.

- [ ] **Step 2: Refresh the shell and navigation classes**

Use `bg-sidebar text-sidebar-foreground` for the sidebar root, coral for the brand mark and selected destination, and graphite-accent for open groups. Keep the desktop rail width behavior and mobile dialog architecture. Use only explicit transition properties.

Set the content canvas to warm background, make the header a near-opaque card surface with a subtle shadow, and make the collapse control a graphite/coral-aware elevated control that stays visible at the sidebar edge.

- [ ] **Step 3: Align shared primitives**

Apply the following component rules without changing component APIs:

```tsx
// Button base
"... rounded-lg font-medium transition-[color,background-color,box-shadow,transform] active:scale-95 ..."

// Default button
"bg-primary text-primary-foreground shadow-[0_6px_16px_color-mix(in_oklch,var(--color-primary)_24%,transparent)] hover:bg-primary/90"

// Card
"rounded-xl bg-card text-card-foreground shadow-[0_1px_2px_rgba(45,35,25,0.06),0_10px_28px_rgba(45,35,25,0.09)]"

// Input and select
"rounded-lg border border-input/80 bg-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(45,35,25,0.05)]"
```

Do not add `transition: all`, glass blur, gradients, or a new dependency.

- [ ] **Step 4: Run static verification**

Run: `npm run lint`

Expected: PASS with zero warnings.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit shared visual foundations**

```bash
git add src/app/globals.css src/components/layout/app-sidebar.tsx src/components/layout/app-shell.tsx src/components/layout/user-header.tsx src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/input.tsx src/components/ui/select.tsx src/components/ui/table.tsx
git commit -m "feat: refresh admin shell visual system"
```

### Task 3: Calibrate the RBAC directory pages

**Files:**
- Modify: `src/app/app/roles/page.tsx`
- Modify: `src/app/app/menus/page.tsx`
- Modify: `src/app/app/permissions/page.tsx`
- Modify: `docs/ui-guidelines.md`

- [ ] **Step 1: Replace repeated old panel treatments**

On roles, menus, and permissions pages:

- Keep the existing left-directory/right-detail information architecture.
- Replace `rounded-xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.10)]` with the shared warm, layered panel treatment.
- Use coral only for the selected directory item and primary save/create actions.
- Use warm secondary surfaces for group headers, read-only notices, and empty states.
- Keep destructive buttons red.
- Preserve all form names, actions, query parameters, IDs, permission logic, and server-side guards.
- Keep selection labels readable with `text-primary-foreground/75` where needed.

- [ ] **Step 2: Improve hierarchy without adding components**

Use a compact eyebrow and stronger title block, give the directory header slightly more breathing room, and distinguish nested menu entries through indentation and a quiet connector/icon rather than duplicate card containers. Keep every directory link at least 40px high.

- [ ] **Step 3: Update the durable UI rules**

Replace the old neutral-only guidance in `docs/ui-guidelines.md` with:

```md
- Shell: graphite sidebar, warm workspace, coral primary accent.
- Primary coral is reserved for selected navigation and main actions.
- Semantic destructive/success/warning colors keep their own roles.
- Panels use background steps and one layered shadow; avoid border-plus-shadow boxes everywhere.
- Route-less menu groups expose one full-row toggle button.
- All interactive targets are at least 40px and have visible keyboard focus.
```

- [ ] **Step 4: Run the complete verification suite**

Run: `npm run check`

Expected: lint, typecheck, and all Vitest files pass.

Run: `npm run build`

Expected: Next.js production build succeeds and all current routes are listed.

- [ ] **Step 5: Commit page calibration and documentation**

```bash
git add src/app/app/roles/page.tsx src/app/app/menus/page.tsx src/app/app/permissions/page.tsx docs/ui-guidelines.md
git commit -m "feat: modernize RBAC management surfaces"
```

### Task 4: Verify the real local experience

**Files:**
- No source files expected unless verification exposes a defect.

- [ ] **Step 1: Confirm the existing app process and port separation**

Run: `ps -ef | rg "next dev|next-server"`

Expected: this template uses port 3100 and the existing `kailex/web` process remains on port 3000.

- [ ] **Step 2: Start or retain the template on port 3100**

Run only if needed: `npm run dev -- --port 3100`

Expected: the template serves `http://localhost:3100` without binding port 3000.

- [ ] **Step 3: Manually verify affected routes**

Check `/app`, `/app/roles`, `/app/menus`, and `/app/permissions` at desktop width and one mobile width. Confirm:

- The `系统设置` group toggles from the title/icon/row, not only the chevron.
- The desktop collapse control remains visible in expanded and collapsed states.
- The active route remains clear in the graphite sidebar.
- Directory and detail panels remain readable in light and dark system themes.
- No horizontal overflow appears on mobile.

- [ ] **Step 4: Re-run focused verification if visual fixes were needed**

Run: `npm run check`

Expected: PASS.

Run: `npm run build`

Expected: PASS.
