CREATE TABLE "role_menu" (
	"role_id" text NOT NULL,
	"menu_id" text NOT NULL,
	CONSTRAINT "role_menu_role_id_menu_id_pk" PRIMARY KEY("role_id","menu_id")
);
--> statement-breakpoint
ALTER TABLE "menu" ALTER COLUMN "href" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "type" text DEFAULT 'page' NOT NULL;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "permission_key" text;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_menu" ADD CONSTRAINT "role_menu_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_menu" ADD CONSTRAINT "role_menu_menu_id_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_menu_menu_id_idx" ON "role_menu" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "menu_parent_id_idx" ON "menu" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_permission_key_idx" ON "menu" USING btree ("permission_key") WHERE "menu"."permission_key" is not null;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_type_check" CHECK ("menu"."type" in ('directory', 'page', 'action'));--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_permission_key_by_type_check" CHECK (("menu"."type" = 'directory' and "menu"."permission_key" is null)
        or ("menu"."type" = 'action' and "menu"."permission_key" is not null)
        or "menu"."type" = 'page');--> statement-breakpoint
UPDATE "menu" AS m SET "permission_key" = p."key" FROM "permission" AS p WHERE m."permission_id" = p."id";--> statement-breakpoint
UPDATE "menu" SET "type" = 'directory', "permission_key" = NULL WHERE "href" = '';--> statement-breakpoint
UPDATE "menu" SET "is_system" = true
WHERE "id" IN ('menu_dashboard', 'menu_settings', 'menu_users', 'menu_roles', 'menu_menus', 'menu_audit');--> statement-breakpoint
DELETE FROM "menu" WHERE "id" = 'menu_permissions';--> statement-breakpoint
UPDATE "menu" SET "title" = '菜单与权限' WHERE "id" = 'menu_menus' AND "title" = '菜单';--> statement-breakpoint
INSERT INTO "menu" ("id", "parent_id", "type", "title", "href", "sort_order", "permission_key", "is_visible", "is_system")
SELECT v."id", v."parent_id", 'action', p."name", '', 10, p."key", true, true
FROM (VALUES
  ('menu_users_write', 'menu_users', 'users:write'),
  ('menu_roles_write', 'menu_roles', 'roles:write'),
  ('menu_menus_write', 'menu_menus', 'menus:write')
) AS v("id", "parent_id", "key")
JOIN "permission" AS p ON p."key" = v."key"
WHERE EXISTS (SELECT 1 FROM "menu" WHERE "id" = v."parent_id")
  AND NOT EXISTS (SELECT 1 FROM "menu" WHERE "permission_key" = v."key");--> statement-breakpoint
INSERT INTO "menu" ("id", "parent_id", "type", "title", "href", "icon", "sort_order", "is_visible", "is_system")
SELECT 'menu_unassigned', NULL, 'directory', '未归类权限', '', 'KeyRound', 900, false, false
WHERE EXISTS (
  SELECT 1 FROM "permission" AS p
  WHERE p."key" NOT IN ('permissions:read', 'permissions:write')
    AND NOT EXISTS (SELECT 1 FROM "menu" AS m WHERE m."permission_key" = p."key")
    AND NOT EXISTS (
      SELECT 1 FROM "menu" AS m
      WHERE m."type" = 'page' AND split_part(m."permission_key", ':', 1) = split_part(p."key", ':', 1)
    )
);--> statement-breakpoint
INSERT INTO "menu" ("id", "parent_id", "type", "title", "href", "sort_order", "permission_key", "is_visible", "is_system")
SELECT
  'menu_perm_' || p."id",
  COALESCE(
    (
      SELECT m."id" FROM "menu" AS m
      WHERE m."type" = 'page' AND split_part(m."permission_key", ':', 1) = split_part(p."key", ':', 1)
      ORDER BY m."sort_order", m."id"
      LIMIT 1
    ),
    'menu_unassigned'
  ),
  'action', p."name", '', 100, p."key", true, p."is_system"
FROM "permission" AS p
WHERE p."key" NOT IN ('permissions:read', 'permissions:write')
  AND NOT EXISTS (SELECT 1 FROM "menu" AS m WHERE m."permission_key" = p."key");--> statement-breakpoint
INSERT INTO "role_menu" ("role_id", "menu_id")
SELECT DISTINCT rp."role_id", m."id"
FROM "role_permission" AS rp
JOIN "role" AS r ON r."id" = rp."role_id"
JOIN "permission" AS p ON p."id" = rp."permission_id"
JOIN "menu" AS m ON m."permission_key" = CASE p."key"
  WHEN 'permissions:read' THEN 'menus:read'
  WHEN 'permissions:write' THEN 'menus:write'
  ELSE p."key"
END
WHERE r."key" <> 'admin'
ON CONFLICT DO NOTHING;
