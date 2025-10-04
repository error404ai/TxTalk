import { z } from "zod";
import { AppDataSource } from "../database.js";
import { Message } from "../entities/Message.js";
import { createTRPCRouter, publicProcedure } from "../trpc/trpc.js";

const createMessageInput = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().optional(),
});
type CreateMessageInput = z.infer<typeof createMessageInput>;

export const messagesRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    const repository = AppDataSource.getRepository(Message);
    const messages = await repository.find({
      order: { createdAt: "DESC" },
    });
    return messages;
  }),
  create: publicProcedure.input(createMessageInput).mutation(async ({ input }: { input: CreateMessageInput }) => {
    const repository = AppDataSource.getRepository(Message);
    const message = repository.create({
      title: input.title,
      body: input.body ?? null,
    });
    await repository.save(message);
    return message;
  }),
});
