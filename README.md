# Next.js Admin Template

一个可直接复制的开源管理后台基础模板，保留认证、权限、数据库迁移、响应式后台壳和工程质量门槛，不附带虚假的业务模块。

默认界面为**简体中文**（`lang="zh-CN"`）。需要多语言时，在业务层自行接入 i18n。

## 技术栈

- Next.js 16.2、React 19、TypeScript、Tailwind CSS 4
- Better Auth 1.6，邮箱密码登录与 Admin 插件
- Drizzle ORM、PostgreSQL，适配 Supabase 与 Vercel
- Vitest、Testing Library、ESLint、GitHub Actions

## 已实现的安全边界

- 公开注册默认关闭，只保留 Better Auth 官方 `/api/auth/[...all]` handler。
- `/app` 在服务端校验会话；业务页与 Server Action 使用动态权限（`requirePermission`）。
- 角色 / 权限 / 菜单可在后台管理；`admin` 为系统超管，`member` 为默认可配置角色。
- 未登录访问受保护路径会跳到 `/login?next=…`，登录后回到安全的本地路径。
- Better Auth Admin 插件只保留只读用户列表权限；写操作走带事务保护的 Server Action。
- 会话 cookie cache 关闭，角色降权和会话撤销直接读取数据库状态。
- 认证端点使用数据库限速，适用于 Vercel 多实例。
- 创建账号统一要求至少 12 位密码，并同时包含字母和数字。
- `BETTER_AUTH_SECRET` 至少 32 字节；数据库事务保证至少保留一个 `admin`。

更多说明见 [SECURITY.md](SECURITY.md)。

## 环境要求

- Node.js 20.19 或更高版本，推荐 Node.js 22
- npm 10
- PostgreSQL 15 或更高版本，或 Supabase 项目

## 本地启动

```bash
git clone git@github.com:smilexiaobao1992/nextjs-admin-template.git
cd nextjs-admin-template
npm ci
cp .env.example .env.local
```

编辑 `.env.local`：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/admin_template
DIRECT_DATABASE_URL=postgresql://postgres:password@localhost:5432/admin_template
BETTER_AUTH_SECRET=change-me
BETTER_AUTH_URL=http://localhost:3000
```

先运行 `openssl rand -base64 32`，用输出替换 `change-me`；占位值会被启动校验明确拒绝。

然后执行：

```bash
npm run db:migrate
npm run admin:create
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。`admin:create` 会在交互式终端中读取密码，不接受命令行密码参数。

## Supabase 与 Vercel

1. 在 Supabase 创建项目，用 owner 直连地址设置 `DIRECT_DATABASE_URL`，然后运行 `npm run db:migrate`。
2. 在 Supabase SQL Editor 中创建运行时角色。先替换示例密码，再执行：

```sql
create role app_user login password 'REPLACE_WITH_A_RANDOM_PASSWORD';
grant connect on database postgres to app_user;
grant usage on schema public to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;
grant usage, select on all sequences in schema public to app_user;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to app_user;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to app_user;
```

3. Vercel 的 `DATABASE_URL` 使用这个角色对应的 Supavisor transaction pooler 地址，端口通常为 `6543`。从 Supabase 控制台复制完整连接串，避免遗漏项目 ref。
4. `DIRECT_DATABASE_URL` 继续使用 owner 连接，只用于迁移，不放进客户端代码，也不用于应用查询。
5. 在 Vercel 配置 `DATABASE_URL`、随机生成的 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`。正式环境的 `BETTER_AUTH_URL` 必须是实际 HTTPS 域名。
6. 如果独立前端需要跨域调用认证，再添加逗号分隔的 `BETTER_AUTH_TRUSTED_ORIGINS`。

不要在生产部署启动阶段自动执行 `db:push`。生产 schema 变更应先生成迁移、审查 SQL，再运行 `db:migrate`。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run check` | lint、类型检查和测试 |
| `npm run build` | 生产构建 |
| `npm run db:generate` | 根据 schema 生成迁移 |
| `npm run db:migrate` | 执行已提交迁移 |
| `npm run db:verify` | 验证种子数据和关键数据库约束 |
| `npm run db:studio` | 打开 Drizzle Studio |
| `npm run admin:create` | 交互式创建管理员 |

## 路由

| 路由 | 权限 |
| --- | --- |
| `/login` | 公开（已登录会跳转到安全的 `next` 或 `/app`） |
| `/app` | 已登录用户（菜单按角色权限过滤） |
| `/app/users` | `users:read` / 写操作用 `users:write` |
| `/app/roles` | `roles:read` / `roles:write` |
| `/app/permissions` | `permissions:read` / `permissions:write` |
| `/app/menus` | `menus:read` / `menus:write` |
| `/api/auth/[...all]` | Better Auth handler |

## 目录结构与业务扩展

模板约定：**路由薄、feature 厚、ui 纯、auth/db 全局共享**。

```text
src/
  app/                         # Next.js 路由与页面组装（尽量薄）
    login/
    app/                       # 受保护壳下的页面
      page.tsx
      users/page.tsx           # 组装 features/users，不写业务细节
    api/auth/[...all]/
  features/                    # 业务域（复制后主要加这里）
    users/
    rbac/                      # 角色 / 权限 / 菜单 Server Actions
  components/
    ui/
    layout/                    # AppShell 接收服务端过滤后的 menus
  lib/
    auth/                      # 会话、requirePermission
    rbac/                      # 权限解析、校验、CRUD
    db/                        # schema 含 role / permission / menu
    utils.ts
  proxy.ts                     # 仅转发 pathname（Next.js 16 Proxy）
```

扩展建议：

1. **新业务权限**：在「权限管理」新增 `orders:read` 等 key；在「角色管理」勾选；在页面/Action 调用 `requirePermission("orders:read")`。
2. **新业务页**：`src/features/<domain>/` + `src/app/app/<route>/page.tsx`；在「菜单管理」加侧栏入口并绑定权限。
3. **新表**：改 `src/lib/db/schema.ts` → `npm run db:generate` → 审查 SQL → `db:migrate`。
4. **不要**只靠隐藏菜单做授权；菜单是体验层，服务端权限检查是安全层。
5. UI 变更遵循 [docs/ui-guidelines.md](docs/ui-guidelines.md)。

## 质量门槛

GitHub Actions 使用 Node.js 22 与 PostgreSQL 17，依次执行：

```bash
npm ci
npm run db:migrate
npm run db:verify
npm run check
npm run build
```

本地推荐同样跑 `npm run check` 与 `npm run build`。

## 许可证

[MIT](LICENSE)
