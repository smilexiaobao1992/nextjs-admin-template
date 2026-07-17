# Admin Template visual refresh design

## Objective

Refresh the reusable admin shell so it feels current and product-led while preserving its existing Next.js, Tailwind, authentication, dynamic menu, and RBAC architecture. Fix the sidebar group interaction so a menu group without its own route opens and closes from the entire row, not only the chevron.

## Approved direction

The approved direction is **Graphite workspace**.

- Atmosphere: precise, confident, warm.
- App shell: deep graphite sidebar against a warm off-white workspace.
- Accent: controlled coral, reserved for primary actions, selected navigation, focus, and important status.
- Density: compact enough for an operations product, with stronger hierarchy and more deliberate spacing than the current neutral template.
- CSS strategy: existing Tailwind v4 utilities and theme tokens only. No new styling library or runtime dependency.

## Visual thesis

The shell should create depth through clear surface steps, not decorative gradients or heavy borders. Navigation should feel anchored and branded; content should remain calm and readable. One recognizable signature, the graphite-and-coral navigation system, gives the open-source template identity without making business pages difficult to customize.

## Content and interaction thesis

Each page should orient the user, show current state, and expose the next action without unnecessary decoration. Interactive rows should communicate their full hit area. Motion is limited to short, interruptible transform and opacity transitions, and respects reduced-motion preferences.

## Interaction changes

### Sidebar groups

- A group with children and no parent route is one semantic `button` spanning the full row.
- Clicking its icon, title, empty row space, or chevron toggles the group.
- The button exposes `aria-expanded` and a useful accessible name.
- A group with a real parent route keeps navigation and expansion as distinct controls, avoiding an ambiguous click outcome.
- The collapsed rail continues to navigate to the first available destination.
- The chevron rotates only to communicate direction.

### Global controls

- Interactive targets remain at least 40 by 40 pixels.
- Buttons and navigation items use a subtle press scale.
- Focus-visible states remain obvious against both graphite and light surfaces.

## Visual system

### Color roles

- Canvas: warm off-white, around `oklch(0.965 0.008 80)`.
- Card: near-white warm surface, around `oklch(0.99 0.004 80)`.
- Sidebar: graphite, around `oklch(0.22 0.008 70)`.
- Primary/coral: around `oklch(0.65 0.17 38)`.
- Foreground: warm near-black, around `oklch(0.22 0.01 70)`.
- Muted text and borders inherit a low-chroma warm tint.
- Semantic destructive, success, and warning roles remain distinct from the coral brand accent.

Dark mode remains supported. It uses luminance steps on a graphite canvas and a slightly brighter coral accent rather than dark drop shadows.

### Radius scale

- Small controls: 6px.
- Inputs and navigation rows: 8px.
- Panels: 12px.
- Large layout surfaces: 16px.
- Avatars and compact status chips may be circular or pill-shaped when their meaning benefits from it.

### Depth

- Sidebar and canvas are separated primarily by color.
- Content panels use one restrained, layered shadow rather than a border plus generic shadow.
- Dividers remain hairline separators where content structure needs them.
- Not every section becomes a card; page structure should remain visible without a grid of identical boxes.

### Typography

- Keep the existing Geist UI typeface to avoid a network-loaded font and preserve build reliability.
- Increase contrast through weight, tracking, and scale rather than adding a second display family.
- Page titles use tight negative tracking; labels and body text stay compact and legible.
- Numeric and key-like content remains tabular or monospaced where appropriate.

## Component scope

This refresh updates the smallest shared boundaries that create a coherent result:

1. Theme tokens and global background/foreground behavior.
2. Desktop and mobile app shell, including sidebar, header, brand block, collapse control, and navigation states.
3. Shared buttons, cards, inputs, select controls, badges, and table surfaces where existing primitives expose the old visual language.
4. High-visibility RBAC directory pages, especially roles, menus, and permissions, to ensure their split layouts follow the new hierarchy.

Business logic, authorization rules, database schema, route structure, and dynamic menu data are unchanged.

## Responsive behavior

- Desktop retains the collapsible rail and content workspace.
- Mobile keeps a drawer-style sidebar with 40px minimum targets and no hover-dependent behavior.
- Split directory/detail pages collapse to a readable single-column flow without horizontal overflow.

## Accessibility and verification

- Add a regression test that clicks the `系统设置` row by its accessible name and verifies expansion/collapse.
- Preserve semantic navigation and buttons, keyboard focus, `aria-current`, and `aria-expanded`.
- Run focused component tests, the complete check suite, and the production build.
- Manually verify the real local pages at port 3100 without touching the existing project on port 3000.

## Non-goals

- No new component framework, font package, animation library, or design dependency.
- No RBAC behavior, schema, or seed changes.
- No dashboard feature additions or speculative configuration system.
- No complete page-by-page rewrite when shared tokens and primitives provide the same result.

## Acceptance criteria

- Clicking anywhere on the `系统设置` group row toggles its children.
- The sidebar has an unmistakable graphite surface and clear selected states.
- Coral is controlled and does not replace semantic status colors.
- Main content, cards, inputs, and directory layouts have visible surface hierarchy in both light and dark modes.
- Roles, menus, and permissions remain easy to scan and edit.
- Existing tests pass, the new interaction is covered, and the production build succeeds.
