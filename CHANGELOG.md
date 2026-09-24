# Changelog

Notable changes to this template are documented here. This project follows semantic versioning after release tags are introduced.

## Unreleased

### Security

- Prevent delegated role managers from granting permissions outside their own scope.
- Prevent delegated user managers from modifying system-role and administrator accounts.
- Require `dashboard:view` and hide dashboard data without its underlying read permission.
- Commit protected mutations and audit records atomically.
- Require an HTTPS `BETTER_AUTH_URL` for non-local production origins.

### Changed

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
