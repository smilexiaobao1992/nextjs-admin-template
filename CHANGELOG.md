# Changelog

Notable changes to this template are documented here. This project follows semantic versioning after release tags are introduced.

## Unreleased

### Added

- **Dynamic Menu Standard Actions**: Batch creation of standard CRUD action permission nodes (`view`, `create`, `update`, `delete`, `export`) directly when creating a page node in the Menu Management UI, eliminating manual entry while preserving dynamic database-backed permissions.
- **Zod & defineAction Pipeline**: Introduced `defineAction` pipeline with schema-driven validation, form data parsing (`formDataToObject`, `parseFormData`), permission enforcement via `can()`, atomic audit logging, search notice parameter redirects (`withNotice`), and Next.js 16 `unstable_rethrow` redirect safety.
- **Production CRUD Scaffolder**: Rewrote `scripts/scaffold-feature.ts` into a complete code generator producing schemas, paginated queries, search filters, dialog modal forms, delete confirmations, typed Server Actions, and Vitest test suites.
- **One-Command Environment Setup**: Added `npm run setup` to automatically generate cryptographic secrets, boot Docker PostgreSQL, apply migrations, and verify health.
- **Idempotent Demo Data Seeder**: Added `npm run db:seed` to provision structured development accounts (admin, manager, staff) and sample audit trails with production safeguards.
- **Unified PageHeader & Theme Shadow Tokens**: Introduced reusable `PageHeader` component and `@utility shadow-card`, `@utility shadow-card-raised`, `@utility shadow-soft` across both Graphite and Indigo themes.
- **Error & Loading Boundaries**: Added App-level skeleton loading (`loading.tsx`), interactive error fallback with retry digest (`error.tsx`), and root fallback (`global-error.tsx`).


### Security

- Prevent delegated role managers from granting permissions outside their own scope.
- Prevent delegated user managers from modifying system-role and administrator accounts.
- Require `dashboard:view` and hide dashboard data without its underlying read permission.
- Commit protected mutations and audit records atomically.
- Require an HTTPS `BETTER_AUTH_URL` for non-local production origins.

### Changed

- Update documentation and README to reflect current architecture, removing outdated GSAP references in favor of HTML5 Canvas dot-wave animation, and document scaffolding workflows.
- Align CI `BETTER_AUTH_URL` configuration with application port 3002.
- Configure `typecheck` script to avoid restricted incremental tsbuildinfo writes in sandbox and CI environments.

- Merge permissions into the menu tree (directory / page / action nodes) and grant roles through a single checkbox tree; drop the separate permission page. Existing permissions and grants are migrated.
- Redesign the login page as a calm split layout with a theme-aware dot-wave canvas that follows the selected theme; remove GSAP.
- Upgrade Next.js to 16.3.6 for critical security advisories and add security response headers.
- Render server-side dates in Asia/Shanghai and revoke other sessions after a password change.
- Upgrade Next.js to 16.3.0 and React to 19.2.8.
- Pin Better Auth to 1.6.23 pending its schema-changing upgrade path.
- Reduce dashboard query fan-out and cap each application database pool at five connections.
- Bind Docker Compose PostgreSQL to loopback and add CI security verification.
- Support multiple roles per user with unioned permissions and protected role references.
- Move role, account status, password, and session operations into a user management dialog.
- Redesign the login page with the graphite and terracotta palette and reduced-motion-aware GSAP animation.
