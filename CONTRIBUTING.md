# 贡献指南

感谢关注 Next.js Admin Template。本仓库定位是**可复制的后台基础设施**，不收录具体业务模块。

## 开发环境

- Node.js 24
- npm 10
- Docker（推荐，用于 PostgreSQL）或本地 PostgreSQL 15+

```bash
git clone <your-fork>
cd nextjs-admin-template
npm ci
cp .env.example .env.local
docker compose up -d
npm run db:migrate
npm run admin:create
npm run dev
```

没有 Docker 时，把 `.env.local` 中的数据库地址改成你的 PostgreSQL 实例即可。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run check` | lint + typecheck + test |
| `npm run build` | 生产构建 |
| `npm run db:generate` | 根据 schema 生成迁移 |
| `npm run db:migrate` | 执行迁移 |
| `npm run db:verify` | 校验种子与关键约束 |
| `npm run db:verify:security` | 校验授权边界与审计事务原子性 |
| `npm run scaffold:feature -- <name>` | 生成 feature 骨架 |

提交前请至少通过：

```bash
npm run check
npm run db:verify:security
npm run build
```

## 代码约定

- 路由保持薄：`src/app/**/page.tsx` 只做权限校验与组装。
- 业务放在 `src/features/<domain>/`。
- 鉴权在 Server Action / 页面服务端使用 `requirePermission`；不要只靠隐藏菜单。
- 关键写操作与审计日志（`writeAuditLog`）必须在同一个数据库事务中提交。
- UI 遵循 [docs/ui-guidelines.md](docs/ui-guidelines.md)。
- 默认界面文案为简体中文；代码标识符与注释使用英文。
- 不要提交 `.env`、密钥或真实生产数据。

## Pull Request

1. 从最新 `main` 开分支。
2. 改动尽量聚焦一个主题；避免顺手大重构。
3. 说明动机、行为变化与验证方式（命令输出或截图）。
4. 若变更 schema，请提交 Drizzle 迁移 SQL，并更新 `scripts/verify-rbac-database.ts`（如影响种子计数）。
5. 不要在本模板中合并完整业务系统（库存、电商、CRM 等）；请 fork 后独立演进。

## 安全问题

请勿公开 issue 披露安全漏洞。参见 [SECURITY.md](SECURITY.md)。
