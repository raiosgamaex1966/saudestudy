import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { simulations, users } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

// Simulated AI question generation - in production, this would call an LLM API
function generateMockQuestions(_type: string, count: number, subjectName: string) {
  const questions = [];
  const types = [
    { text: `Qual é a principal função do sistema circulatório em ${subjectName}?`, options: ["Transporte de nutrientes", "Produção de hormônios", "Digestão de alimentos", "Eliminação de toxinas"], correct: 0 },
    { text: `Em ${subjectName}, qual procedimento é prioritário em caso de parada cardiorrespiratória?`, options: ["Administrar medicamentos", "Iniciar RCP imediatamente", "Aguardar médico", "Oxigenoterapia"], correct: 1 },
    { text: `Sobre biossegurança em ${subjectName}, qual EPI é essencial?`, options: ["Luvas descartáveis", "Óculos de sol", "Boné", "Tênis esportivo"], correct: 0 },
    { text: `Qual é a dose padrão de adrenalina em ${subjectName}?`, options: ["0,5 mg", "1 mg", "2 mg", "5 mg"], correct: 1 },
    { text: `Em ${subjectName}, o que significa o princípio da não-maleficência?`, options: ["Fazer o bem ao paciente", "Não causar dano ao paciente", "Respeitar a autonomia", "Garantir justiça"], correct: 1 },
    { text: `Qual exame é mais indicado para diagnóstico de fraturas em ${subjectName}?`, options: ["Ultrassonografia", "Ressonância magnética", "Radiografia simples", "Tomografia computadorizada"], correct: 2 },
    { text: `Sobre o SUS em ${subjectName}, qual é o nível de atenção para urgências?`, options: ["Atenção Primária", "Atenção Secundária", "Atenção Terciária", "Atenção Quaternária"], correct: 2 },
    { text: `Em ${subjectName}, qual é a via de administração mais rápida de medicamentos?`, options: ["Oral", "Intramuscular", "Subcutânea", "Endovenosa"], correct: 3 },
    { text: `Qual é o principal objetivo do atendimento pré-hospitalar em ${subjectName}?`, options: ["Diagnóstico definitivo", "Estabilização e transporte", "Realização de cirurgias", "Prescrição de medicamentos"], correct: 1 },
    { text: `Em ${subjectName}, qual valor de glicemia é considerado hipoglicemia?`, options: ["< 70 mg/dL", "< 100 mg/dL", "< 140 mg/dL", "< 200 mg/dL"], correct: 0 },
    { text: `Sobre raio-X em ${subjectName}, qual proteção é obrigatória?`, options: ["Avental de chumbo", "Máscara cirúrgica", "Luvas estéreis", "Óculos de proteção"], correct: 0 },
    { text: `Em ${subjectName}, qual é a frequência respiratória normal do adulto?`, options: ["8-12 rpm", "12-20 rpm", "20-30 rpm", "30-40 rpm"], correct: 1 },
    { text: `Qual é o primeiro passo no atendimento a um paciente politraumatizado em ${subjectName}?`, options: ["Imobilização", "Avaliação das vias aéreas", "Punção venosa", "Exames complementares"], correct: 1 },
    { text: `Em ${subjectName}, qual solução é usada para limpeza de ferimentos?`, options: ["Álcool 70%", "Soro fisiológico 0,9%", "Água oxigenada", "Iodopovidona"], correct: 1 },
    { text: `Sobre ética profissional em ${subjectName}, o sigilo médico é:`, options: ["Facultativo", "Obrigatório", "Depende do caso", "Apenas verbal"], correct: 1 },
  ];

  for (let i = 0; i < Math.min(count, types.length); i++) {
    const q = types[i];
    questions.push({
      id: i + 1,
      text: q.text,
      options: q.options,
      correctAnswer: q.correct,
      explanation: `A resposta correta é a alternativa ${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]} é a opção correta para esta questão sobre ${subjectName}.`,
    });
  }
  return questions;
}

export const simulationRouter = createRouter({
  list: authedQuery
    .input(z.object({ subjectId: z.number().optional(), type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.subjectId && input?.type) {
        return db
          .select()
          .from(simulations)
          .where(
            and(
              eq(simulations.subjectId, input.subjectId),
              eq(simulations.type, input.type as "quiz" | "exam" | "questionnaire"),
              eq(simulations.isPublic, true)
            )
          )
          .orderBy(desc(simulations.createdAt));
      }
      if (input?.subjectId) {
        return db
          .select()
          .from(simulations)
          .where(and(eq(simulations.subjectId, input.subjectId), eq(simulations.isPublic, true)))
          .orderBy(desc(simulations.createdAt));
      }
      return db
        .select()
        .from(simulations)
        .where(eq(simulations.isPublic, true))
        .orderBy(desc(simulations.createdAt));
    }),

  mySimulations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(simulations)
      .where(eq(simulations.createdBy, ctx.user.id))
      .orderBy(desc(simulations.createdAt));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(simulations)
        .where(eq(simulations.id, input.id));
      return results[0] ?? null;
    }),

  generate: authedQuery
    .input(
      z.object({
        subjectId: z.number(),
        materialId: z.number().optional(),
        type: z.enum(["quiz", "exam", "questionnaire"]),
        title: z.string(),
        questionCount: z.number().min(1).max(50).default(10),
        config: z.object({
          timeLimit: z.number().optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = ctx.user;
      const creditCost = 1;

      if ((user.credits ?? 0) < creditCost) {
        throw new Error("Créditos insuficientes para gerar simulado");
      }

      // Get subject name
      const { subjects } = await import("@db/schema");
      const subjectResults = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, input.subjectId));
      const subjectName = subjectResults[0]?.name || "Saúde";

      // Generate questions (mock AI)
      const questions = generateMockQuestions(
        input.type,
        input.questionCount,
        subjectName
      );

      const result = await db.insert(simulations).values({
        title: input.title,
        type: input.type,
        subjectId: input.subjectId,
        materialId: input.materialId,
        createdBy: user.id,
        questions: JSON.stringify(questions),
        config: input.config ? JSON.stringify(input.config) : null,
        creditCost,
      });

      // Deduct credits
      await db
        .update(users)
        .set({ credits: (user.credits ?? 0) - creditCost })
        .where(eq(users.id, user.id));

      return {
        id: Number(result[0].insertId),
        questions,
        creditsUsed: creditCost,
      };
    }),

  createManual: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        type: z.enum(["quiz", "exam", "questionnaire"]),
        subjectId: z.number(),
        questions: z.array(z.any()),
        config: z.object({
          timeLimit: z.number().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(simulations).values({
        ...input,
        createdBy: ctx.user.id,
        questions: JSON.stringify(input.questions),
        config: input.config ? JSON.stringify(input.config) : null,
      });
      return { id: Number(result[0].insertId) };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const sim = await db
        .select()
        .from(simulations)
        .where(eq(simulations.id, input.id));
      if (!sim[0]) throw new Error("Simulado não encontrado");
      if (sim[0].createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Não autorizado");
      }
      await db.delete(simulations).where(eq(simulations.id, input.id));
      return { success: true };
    }),
});
