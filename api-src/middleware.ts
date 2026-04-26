import { ErrorMessages } from "../contracts/constants.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

// Middleware to check if user is blocked or has expired plan
const requireActiveAccount = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  // Check if user is blocked
  if (ctx.user.blocked) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.user.blockReason || "Sua conta foi bloqueada. Entre em contato com o suporte.",
    });
  }

  // Check if paid plan expired (skip for free users and admins)
  if (ctx.user.role !== "admin" && ctx.user.plan !== "free" && ctx.user.planExpiresAt) {
    const now = new Date();
    if (new Date(ctx.user.planExpiresAt) < now) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Seu plano expirou. Renove seu plano para continuar usando a plataforma.",
      });
    }
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authedQuery = t.procedure.use(requireAuth);
export const activeUserQuery = t.procedure.use(requireAuth).use(requireActiveAccount);
export const adminQuery = authedQuery.use(requireRole("admin"));
