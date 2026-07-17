import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and configure PostgreSQL.");
  }

  return value;
}

export const dbClient = postgres(requireDatabaseUrl(), {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  connection: {
    application_name: "nextjs-admin-template",
  },
});

export const db = drizzle(dbClient, { schema });
