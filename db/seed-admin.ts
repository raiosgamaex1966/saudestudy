import { getDb } from "../api-src/queries/connection.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../api-src/lib/password.js";

async function seedAdmin() {
  const db = getDb();

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
      blocked: false,
    });

    console.log("✅ Admin user created!");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);
    console.log(`   Role: admin`);
  } else {
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
}

seedAdmin().catch(console.error);
