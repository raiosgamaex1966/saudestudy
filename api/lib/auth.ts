import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@db/schema";
import { jwtVerify } from "jose";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";

const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);

export async function authenticateRequest(headers: Headers): Promise<User | undefined> {
  let token: string | undefined;

  // 1. Try Authorization header
  const authHeader = headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Try Cookie if no auth header
  if (!token) {
    const cookieHeader = headers.get("cookie");
    if (cookieHeader) {
      const cookies = cookie.parse(cookieHeader);
      token = cookies[Session.cookieName];
    }
  }

  if (!token) {
    return undefined;
  }

  const db = getDb();

  try {
    // First try to verify as our custom JWT (for local login)
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(env.appSecret)
      );
      
      if (payload && payload.sub) {
        const [user] = await db.select().from(users).where(eq(users.id, Number(payload.sub)));
        return user;
      }
    } catch (err) {
      // Not our JWT, try Supabase
    }

    // Try Supabase verification
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    
    if (!error && supabaseUser) {
      const [user] = await db.select().from(users).where(eq(users.email, supabaseUser.email!));
      return user;
    }

    return undefined;
  } catch (err) {
    console.error("Auth error:", err);
    return undefined;
  }
}
