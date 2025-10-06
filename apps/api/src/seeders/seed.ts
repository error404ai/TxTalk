import "dotenv/config";
import "reflect-metadata";

import { AppDataSource, initializeDatabase } from "../database.js";
import { Message } from "../entities/Message.js";

async function seed() {
  await initializeDatabase();

  const repository = AppDataSource.getRepository(Message);
  const count = await repository.count();

  if (count > 0) {
    console.log("ℹ️  Messages table already contains data. Skipping seed.");
    await AppDataSource.destroy();
    return;
  }

  const welcomeMessage = repository.create({
    sender: "System",
    receiver: "System",
    message: "Welcome to txtalk! You're all set. Start sending messages on Solana.",
    txSignature: "SEED_TX_SIGNATURE",
    tokenAddress: null,
    feePaid: 0,
  });

  await repository.save(welcomeMessage);

  console.log("✅ Seed data inserted successfully.");
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error("❌ Failed to seed the database", error);
  process.exit(1);
});
