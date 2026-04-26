import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { materials, subjects } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export const adminMaterialRouter = createRouter({
  // List all materials including official ones
  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(materials)
      .orderBy(desc(materials.createdAt));
  }),

  // List only official materials (admin uploaded)
  listOfficial: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(materials)
      .where(eq(materials.isOfficial, true))
      .orderBy(desc(materials.createdAt));
  }),

  // List materials by subject
  listBySubject: adminQuery
    .input(z.object({ subjectId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(materials)
        .where(
          and(
            eq(materials.subjectId, input.subjectId),
            eq(materials.isOfficial, true)
          )
        )
        .orderBy(desc(materials.createdAt));
    }),

  // Upload official material (no credit cost)
  uploadOfficial: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        fileData: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        subjectId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const result = await db.insert(materials).values({
        title: input.title,
        fileUrl: input.fileData,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        subjectId: input.subjectId,
        uploadedBy: ctx.user.id,
        isPublic: true,
        isOfficial: true,
      });

      return { id: Number(result[0].insertId) };
    }),

  // Toggle material visibility
  toggleVisibility: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const mat = await db
        .select()
        .from(materials)
        .where(eq(materials.id, input.id));
      
      if (!mat[0]) throw new Error("Material não encontrado");

      await db
        .update(materials)
        .set({ isPublic: !mat[0].isPublic })
        .where(eq(materials.id, input.id));

      return { success: true, isPublic: !mat[0].isPublic };
    }),

  // Update material
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        subjectId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(materials).set(data).where(eq(materials.id, id));
      return { success: true };
    }),

  // Delete material
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(materials).where(eq(materials.id, input.id));
      return { success: true };
    }),

  // Get subjects for dropdown
  getSubjects: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(subjects).where(eq(subjects.isActive, true));
  }),

  // Get stats for admin dashboard
  getMaterialStats: adminQuery.query(async () => {
    const db = getDb();
    const allMaterials = await db.select().from(materials);
    const officialMaterials = allMaterials.filter((m) => m.isOfficial);
    const userMaterials = allMaterials.filter((m) => !m.isOfficial);

    return {
      total: allMaterials.length,
      official: officialMaterials.length,
      userUploaded: userMaterials.length,
      bySubject: officialMaterials.reduce((acc, mat) => {
        const sid = mat.subjectId ?? 0;
        acc[sid] = (acc[sid] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
    };
  }),
});
