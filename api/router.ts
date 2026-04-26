import { authRouter } from "./auth-router.ts";
import { subjectRouter } from "./subject-router.ts";
import { materialRouter } from "./material-router.ts";
import { simulationRouter } from "./simulation-router.ts";
import { attemptRouter } from "./attempt-router.ts";
import { creditRouter } from "./credit-router.ts";
import { adminRouter } from "./admin-router.ts";
import { adminMaterialRouter } from "./admin-material-router.ts";
import { createRouter, publicQuery } from "./middleware.ts";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  subject: subjectRouter,
  material: materialRouter,
  simulation: simulationRouter,
  attempt: attemptRouter,
  credit: creditRouter,
  admin: adminRouter,
  adminMaterial: adminMaterialRouter,
});

export type AppRouter = typeof appRouter;
