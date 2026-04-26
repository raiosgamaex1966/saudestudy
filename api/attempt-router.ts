import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { attempts, simulations } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const attemptRouter = createRouter({
  start: authedQuery
    .input(z.object({ simulationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(attempts).values({
        simulationId: input.simulationId,
        userId: ctx.user.id,
        answers: JSON.stringify([]),
      });
      return { id: Number(result[0].insertId) };
    }),

  submit: authedQuery
    .input(
      z.object({
        attemptId: z.number(),
        answers: z.array(
          z.object({
            questionId: z.number(),
            selectedOption: z.number(),
          })
        ),
        timeSpent: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const attemptResults = await db
        .select()
        .from(attempts)
        .where(eq(attempts.id, input.attemptId));
      const attempt = attemptResults[0];
      if (!attempt) throw new Error("Tentativa não encontrada");
      if (attempt.userId !== ctx.user.id) throw new Error("Não autorizado");

      const simResults = await db
        .select()
        .from(simulations)
        .where(eq(simulations.id, attempt.simulationId ?? 0));
      const simulation = simResults[0];
      if (!simulation) throw new Error("Simulado não encontrado");

      const questions = JSON.parse(simulation.questions as string) as Array<{
        id: number;
        correctAnswer: number;
      }>;

      let correctCount = 0;
      input.answers.forEach((ans) => {
        const question = questions.find((q: { id: number }) => q.id === ans.questionId);
        if (question && question.correctAnswer === ans.selectedOption) {
          correctCount++;
        }
      });

      const score = questions.length > 0
        ? ((correctCount / questions.length) * 100).toFixed(2)
        : "0";

      await db
        .update(attempts)
        .set({
          answers: JSON.stringify(input.answers),
          score,
          correctCount,
          totalQuestions: questions.length,
          timeSpent: input.timeSpent,
          completedAt: new Date(),
        })
        .where(eq(attempts.id, input.attemptId));

      return {
        score: parseFloat(score),
        correctCount,
        totalQuestions: questions.length,
      };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, ctx.user.id))
      .orderBy(desc(attempts.createdAt));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(attempts)
        .where(eq(attempts.id, input.id));
      const attempt = results[0];
      if (!attempt) return null;
      if (attempt.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Não autorizado");
      }
      return attempt;
    }),
});
