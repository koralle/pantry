import { Hono } from "hono";
import type { AppDependencies, AppDependencyFactory, AppEnv } from "./dependencies";
import { notFound, toAppError, toErrorResponse } from "./errors/appError";
import routes from "./generated/routes";
import { withDependencies } from "./middlewares/withDependencies";

export const createApp = (dependencies: AppDependencies | AppDependencyFactory) => {
  const app = new Hono<AppEnv>();

  app.use("*", withDependencies(dependencies));
  app.route("/", routes);

  app.notFound((_c) => {
    const error = notFound();
    return new Response(JSON.stringify(toErrorResponse(error)), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  app.onError((error, _c) => {
    const appError = toAppError(error);
    return new Response(JSON.stringify(toErrorResponse(appError)), {
      status: appError.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  return app;
};
