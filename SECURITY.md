# Security Policy

## Supported versions

Only the latest commit on `main` of this template is supported. Forks should treat security updates as their own responsibility after they diverge.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email the maintainer at the address associated with the GitHub account [smilexiaobao1992](https://github.com/smilexiaobao1992), or open a private security advisory on the repository if that feature is available.

Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- Affected commit SHA or release tag when possible

You should receive an acknowledgement within 7 days. Please allow reasonable time for a fix before any public disclosure.

## Security baseline in this template

- Public sign-up is disabled by default
- Authentication is handled only by Better Auth’s official catch-all route
- Application authorization uses dynamic RBAC (`role` / `permission` / `menu` tables); Server Actions call `requirePermission`
- The built-in `admin` role is a superuser; the last remaining `admin` user cannot be demoted
- Delegated managers cannot grant permissions they do not hold or manage system roles and admin accounts
- Session cookie cache is disabled so role demotion and session revocation take effect immediately
- Auth rate limiting uses the database (safe for multi-instance Vercel deploys)
- Credential passwords must be at least 12 characters and include letters and digits
- Sensitive writes and their immutable audit rows commit in the same database transaction
- Banning a user revokes all of their sessions; the last unbanned admin cannot be demoted or banned
- `GET /api/health` only reports process and database availability (no secrets)

## Deployment checklist

1. Generate a unique `BETTER_AUTH_SECRET` with at least 32 random bytes (`openssl rand -base64 32`). Never reuse the example value.
2. Set `BETTER_AUTH_URL` to the real HTTPS origin in production; startup rejects a missing or public HTTP origin.
3. Use a least-privilege PostgreSQL role for `DATABASE_URL`. Keep `DIRECT_DATABASE_URL` for migrations only.
4. Do not run `db:push` as a production deploy step. Review and apply versioned migrations instead.
5. Run `npm audit --omit=dev --audit-level=high` and `npm run db:verify:security` before deployment.
6. Review Better Auth release notes and schema changes before upgrades; validate real login, sessions, and Admin plugin behavior after migrating.

`drizzle-kit` is pinned and its development-only `esbuild` tree is narrowly overridden to a patched version because its legacy loader still declares an older range. CI exercises migrations; remove the override when upstream adopts a patched compatible range.
