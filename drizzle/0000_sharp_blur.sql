CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text,
	"title" text NOT NULL,
	"href" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"permission_id" text,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permission_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "role_permission_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'member' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_parent_id_menu_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permission"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permission"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_role_key_fk" FOREIGN KEY ("role") REFERENCES "public"."role"("key") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "menu_sort_order_idx" ON "menu" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "menu_permission_id_idx" ON "menu" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_single_default_idx" ON "role" USING btree ("is_default") WHERE "role"."is_default" = true;--> statement-breakpoint
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
INSERT INTO "permission" ("id", "key", "name", "description", "is_system") VALUES
	('perm_dashboard_view', 'dashboard:view', '查看概览', '访问后台概览页', true),
	('perm_users_read', 'users:read', '查看用户', '查看用户列表', true),
	('perm_users_write', 'users:write', '管理用户', '创建用户并调整角色', true),
	('perm_roles_read', 'roles:read', '查看角色', '查看角色与授权', true),
	('perm_roles_write', 'roles:write', '管理角色', '创建与编辑角色及权限绑定', true),
	('perm_permissions_read', 'permissions:read', '查看权限', '查看权限目录', true),
	('perm_permissions_write', 'permissions:write', '管理权限', '创建与编辑权限点', true),
	('perm_menus_read', 'menus:read', '查看菜单', '查看导航菜单配置', true),
	('perm_menus_write', 'menus:write', '管理菜单', '创建与编辑导航菜单', true);--> statement-breakpoint
INSERT INTO "role" ("id", "key", "name", "description", "is_system", "is_default") VALUES
	('role_admin', 'admin', '管理员', '系统超级角色，拥有全部权限', true, false),
	('role_member', 'member', '普通成员', '默认角色，仅可访问概览', false, true);--> statement-breakpoint
INSERT INTO "role_permission" ("role_id", "permission_id") VALUES
	('role_member', 'perm_dashboard_view');--> statement-breakpoint
INSERT INTO "menu" ("id", "parent_id", "title", "href", "icon", "sort_order", "permission_id", "is_visible") VALUES
	('menu_dashboard', NULL, '概览', '/app', 'LayoutDashboard', 10, 'perm_dashboard_view', true),
	('menu_settings', NULL, '系统设置', '', 'Settings', 20, NULL, true),
	('menu_users', 'menu_settings', '用户', '/app/users', 'Users', 21, 'perm_users_read', true),
	('menu_roles', 'menu_settings', '角色', '/app/roles', 'Shield', 22, 'perm_roles_read', true),
	('menu_permissions', 'menu_settings', '权限', '/app/permissions', 'KeyRound', 23, 'perm_permissions_read', true),
	('menu_menus', 'menu_settings', '菜单', '/app/menus', 'PanelLeft', 24, 'perm_menus_read', true);
