import { getDb } from "../api-src/queries/connection";
import { subjects, users } from "./schema";
import { hashPassword } from "../api-src/lib/password";
import { eq } from "drizzle-orm";

async function seed() {
  const db = getDb();

  // ─── Seed Subjects ───
  const initialSubjects = [
    {
      name: "Técnico em Radiologia",
      slug: "tecnico-radiologia",
      description: "Procedimentos radiológicos, proteção radiológica, anatomia para radiologia e legislação",
      icon: "scan",
      category: "Técnico",
    },
    {
      name: "Técnico em Enfermagem",
      slug: "tecnico-enfermagem",
      description: "Cuidados de enfermagem, administração de medicamentos, biossegurança e ética",
      icon: "heart-pulse",
      category: "Técnico",
    },
    {
      name: "Enfermeiro",
      slug: "enfermeiro",
      description: "Processo de enfermagem, gestão em saúde, pesquisa e assistência de alta complexidade",
      icon: "stethoscope",
      category: "Superior",
    },
    {
      name: "Sistema Único de Saúde (SUS)",
      slug: "sus",
      description: "Legislação do SUS, princípios, organização e políticas de saúde pública",
      icon: "shield-plus",
      category: "Legislação",
    },
    {
      name: "Raciocínio Lógico Matemático",
      slug: "raciocinio-logico",
      description: "Lógica proposicional, argumentação, sequências, análise combinatória e probabilidade",
      icon: "brain",
      category: "Geral",
    },
    {
      name: "Matemática",
      slug: "matematica",
      description: "Aritmética, álgebra, geometria, trigonometria, estatística e análise matemática",
      icon: "calculator",
      category: "Geral",
    },
    {
      name: "Redação",
      slug: "redacao",
      description: "Técnicas de redação, coesão, coerência, tipologia textual e normas cultas",
      icon: "pen-tool",
      category: "Geral",
    },
    {
      name: "Português",
      slug: "portugues",
      description: "Gramática, interpretação de texto, literatura, ortografia e semântica",
      icon: "book-open",
      category: "Geral",
    },
  ];

  for (const subject of initialSubjects) {
    await db.insert(subjects).values(subject).onDuplicateKeyUpdate({
      set: { name: subject.name, description: subject.description },
    });
  }

  console.log("✅ Subjects seeded!");

  // ─── Seed Admin User ───
  const adminEmail = "robsoncordeiro1966@gmail.com";
  const adminPassword = "Binho2020@#$";
  const adminName = "Robson Cordeiro dos Santos";

  // Check if admin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existing.length === 0) {
    const hashedPassword = await hashPassword(adminPassword);

    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: "admin",
      credits: 9999,
      plan: "annual",
      unionId: null,
      blocked: false,
    });

    console.log("✅ Admin user created!");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);
    console.log(`   Role: admin`);
  } else {
    // Update existing to ensure admin role and password
    const hashedPassword = await hashPassword(adminPassword);
    await db
      .update(users)
      .set({
        role: "admin",
        password: hashedPassword,
        name: adminName,
        credits: 9999,
        plan: "annual",
        blocked: false,
      })
      .where(eq(users.email, adminEmail));
    console.log("✅ Admin user updated!");
  }

  console.log("\n🎉 Seed completed successfully!");
}

seed().catch(console.error);
