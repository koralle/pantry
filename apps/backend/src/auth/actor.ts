import type { Context } from "hono";
import type { AppEnv } from "../dependencies";

export interface Actor {
  userId: string;
}

export const SINGLE_USER_ID = "single-user";

export const resolveActor = (_c: Context<AppEnv>): Actor => ({
  userId: SINGLE_USER_ID,
});
