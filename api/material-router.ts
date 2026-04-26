import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { materials, users } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const materialRouter = createRouter({
  list: authedQuery
    .input(z.object({ subjectId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.subjectId) {
        return db
          .select()
          .from(materials)
          .where(
            and(
              eq(materials.subjectId, input.subjectId),
              eq(materials.isPublic, true)
            )
          )
          .orderBy(desc(materials.createdAt));
      }
      return db
        .select()
        .from(materials)
        .where(eq(materials.isPublic, true))
        .orderBy(desc(materials.createdAt));
    }),

  myMaterials: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(materials)
      .where(eq(materials.uploadedBy, ctx.user.id))
      .orderBy(desc(materials.createdAt));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(materials)
        .where(eq(materials.id, input.id));
      return results[0] ?? null;
    }),

  upload: authedQuery
    .input(
      z.object({
        title: z.string().min(1),
        fileData: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        subjectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = ctx.user;
      const creditsNeeded = Math.ceil(input.fileSize / (50 * 1024 * 1024));

      if ((user.credits ?? 0) < creditsNeeded) {
        throw new Error(`Créditos insuficientes. Necessário: ${creditsNeeded}`);
      }

      // Store file as base64 data URL locally
      const fileUrl = input.fileData;

      const result = await db.insert(materials).values({
        title: input.title,
        fileUrl,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        subjectId: input.subjectId,
        uploadedBy: user.id,
      });

      // Deduct credits
      await db
        .update(users)
        .set({ credits: (user.credits ?? 0) - creditsNeeded })
        .where(eq(users.id, user.id));

      return {
        id: Number(result[0].insertId),
        creditsUsed: creditsNeeded,
      };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const mat = await db
        .select()
        .from(materials)
        .where(eq(materials.id, input.id));
      if (!mat[0]) throw new Error("Material não encontrado");
      if (mat[0].uploadedBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Não autorizado");
      }
      await db.delete(materials).where(eq(materials.id, input.id));
      return { success: true };
    }),
});
