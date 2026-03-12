import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export type AppErrorCode =
  | "CURSOR_MISMATCH"
  | "INTERNAL_ERROR"
  | "INVALID_CURSOR"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "URL_CONFLICT";

export interface AppErrorShape {
  error: {
    code: AppErrorCode;
    message: string;
    details?: string[];
  };
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details: string[] | undefined;
  readonly status: number;

  constructor(status: number, code: AppErrorCode, message: string, details?: string[]) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const isAppErrorCode = (value: string): value is AppErrorCode => {
  return [
    "CURSOR_MISMATCH",
    "INTERNAL_ERROR",
    "INVALID_CURSOR",
    "INVALID_INPUT",
    "NOT_FOUND",
    "UNAUTHORIZED",
    "URL_CONFLICT",
  ].includes(value);
};

const badRequestFromZodError = (error: ZodError): AppError => {
  const details = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "input";
    return `${path}: ${issue.message}`;
  });

  return new AppError(400, "INVALID_INPUT", "Invalid input", details);
};

const fromHttpException = (error: HTTPException): AppError => {
  const code = isAppErrorCode(error.message) ? error.message : "INTERNAL_ERROR";
  const status = error.status;

  if (status === 400 && code === "INTERNAL_ERROR") {
    return new AppError(400, "INVALID_INPUT", "Invalid input");
  }

  if (status === 404 && code === "INTERNAL_ERROR") {
    return new AppError(404, "NOT_FOUND", "Resource not found");
  }

  if (status === 409 && code === "INTERNAL_ERROR") {
    return new AppError(409, "URL_CONFLICT", "Bookmark URL already exists");
  }

  if (status === 401 && code === "INTERNAL_ERROR") {
    return new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  if (status >= 400 && status < 500) {
    const message =
      code === "INVALID_INPUT"
        ? "Invalid input"
        : code === "NOT_FOUND"
          ? "Resource not found"
          : code === "URL_CONFLICT"
            ? "Bookmark URL already exists"
            : code === "UNAUTHORIZED"
              ? "Unauthorized"
              : error.message;
    return new AppError(status, code, message);
  }

  return new AppError(500, "INTERNAL_ERROR", "Internal server error");
};

export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return badRequestFromZodError(error);
  }

  if (error instanceof HTTPException) {
    return fromHttpException(error);
  }

  return new AppError(500, "INTERNAL_ERROR", "Internal server error");
};

export const toErrorResponse = (error: AppError): AppErrorShape => ({
  error: {
    code: error.code,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
  },
});

export const badRequest = (message: string, details?: string[]) =>
  new AppError(400, "INVALID_INPUT", message, details);

export const invalidCursor = (message = "Cursor pagination is not implemented") =>
  new AppError(400, "INVALID_CURSOR", message);

export const notFound = (message = "Resource not found") =>
  new AppError(404, "NOT_FOUND", message);

export const unauthorized = (message = "Unauthorized") =>
  new AppError(401, "UNAUTHORIZED", message);

export const urlConflict = (message = "Bookmark URL already exists") =>
  new AppError(409, "URL_CONFLICT", message);
