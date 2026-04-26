import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, simulations, attempts, materials, apiKeys } from "@db/schema";
import { eq, desc, count } from "drizzle-orm";

export const adminRouter = createRouter({
  getStats: adminQuery.query(async () => {
    const db = getDb();
    const [userCount] = await db.select({ value: count() }).from(users);
    const [simCount] = await db.select({ value: count() }).from(simulations);
    const [attemptCount] = await db.select({ value: count() }).from(attempts);
    const [materialCount] = await db.select({ value: count() }).from(materials);
    const [blockedCount] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.blocked, true));

    // Count users with expired plans
    const now = new Date();
    const allUsers = await db.select().from(users);
    const expiredCount = allUsers.filter(
      (u) => u.plan !== "free" && u.planExpiresAt && new Date(u.planExpiresAt) < now
    ).length;

    return {
      totalUsers: userCount.value,
      totalSimulations: simCount.value,
      totalAttempts: attemptCount.value,
      totalMaterials: materialCount.value,
      blockedUsers: blockedCount.value,
      expiredPlans: expiredCount,
    };
  }),

  getUsers: adminQuery.query(async () => {
    const db = getDb();
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        credits: users.credits,
        plan: users.plan,
        planExpiresAt: users.planExpiresAt,
        blocked: users.blocked,
        blockReason: users.blockReason,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const now = new Date();
    return allUsers.map((u) => ({
      ...u,
      isExpired:
        u.plan !== "free" && u.planExpiresAt
          ? new Date(u.planExpiresAt) < now
          : false,
    }));
  }),

  updateUser: adminQuery
    .input(
      z.object({
        id: z.number(),
        role: z.enum(["user", "admin"]).optional(),
        credits: z.number().optional(),
        plan: z.enum(["free", "monthly", "semester", "annual"]).optional(),
        planExpiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(users).set(data).where(eq(users.id, id));
      return { success: true };
    }),

  // Block a user
  blockUser: adminQuery
    .input(
      z.object({
        id: z.number(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ blocked: true, blockReason: input.reason })
        .where(eq(users.id, input.id));
      return { success: true };
    }),

  // Unblock a user
  unblockUser: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ blocked: false, blockReason: null })
        .where(eq(users.id, input.id));
      return { success: true };
    }),

  // Renew user plan
  renewPlan: adminQuery
    .input(
      z.object({
        id: z.number(),
        plan: z.enum(["monthly", "semester", "annual"]),
        days: z.number().default(30),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.days);

      await db
        .update(users)
        .set({
          plan: input.plan,
          planExpiresAt: expiresAt,
          blocked: false,
        })
        .where(eq(users.id, input.id));

      return { success: true, expiresAt };
    }),

  getApiKeys: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }),

  setApiKey: adminQuery
    .input(
      z.object({
        provider: z.string(),
        keyValue: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.provider, input.provider));

      const result = await db.insert(apiKeys).values({
        provider: input.provider,
        keyValue: input.keyValue,
        createdBy: ctx.user.id,
      });

      return { id: Number(result[0].insertId) };
    }),

  deleteApiKey: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(apiKeys).where(eq(apiKeys.id, input.id));
      return { success: true };
    }),
});
