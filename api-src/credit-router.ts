import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { users, creditTransactions } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export const creditRouter = createRouter({
  getBalance: authedQuery.query(async ({ ctx }) => {
    return { credits: ctx.user.credits ?? 0, plan: ctx.user.plan };
  }),

  purchase: authedQuery
    .input(
      z.object({
        plan: z.enum(["monthly", "semester", "annual"]),
        credits: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = ctx.user;
      const newCredits = (user.credits ?? 0) + input.credits;

      await db
        .update(users)
        .set({
          credits: newCredits,
          plan: input.plan,
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(users.id, user.id));

      await db.insert(creditTransactions).values({
        userId: user.id,
        type: "purchase",
        amount: input.credits,
        description: `Compra de plano ${input.plan} - ${input.credits} créditos`,
      });

      return { credits: newCredits, plan: input.plan };
    }),

  getHistory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, ctx.user.id))
      .orderBy(desc(creditTransactions.createdAt));
  }),

  addBonus: authedQuery
    .input(z.object({ amount: z.number(), description: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = ctx.user;
      const newCredits = (user.credits ?? 0) + input.amount;

      await db
        .update(users)
        .set({ credits: newCredits })
        .where(eq(users.id, user.id));

      await db.insert(creditTransactions).values({
        userId: user.id,
        type: "bonus",
        amount: input.amount,
        description: input.description,
      });

      return { credits: newCredits };
    }),
});
