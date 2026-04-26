import { z } from "zod";
import * as cookie from "cookie";
import { Session } from "../contracts/constants.ts";
import { getSessionCookieOptions } from "./lib/cookies.ts";
import { createRouter, publicQuery, authedQuery } from "./middleware.ts";
import { getDb } from "./queries/connection.ts";
import { users } from "../db/schema.ts";
import { hashPassword, verifyPassword } from "./lib/password.ts";
import { env } from "./lib/env.ts";
import { SignJWT } from "jose";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  // Local registration
  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      // Check if email exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error("Email já cadastrado");
      }
      
      const hashed = await hashPassword(input.password);
      
      const result = await db.insert(users).values({
        email: input.email,
        password: hashed,
        name: input.name,
        role: "user",
        credits: 5,
        plan: "free",
        lastSignInAt: new Date(),
      });
      
      return { success: true, id: Number(result[0].insertId) };
    }),

  // Local login
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      
      if (userRows.length === 0) {
        throw new Error("Email ou senha incorretos");
      }
      
      const user = userRows[0];
      
      if (!user.password) {
        throw new Error("Conta criada via OAuth. Use login social.");
      }
      
      const valid = await verifyPassword(input.password, user.password);
      if (!valid) {
        throw new Error("Email ou senha incorretos");
      }
      
      // Update last sign in
      await db
        .update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, user.id));
      
      // Create session token
      const token = await new SignJWT({ 
        sub: String(user.id),
        email: user.email,
        role: user.role
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(new TextEncoder().encode(env.appSecret));
      
      // Set cookie
      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: cookieOpts.httpOnly,
          path: cookieOpts.path,
          sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "none",
          secure: cookieOpts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );
      
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  // Allows any logged-in user to become admin (useful for first setup)
  makeMeAdmin: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, ctx.user.id));
    return { success: true, role: "admin" };
  }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
