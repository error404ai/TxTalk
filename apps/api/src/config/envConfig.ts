const requiredKeys = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USERNAME", "DB_PASSWORD", "MYSQL_ROOT_PASSWORD", "API_PORT", "API_HOST", "DB_SYNCHRONIZE"] as const;

const missing = requiredKeys.filter((k) => {
  const v = process.env[k];
  return v === undefined || v === null || String(v).trim() === "";
});

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}. Please set them in your .env or via docker compose env_file.`);
}

const envConfig = {
  DB_HOST: process.env.DB_HOST as string,
  DB_PORT: process.env.DB_PORT as string,
  DB_NAME: process.env.DB_NAME as string,
  DB_USERNAME: process.env.DB_USERNAME as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  MYSQL_ROOT_PASSWORD: process.env.MYSQL_ROOT_PASSWORD as string,
  API_PORT: process.env.API_PORT as string,
  API_HOST: process.env.API_HOST as string,
  SYNCHRONIZE: process.env.SYNCHRONIZE === "true" ? true : false,
};

export default envConfig;
