import "dotenv/config";
import "reflect-metadata";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DataSource } from "typeorm";
import envConfig from "./config/envConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isTsMode = __filename.endsWith(".ts");

const entitiesGlob = join(__dirname, `entities/*.${isTsMode ? "ts" : "js"}`);
const migrationsGlob = join(__dirname, `migrations/*.${isTsMode ? "ts" : "js"}`);
const subscribersGlob = join(__dirname, `subscribers/*.${isTsMode ? "ts" : "js"}`);

export const AppDataSource = new DataSource({
  type: "mysql",
  host: envConfig.DB_HOST,
  port: Number(envConfig.DB_PORT),
  username: envConfig.DB_USERNAME,
  password: envConfig.DB_PASSWORD,
  database: envConfig.DB_NAME,
  synchronize: envConfig.SYNCHRONIZE,
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
