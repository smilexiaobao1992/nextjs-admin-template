# Admin template dual-theme design

## Objective

Extend the reusable admin template from one visual direction to two user-selectable directions without duplicating routes, business pages, RBAC logic, or component implementations. Keep **Graphite Workspace** as the default and add **Indigo Cloud** as the alternate theme.

The two themes must remain suitable for real administration products, work across desktop and mobile navigation, preserve the existing system dark-mode behavior, and remember the selected theme in the current browser.

## Approved visual directions

### Graphite Workspace (default)

- Deep graphite navigation against a warm off-white workspace.
- Controlled coral for the active navigation state and primary actions.
- Connected sidebar and workspace geometry.
- Confident, operational character suited to inventory, commerce, and internal tools.

### Indigo Cloud (alternate)

- Light, floating navigation panel against a cool blue-gray workspace.
- Indigo for active navigation, focus, and primary actions.
- Inset shell geometry with clearer panel separation.
- Airier SaaS character suited to collaboration and general-purpose administration.

Both directions retain Geist, the existing radius scale, minimum 40px interaction targets, reduced-motion support, and semantic status colors.

## Implementation approaches considered

### 1. Shared components plus scoped design tokens (selected)

Apply a theme identifier to the existing admin shell, override shared color tokens and a small set of shell geometry classes, and keep all routes and business components shared.

- Advantages: smallest implementation boundary, no page drift, easy to test, and new business pages automatically support both themes.
- Trade-off: the themes can vary in shell geometry and visual language, but cannot have unrelated information architecture without adding explicit component variants.

### 2. Duplicate app shells and page wrappers

Render separate Graphite and Indigo layout component trees.

- Advantages: maximum visual freedom.
- Rejected because duplicated navigation, responsive, accessibility, and future page work would drift and double maintenance cost.

### 3. Store preference in the database

Add a theme column to the user profile and synchronize the selection across devices.

- Advantages: account-level persistence.
- Rejected for this phase because it requires schema, migration, write authorization, and API changes for a visual preference. Browser-level persistence satisfies the current template requirement without expanding the data model.

## Architecture

### Theme contract

Create a small theme contract with exactly two supported values:

- `graphite`
- `indigo`

Unknown, empty, or outdated values resolve to `graphite`. The parser is shared by the server layout and client switcher so an invalid cookie cannot create an unsupported state.

### Persistence and initial render

Use a first-party cookie named `admin-theme-style` with `Path=/`, `SameSite=Lax`, and a one-year lifetime.

The protected app layout already performs request-time session and permission work. It reads the cookie there and passes a validated `initialTheme` into `AppShell`. The shell renders the matching `data-admin-theme` attribute on its outer boundary, so the correct theme is present in the first protected-page render without local-storage hydration flicker.

Changing the theme updates shell state immediately and writes the same cookie. No database request, route refresh, or new API endpoint is required. Login and other public pages remain on the template's default visual treatment in this phase.

### Styling boundary

Keep the current Tailwind v4 theme tokens as the Graphite defaults. Add scoped Indigo overrides below `[data-admin-theme="indigo"]` for:

- canvas, card, popover, primary, secondary, muted, accent, border, input, and ring colors;
- sidebar foreground, background, muted, accent, border, and focus colors;
- shell background, desktop sidebar frame, header, and main workspace geometry.

Introduce only a few stable semantic shell classes where theme-dependent geometry is needed. Ordinary buttons, cards, inputs, tables, dialogs, and business pages continue consuming the same existing color utilities. This makes them theme-aware automatically through tokens.

Dark mode keeps using `prefers-color-scheme`. Each theme provides an explicit dark token set so Indigo does not accidentally inherit Graphite sidebar colors.

## Components

### Theme switcher

Add a compact theme button to the user header. It opens the existing system-style `Dialog`, avoiding a new popover or menu dependency.

The dialog presents two selectable preview cards:

- theme name and concise description;
- representative sidebar, canvas, and accent swatches;
- visible selected state and check mark;
- keyboard-operable buttons with `aria-pressed`.

Selection applies immediately and closes the dialog. The trigger has an accessible label and remains available on desktop and mobile.

### App shell

`AppShell` owns the active theme state because it owns the visual shell boundary. It passes the current value and change callback to `UserHeader`. Authentication, menu data, collapsed state, and mobile drawer behavior remain unchanged.

### Sidebar and header

The existing sidebar keeps one semantic navigation tree. Theme-specific differences are limited to tokens and shell classes:

- Graphite remains a connected dark sidebar.
- Indigo uses a light inset panel on desktop and a normal full-height drawer on mobile.

No theme-specific menu records, permissions, or routes are introduced.

## Data flow

1. A protected request reaches the app layout.
2. The server reads and validates `admin-theme-style` while it obtains the current session, menus, and role label.
3. `AppShell` renders with the validated initial value on `data-admin-theme`.
4. Shared Tailwind utilities resolve through the scoped theme tokens.
5. The user opens the header theme dialog and selects a theme.
6. `AppShell` updates immediately; the switcher writes the cookie for subsequent requests.

## Error handling

- Missing or invalid cookie values fall back to Graphite.
- Cookie writing is best-effort; the active in-memory theme still changes for the current page if persistence is unavailable.
- The switcher does not perform network requests, so it does not need loading, retry, or failure toast states.
- Theme selection never changes authentication or permission state.

## Responsive and accessibility behavior

- Both themes retain the existing mobile dialog navigation.
- Indigo inset spacing is desktop-only so it does not reduce usable width on phones.
- The switcher uses the existing accessible dialog primitive, visible labels, keyboard-operable selection buttons, `aria-pressed`, and clear focus-visible rings.
- Color contrast and focus states are verified in both light and dark system modes.
- Motion remains limited to short opacity and transform transitions and respects reduced motion.

## Testing and verification

- Unit-test theme parsing and Graphite fallback behavior.
- Component-test opening the selector, choosing Indigo, updating the shell attribute, and writing the persistence cookie.
- Preserve existing sidebar expansion, mobile navigation, and logout tests.
- Run lint, TypeScript checking, the complete Vitest suite, and the Node 24 production build.
- Manually verify Graphite and Indigo on the dashboard and one data-heavy RBAC page at desktop and mobile widths.

## Non-goals

- No duplicated business pages or route trees.
- No database migration or cross-device preference synchronization.
- No user-defined colors, arbitrary theme builder, or third theme.
- No new UI, animation, or theme dependency.
- No changes to RBAC, authentication, database access, or menu behavior.

## Acceptance criteria

- Graphite remains the default when no valid preference exists.
- A signed-in user can switch between Graphite and Indigo from the header.
- The selected theme persists across reloads in the same browser.
- Sidebar, header, canvas, cards, controls, dialogs, and tables visibly follow the selected theme.
- Both themes support current desktop, collapsed-sidebar, mobile-drawer, light, and dark behavior.
- One shared component and route implementation serves both themes.
- Existing tests, new theme tests, and the Node 24 production build pass.
