import { authRouter } from "./auth-router.js";
import { subjectRouter } from "./subject-router.js";
import { materialRouter } from "./material-router.js";
import { simulationRouter } from "./simulation-router.js";
import { attemptRouter } from "./attempt-router.js";
import { creditRouter } from "./credit-router.js";
import { adminRouter } from "./admin-router.js";
import { adminMaterialRouter } from "./admin-material-router.js";
import { createRouter, publicQuery } from "./middleware.js";

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
