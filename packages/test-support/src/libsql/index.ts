import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

/**
 * ローカル開発 Dockerfile と同じ digest。platform は固定せず、
 * 実行ホストのアーキテクチャで pull する。
 */
const LIBSQL_SERVER_IMAGE =
  "ghcr.io/tursodatabase/libsql-server@sha256:817fb6c6865d048a509f5c120905629fb9b5af20ad0c526cdc68a6d8793898ad";

const LIBSQL_HTTP_PORT = 8080;

interface LibsqlServer {
  readonly container: StartedTestContainer;
  readonly url: string;
}

/**
 * DB テストの globalSetup 用に libSQL server を 1 つ起動する。
 * 本番 migration の適用はテスト側に任せ、ここでは接続先だけを返す。
 */
export const startLibsqlServer = async (): Promise<LibsqlServer> => {
  const container = await new GenericContainer(LIBSQL_SERVER_IMAGE)
    .withExposedPorts(LIBSQL_HTTP_PORT)
    .withTmpFs({ "/var/lib/sqld": "rw,noexec,nosuid,size=64m" })
    .withWaitStrategy(Wait.forHttp("/v2", LIBSQL_HTTP_PORT))
    .withStartupTimeout(120_000)
    .start();

  return {
    container,
    url: `http://${container.getHost()}:${container.getMappedPort(LIBSQL_HTTP_PORT)}`,
  };
};
