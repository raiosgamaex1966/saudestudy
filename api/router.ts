import { authRouter } from "./auth-router";
import { subjectRouter } from "./subject-router";
import { materialRouter } from "./material-router";
import { simulationRouter } from "./simulation-router";
import { attemptRouter } from "./attempt-router";
import { creditRouter } from "./credit-router";
import { adminRouter } from "./admin-router";
import { adminMaterialRouter } from "./admin-material-router";
import { createRouter, publicQuery } from "./middleware";

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
