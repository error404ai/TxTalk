import "dotenv/config";
import "reflect-metadata";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DataSource } from "typeorm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isTsMode = __filename.endsWith(".ts");

const entitiesGlob = join(__dirname, `entities/*.${isTsMode ? "ts" : "js"}`);
const migrationsGlob = join(__dirname, `migrations/*.${isTsMode ? "ts" : "js"}`);
const subscribersGlob = join(__dirname, `subscribers/*.${isTsMode ? "ts" : "js"}`);

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "solmessage_db",
  synchronize: (process.env.DB_SYNCHRONIZE ?? "true").toLowerCase() !== "false",
  logging: false,
  entities: [entitiesGlob],
  migrations: [migrationsGlob],
  subscribers: [subscribersGlob],
});

export async function initializeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    return;
  }

  await AppDataSource.initialize();
}
