import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env.ts";
import * as schema from "../../db/schema.ts";
import * as relations from "../../db/relations.ts";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const client = postgres(env.databaseUrl);
    instance = drizzle(client, {
      schema: fullSchema,
    });
  }
  return instance;
}
