import { db, dbClient } from "../src/lib/db";
import { auditLog } from "../src/lib/db/schema";
import { createCredentialUser, UserManagementError } from "../src/lib/auth/user-management";
import { SYSTEM_ADMIN_ROLE_KEY } from "../src/lib/rbac/constants";

if (process.env.NODE_ENV === "production") {
  console.error("❌ 严禁在生产环境中运行测试数据填充 (db:seed)！");
  process.exit(1);
}

const DEMO_PASSWORD = "DemoPassword123!"; // 满足 12 位且含字母与数字的要求

const DEMO_USERS = [
  { name: "李运营", email: "operator@example.com", roles: ["member"] },
  { name: "张研发", email: "developer@example.com", roles: ["member"] },
  { name: "王审计", email: "auditor@example.com", roles: ["member"] },
];

async function seed() {
  console.log("🌱 开始填充开发环境演示数据...\n");

  let createdCount = 0;
  for (const item of DEMO_USERS) {
    try {
      await createCredentialUser(
        {
          name: item.name,
          email: item.email,
          password: DEMO_PASSWORD,
          roles: item.roles,
        },
        SYSTEM_ADMIN_ROLE_KEY,
        {
          actor: { userId: null, email: "system@seed.local" },
          action: "user.seed_create",
          resourceType: "user",
          summary: `初始化演示用户 ${item.name} (${item.email})`,
        },
      );
      console.log(`✅ 创建演示用户: ${item.name} <${item.email}> (密码: ${DEMO_PASSWORD})`);
      createdCount++;
    } catch (error) {
      if (error instanceof UserManagementError && error.code === "email_taken") {
        console.log(`ℹ️  演示用户已存在，跳过: ${item.email}`);
      } else {
        console.warn(`⚠️  创建演示用户失败 [${item.email}]:`, error);
      }
    }
  }

  // 插入若干条演示审计日志
  const sampleAudits = [
    {
      id: crypto.randomUUID(),
      actorUserId: null,
      actorEmail: "admin@example.com",
      action: "role.update",
      resourceType: "role",
      resourceId: "role-member",
      summary: "调整普通成员权限集",
      ipAddress: "127.0.0.1",
      createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2), // 2 天前
    },
    {
      id: crypto.randomUUID(),
      actorUserId: null,
      actorEmail: "operator@example.com",
      action: "menu.view",
      resourceType: "menu",
      resourceId: null,
      summary: "访问系统控制台工作台",
      ipAddress: "127.0.0.1",
      createdAt: new Date(Date.now() - 3600 * 1000 * 12), // 12 小时前
    },
    {
      id: crypto.randomUUID(),
      actorUserId: null,
      actorEmail: "admin@example.com",
      action: "security.policy_check",
      resourceType: "security",
      resourceId: null,
      summary: "执行定期安全边界合规性核验",
      ipAddress: "127.0.0.1",
      createdAt: new Date(Date.now() - 3600 * 1000 * 3), // 3 小时前
    },
  ];

  for (const audit of sampleAudits) {
    try {
      await db.insert(auditLog).values(audit);
    } catch {
      // 忽略重复或错误
    }
  }
  console.log("✅ 补充了演示审计日志");

  console.log(`\n🎉 数据填充完成！共新增 ${createdCount} 个演示账号。`);
}

seed()
  .catch((err) => {
    console.error("❌ 填充失败:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbClient.end();
  });
