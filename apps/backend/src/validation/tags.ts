import { z } from "zod";
import { coerceOptionalInt, trimToUndefined, validateWithSchema } from "../http/validation";

const LIMIT_DEFAULT = 10;
const LIMIT_MAX = 20;

const tagsSuggestSchema = z.object({
  q: z.string().min(1),
  limit: z.number().int().min(1).max(LIMIT_MAX).default(LIMIT_DEFAULT),
});

export const parseSuggestTagsQuery = (requestUrl: string) => {
  const url = new URL(requestUrl);
  const searchParams = url.searchParams;
  const q = trimToUndefined(searchParams.get("q") ?? undefined);
  const limit = coerceOptionalInt(searchParams.get("limit") ?? undefined);

  return validateWithSchema(tagsSuggestSchema, {
    q,
    ...(limit === undefined ? {} : { limit }),
  });
};
