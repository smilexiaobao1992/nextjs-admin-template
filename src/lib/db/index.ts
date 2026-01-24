import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.SUPABASE_DATABASE_URL!;

// 配置连接池以适配 Supabase pooler
const client = postgres(connectionString, {
  max: 20, // 增加最大连接数
  idle_timeout: 20, // 空闲连接超时（秒）
  connect_timeout: 10, // 连接超时（秒）
  // Supabase pooler 模式需要禁用 prepared statements
  prepare: false,
  // 启用连接重试
  connection: {
    application_name: "kailex-web",
  },
});

export const db = drizzle(client, { schema });
