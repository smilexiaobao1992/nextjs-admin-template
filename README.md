# Next.js Admin Template

基于 Next.js 16 + React 19 的现代化管理后台模板，开箱即用。

## 特性

- **最新技术栈**: Next.js 16 (App Router) + React 19 + TypeScript
- **认证系统**: 集成 Better Auth，支持邮箱密码登录
- **权限管理**: 基于 RBAC 的权限系统框架
- **数据库**: Drizzle ORM + PostgreSQL (Supabase)
- **UI 组件**: 基于 Radix UI 的无障碍组件库
- **样式方案**: Tailwind CSS v4 + 深色模式支持
- **类型安全**: 完整的 TypeScript 类型定义

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19 + Radix UI + Tailwind CSS v4 |
| 数据库 | PostgreSQL (Supabase) + Drizzle ORM |
| 认证 | Better Auth |
| 状态管理 | React Hooks |
| 缓存 | 内存缓存 / Upstash Redis |

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd nextjs-admin-template
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写配置：

```bash
cp .env.example .env.local
```

必需配置：
```env
# Supabase 数据库
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# Better Auth
BETTER_AUTH_SECRET=your_random_secret_key  # 使用 openssl rand -base64 32 生成
BETTER_AUTH_URL=http://localhost:3000
```

### 4. 初始化数据库

```bash
# 推送数据库 schema
npm run db:push

# 或打开 Drizzle Studio 可视化编辑
npm run db:studio
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
nextjs-admin-template/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API 路由
│   │   │   └── auth/             # 认证 API
│   │   ├── app/                  # 受保护的应用页面
│   │   ├── dashboard/            # Dashboard 页面
│   │   ├── login/                # 登录页面
│   │   ├── register/             # 注册页面
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 首页
│   │   └── globals.css           # 全局样式
│   ├── components/               # React 组件
│   │   ├── ui/                   # 通用 UI 组件
│   │   ├── layout/               # 布局组件
│   │   │   ├── app-sidebar.tsx   # 侧边栏导航
│   │   │   └── user-header.tsx   # 用户头部
│   │   └── auth/                 # 认证组件
│   ├── lib/                      # 工具和配置
│   │   ├── db/                   # 数据库相关
│   │   │   ├── index.ts          # 数据库连接
│   │   │   └── schema.ts         # 数据库表定义
│   │   ├── auth.ts               # Better Auth 配置
│   │   ├── permissions/          # 权限系统
│   │   ├── cache/                # 缓存工具
│   │   ├── api-middleware.ts     # API 中间件
│   │   └── utils.ts              # 通用工具函数
│   └── types/                    # TypeScript 类型定义
├── public/                       # 静态资源
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── .env.example                  # 环境变量模板
```

## 常见任务

### 添加新页面

1. 在 `src/app/app/` 下创建新目录和页面文件：

```typescript
// src/app/app/users/page.tsx
import AppSidebar from "@/components/layout/app-sidebar";
import UserHeader from "@/components/layout/user-header";

export default function UsersPage() {
  return (
    <>
      <AppSidebar />
      <UserHeader />
      <main className="ml-56 mt-16 p-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        {/* 页面内容 */}
      </main>
    </>
  );
}
```

2. 在 `src/components/layout/app-sidebar.tsx` 中添加导航：

```typescript
const navItems: NavItem[] = [
  // ... 现有菜单
  {
    name: "用户管理",
    icon: Users,
    children: [
      { name: "用户列表", href: "/app/users", icon: Users },
    ],
  },
];
```

### 添加新 API 路由

在 `src/app/api/` 下创建 API 路由：

```typescript
// src/app/api/users/route.ts
import { withAuth } from "@/lib/api-middleware";
import { db } from "@/lib/db/index";
import { user } from "@/lib/db/schema";

export const GET = withAuth(async () => {
  const users = await db.select().from(user);
  return Response.json({ users });
});
```

### 添加数据库表

1. 在 `src/lib/db/schema.ts` 中定义表：

```typescript
export const post = pgTable("post", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
```

2. 推送到数据库：

```bash
npm run db:push
```

### 扩展权限系统

1. 在 `src/lib/db/schema.ts` 中添加新权限：

```typescript
export const permissionEnum = pgEnum("permission", [
  // 现有权限...
  "post_view",      // 新增
  "post_create",    // 新增
  "post_update",    // 新增
  "post_delete",    // 新增
]);
```

2. 在 `src/lib/permissions/` 中添加权限检查逻辑。

## 数据库 Schema

模板包含以下核心表：

### 认证系统 (Better Auth)
- `user` - 用户表
- `account` - 账户表（存储密码和 OAuth 信息）
- `session` - 会话表
- `profile` - 用户扩展信息表

### 权限系统
- `role_permission` - 角色权限关联表

### 审计日志
- `audit_log` - 操作日志表

### 示例业务表
- `content_item` - 内容管理示例表

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 启动生产服务器
npm run start

# 数据库操作
npm run db:generate   # 生成迁移文件
npm run db:push       # 推送 schema 到数据库
npm run db:studio     # 打开 Drizzle Studio

# 代码检查
npm run lint
```

## 部署

### Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 其他平台

确保平台支持 Node.js 18+ 和 PostgreSQL 数据库。

## 自定义

### 修改主题颜色

编辑 `src/app/globals.css` 中的 CSS 变量：

```css
:root {
  --primary: 214 95% 54%;  /* 主色调 */
  /* ... 其他颜色变量 */
}
```

### 移除不需要的功能

- 移除示例业务表：删除 `src/lib/db/schema.ts` 中的 `contentItem` 表
- 移除权限系统：删除 `src/lib/permissions/` 目录和相关代码
- 移除审计日志：删除 `auditLog` 表和相关逻辑

## License

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
