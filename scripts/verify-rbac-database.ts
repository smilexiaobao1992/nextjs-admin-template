import postgres from "postgres";

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DIRECT_DATABASE_URL or DATABASE_URL is required");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectSqlState(label: string, code: string, operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === code) {
      return;
    }
    throw error;
  }

  throw new Error(`${label}: expected PostgreSQL error ${code}`);
}

async function main() {
  const [counts] = await sql<[{ roles: number; permissions: number; menus: number; admin_bindings: number }]>`
    select
      (select count(*)::int from role) as roles,
      (select count(*)::int from permission) as permissions,
      (select count(*)::int from menu) as menus,
      (
        select count(*)::int
        from role_permission rp
        join role r on r.id = rp.role_id
        where r.key = 'admin'
      ) as admin_bindings
  `;
  assert(counts.roles === 2, `expected 2 seeded roles, received ${counts.roles}`);
  assert(counts.permissions === 9, `expected 9 seeded permissions, received ${counts.permissions}`);
  assert(counts.menus === 6, `expected 6 seeded menus, received ${counts.menus}`);
  assert(counts.admin_bindings === 0, `expected admin shortcut without stored bindings, received ${counts.admin_bindings}`);

  await expectSqlState("single default role", "23505", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into role (id, key, name, is_default)
        values ('verify_second_default', 'verify-second-default', 'Verify default', true)
      `;
    }),
  );

  await expectSqlState("referenced role delete", "23503", () =>
    sql.begin(async (tx) => {
      await tx`insert into role (id, key, name) values ('verify_role', 'verify-role', 'Verify role')`;
      await tx`
        insert into "user" (id, name, email, role)
        values ('verify_user', 'Verify user', 'verify-user@example.invalid', 'verify-role')
      `;
      await tx`delete from role where id = 'verify_role'`;
    }),
  );

  await expectSqlState("role-bound permission delete", "23503", () =>
    sql.begin(async (tx) => {
      await tx`insert into permission (id, key, name) values ('verify_permission', 'verify:read', 'Verify permission')`;
      await tx`
        insert into role_permission (role_id, permission_id)
        values ('role_member', 'verify_permission')
      `;
      await tx`delete from permission where id = 'verify_permission'`;
    }),
  );

  await expectSqlState("menu-bound permission delete", "23503", () =>
    sql.begin(async (tx) => {
      await tx`insert into permission (id, key, name) values ('verify_permission', 'verify:read', 'Verify permission')`;
      await tx`
        insert into menu (id, title, href, permission_id)
        values ('verify_menu', 'Verify menu', '/app/verify', 'verify_permission')
      `;
      await tx`delete from permission where id = 'verify_permission'`;
    }),
  );

  await expectSqlState("orphan menu parent", "23503", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into menu (id, parent_id, title, href)
        values ('verify_orphan', 'missing_parent', 'Verify orphan', '/app/verify')
      `;
    }),
  );

  process.stdout.write("RBAC database constraints and seed data verified.\n");
}

main().finally(async () => {
  await sql.end();
});
