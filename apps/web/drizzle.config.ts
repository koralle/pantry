import { defineConfig } from "drizzle-kit";

const { TURSO_AUTH_TOKEN: authToken, TURSO_CONNECTION_URL: connectionUrl } =
  process.env;

if (!connectionUrl) {
  throw new Error("TURSO_CONNECTION_URL is not defined");
}

if (!authToken) {
  throw new Error("TURSO_AUTH_TOKEN is not defined");
}

export default defineConfig({
  dbCredentials: {
    authToken,
    url: connectionUrl,
  },
  dialect: "turso",
  out: "./drizzle",
  schema: "./src/db/schema",
});
