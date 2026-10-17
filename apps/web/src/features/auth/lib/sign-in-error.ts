import { ErrorFactory } from "@praha/error-factory";

export class SignInError extends ErrorFactory({
  fields: ErrorFactory.fields<{
    status: number;
    statusText: string;
    code?: string | undefined;
  }>(),
  message: "Failed to authentication",
  name: "SignInError",
}) {}
