import type { ZodType } from "zod";
import { badRequest } from "../errors/appError";

export const validateWithSchema = <T>(schema: ZodType<T>, input: unknown): T => {
  return schema.parse(input);
};

export const parseJson = async (request: Request): Promise<unknown> => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }

  return payload;
};

export const trimToUndefined = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const coerceOptionalInt = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value.trim() === "") {
    throw badRequest("Invalid input", ["limit: Expected a number"]);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw badRequest("Invalid input", ["limit: Expected an integer"]);
  }

  return parsed;
};

export const bookmarkIdSchema = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
