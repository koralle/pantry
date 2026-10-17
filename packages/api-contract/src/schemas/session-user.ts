import * as v from "valibot";

/**
 * サインイン済みユーザーの wire 表現。
 * oRPC の output と認証 port の戻り値が同じ形を共有する。
 */
export const sessionUserSchema = v.object({
  email: v.string(),
  id: v.string(),
  name: v.string(),
});

export type SessionUser = v.InferOutput<typeof sessionUserSchema>;
