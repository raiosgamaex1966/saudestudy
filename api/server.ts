/**
 * server.ts – Vercel Serverless Handler
 *
 * Este arquivo é o único ponto de entrada da API na Vercel.
 * Ele recria o app Hono sem iniciar um servidor Node.js,
 * exportando apenas `app.fetch` como handler serverless.
 */

import "dotenv/config";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../api-src/router.js";
import { createContext } from "../api-src/context.js";

const app = new Hono();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app.fetch;
