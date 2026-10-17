import * as v from "valibot";

/** サインイン済みユーザーの ID。所有者で絞る query は必ずこの型で受ける。 */
export const userIdSchema = v.pipe(v.string(), v.nonEmpty(), v.brand("UserId"));

export type UserId = v.InferOutput<typeof userIdSchema>;
