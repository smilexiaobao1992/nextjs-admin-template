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
  const seededNodes = await sql<{ id: string; type: string; permission_key: string | null; is_system: boolean }[]>`
    select id, type, permission_key, is_system from menu where is_system = true order by id
  `;
  const expectedNodes: Record<string, [string, string | null]> = {
    menu_dashboard: ["page", "dashboard:view"],
    menu_settings: ["directory", null],
    menu_users: ["page", "users:read"],
    menu_users_write: ["action", "users:write"],
    menu_roles: ["page", "roles:read"],
    menu_roles_write: ["action", "roles:write"],
    menu_menus: ["page", "menus:read"],
    menu_menus_write: ["action", "menus:write"],
    menu_audit: ["page", "audit:read"],
  };
  for (const [id, [type, permissionKey]] of Object.entries(expectedNodes)) {
    const node = seededNodes.find((item) => item.id === id);
    assert(node, `expected seeded menu node ${id}`);
    assert(node.type === type && node.permission_key === permissionKey, `unexpected seeded menu node ${id}`);
  }

  const [counts] = await sql<[{ roles: number; admin_bindings: number; legacy_tables: number }]>`
    select
      (select count(*)::int from role where id in ('role_admin', 'role_member')) as roles,
      (
        select count(*)::int
        from role_menu rm
        join role r on r.id = rm.role_id
        where r.key = 'admin'
      ) as admin_bindings,
      (
        select count(*)::int
        from information_schema.tables
        where table_schema = 'public' and table_name in ('permission', 'role_permission')
      ) as legacy_tables
  `;
  assert(counts.roles === 2, `expected 2 seeded roles, received ${counts.roles}`);
  assert(counts.admin_bindings === 0, `expected admin shortcut without stored bindings, received ${counts.admin_bindings}`);
  assert(counts.legacy_tables === 0, "expected legacy permission tables to be dropped");

  const auditTable = await sql<{ exists: boolean }[]>`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = 'audit_log'
    ) as exists
  `;
  assert(auditTable[0]?.exists, "expected audit_log table to exist");

  await expectSqlState("single default role", "23505", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into role (id, key, name, is_default)
        values ('verify_second_default', 'verify-second-default', 'Verify default', true)
      `;
    }),
  );

  await expectSqlState("invalid multi-role format", "23514", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into "user" (id, name, email, role)
        values ('verify_user', 'Verify user', 'verify-user@example.invalid', 'member,')
      `;
    }),
  );

  await expectSqlState("unknown role reference", "23503", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into "user" (id, name, email, role)
        values ('verify_user', 'Verify user', 'verify-user@example.invalid', 'member,verify-missing-role')
      `;
    }),
  );

  await expectSqlState("assigned role delete", "23503", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into role (id, key, name)
        values ('verify_role', 'verify-role', 'Verify role')
      `;
      await tx`
        insert into "user" (id, name, email, role)
        values ('verify_user', 'Verify user', 'verify-user@example.invalid', 'verify-role')
      `;
      await tx`delete from role where id = 'verify_role'`;
    }),
  );

  await expectSqlState("granted menu node delete", "23503", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into menu (id, parent_id, type, title, permission_key)
        values ('verify_menu', 'menu_users', 'action', 'Verify action', 'verify:run')
      `;
      await tx`insert into role_menu (role_id, menu_id) values ('role_member', 'verify_menu')`;
      await tx`delete from menu where id = 'verify_menu'`;
    }),
  );

  await expectSqlState("duplicate permission key", "23505", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into menu (id, parent_id, type, title, permission_key)
        values ('verify_menu', 'menu_users', 'action', 'Verify action', 'users:write')
      `;
    }),
  );

  await expectSqlState("action without permission key", "23514", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into menu (id, parent_id, type, title)
        values ('verify_menu', 'menu_users', 'action', 'Verify action')
      `;
    }),
  );

  await expectSqlState("directory with permission key", "23514", () =>
    sql.begin(async (tx) => {
      await tx`
        insert into menu (id, type, title, permission_key)
        values ('verify_menu', 'directory', 'Verify directory', 'verify:read')
      `;
    }),
  );

  await expectSqlState("unknown menu node type", "23514", () =>
    sql.begin(async (tx) => {
      await tx`insert into menu (id, type, title) values ('verify_menu', 'button', 'Verify node')`;
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
