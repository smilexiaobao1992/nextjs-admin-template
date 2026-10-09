import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { execSync, spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const envExamplePath = join(root, ".env.example");
const envLocalPath = join(root, ".env.local");

console.log("🚀 开始初始化 Next.js Admin Template 开发环境...\n");

// 1. 处理 .env.local
if (!existsSync(envLocalPath)) {
  console.log("📄 未检测到 .env.local，正在从 .env.example 复制...");
  if (existsSync(envExamplePath)) {
    let content = readFileSync(envExamplePath, "utf-8");
    const secret = randomBytes(32).toString("base64");
    content = content.replace("BETTER_AUTH_SECRET=change-me", `BETTER_AUTH_SECRET=${secret}`);
    writeFileSync(envLocalPath, content, "utf-8");
    console.log("✅ 已创建 .env.local 并自动生成随机 BETTER_AUTH_SECRET\n");
  } else {
    console.error("❌ 未找到 .env.example 文件");
    process.exit(1);
  }
} else {
  // 检查已有的 .env.local 是否还包含 change-me
  let content = readFileSync(envLocalPath, "utf-8");
  if (content.includes("BETTER_AUTH_SECRET=change-me")) {
    const secret = randomBytes(32).toString("base64");
    content = content.replace("BETTER_AUTH_SECRET=change-me", `BETTER_AUTH_SECRET=${secret}`);
    writeFileSync(envLocalPath, content, "utf-8");
    console.log("✅ 检测到占位符，已自动为 .env.local 生成随机 BETTER_AUTH_SECRET\n");
  } else {
    console.log("ℹ️  .env.local 已存在，跳过环境变量创建\n");
  }
}

// 2. 启动本地 Docker 数据库 (如果安装了 docker)
console.log("🐘 正在检查并启动本地 PostgreSQL 容器...");
try {
  execSync("docker compose --env-file .env.local up -d", { stdio: "inherit" });
  console.log("✅ Docker 容器已启动，等待数据库就绪...");

  // 等待 pg_isready
  let ready = false;
  for (let i = 0; i < 15; i++) {
    const res = spawnSync("docker", [
      "compose",
      "--env-file",
      ".env.local",
      "exec",
      "-T",
      "postgres",
      "pg_isready",
      "-U",
      "postgres",
    ]);
    if (res.status === 0) {
      ready = true;
      break;
    }
    spawnSync("sleep", ["1"]);
  }

  if (ready) {
    console.log("✅ PostgreSQL 已就绪\n");
  } else {
    console.warn("⚠️  等待数据库就绪超时，将继续尝试执行迁移...\n");
  }
} catch {
  console.warn("⚠️  未能自动启动 Docker Compose (可能未安装 Docker 或 Docker 未运行)");
  console.warn("   请确保您的 PostgreSQL 实例已启动并匹配 .env.local 配置。\n");
}

// 3. 执行数据库迁移
console.log("📦 正在执行数据库迁移 (npm run db:migrate)...");
try {
  execSync("npm run db:migrate", { stdio: "inherit" });
  console.log("✅ 数据库迁移完成\n");
} catch {
  console.error("❌ 数据库迁移失败，请检查数据库连接配置后重试。");
  process.exit(1);
}

// 4. 验证数据库
console.log("🔍 验证数据库基线与约束...");
try {
  execSync("npm run db:verify", { stdio: "inherit" });
  console.log("✅ 数据库验证通过\n");
} catch {
  console.error("❌ 数据库基线验证失败。");
  process.exit(1);
}

console.log(`
🎉 环境初始化完成！

后续步骤:
  1. 创建管理员账号:
     npm run admin:create

  2. (可选) 填充开发演示数据:
     npm run db:seed

  3. 启动开发服务器:
     npm run dev
`);
