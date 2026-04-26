import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../db/schema.ts";
import { authenticateRequest } from "./lib/auth.ts";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch (err) {
    console.error("Context creation auth error:", err);
    // Authentication is optional here
  }
  return ctx;
}
