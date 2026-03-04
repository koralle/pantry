import { Hono } from "hono";
import routes from "./generated/routes";
import type { AppDependencies, AppEnv } from "./dependencies";
import { withDependencies } from "./middlewares/withDependencies";

export const createApp = (dependencies: AppDependencies) => {
  const app = new Hono<AppEnv>();

  app.use("*", withDependencies(dependencies));
  app.route("/", routes);

  return app;
};
