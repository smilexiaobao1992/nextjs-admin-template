# 认证扩展（默认关闭）

本模板默认只启用 **邮箱 + 密码** 登录，并关闭公开注册。以下能力由 Better Auth 提供，可按需在 fork 中打开。不要在未配置邮件或密钥时直接启用。

## 1. 忘记密码 / 重置密码

1. 配置可发送邮件的 `sendResetPassword`（或等价 hook）。
2. 在 `src/lib/auth.ts` 的 `emailAndPassword` 中启用重置相关选项（以当前 Better Auth 文档为准）。
3. 增加公开页面（例如 `/forgot-password`、`/reset-password`），调用 Better Auth client API。
4. 生产环境必须使用真实 HTTPS 的 `BETTER_AUTH_URL`。

管理员在后台重置他人密码已内置（用户管理 → 重置密码），不依赖邮件。

## 2. 邮箱验证

1. 配置验证邮件发送。
2. 在 Better Auth 中启用 `emailVerification`。
3. 按业务决定：未验证用户是否允许登录、是否仅限制部分操作。

## 3. OAuth（GitHub / Google 等）

1. 在对应平台创建 OAuth 应用，回调地址指向  
   `{BETTER_AUTH_URL}/api/auth/callback/<provider>`。
2. 将 client id / secret 放入环境变量（切勿提交到仓库）。
3. 在 `betterAuth({ socialProviders: { ... } })` 中注册提供商。
4. 登录页增加「使用 xxx 登录」按钮（`authClient.signIn.social`）。
5. 首次 OAuth 用户的默认角色应走 `role` 表的 `is_default` 角色（当前种子为 `member`）。

若前端与认证不同源，配置 `BETTER_AUTH_TRUSTED_ORIGINS`。

## 4. 两步验证（2FA）

1. 查阅 Better Auth 官方 2FA / TOTP 插件文档并安装所需插件。
2. 在 `plugins` 中启用，并为用户提供绑定与恢复码流程。
3. 管理后台可增加「是否要求管理员启用 2FA」的策略（业务层实现）。

## 5. 安全检查清单

- [ ] 生产 `BETTER_AUTH_SECRET` ≥ 32 字节随机值  
- [ ] 生产 `BETTER_AUTH_URL` 为实际 HTTPS 域名  
- [ ] OAuth / SMTP 密钥仅存环境变量  
- [ ] 打开公开注册前评估滥用与默认角色  
- [ ] 变更认证配置后跑 `npm run check` 与一次真实登录回归  
