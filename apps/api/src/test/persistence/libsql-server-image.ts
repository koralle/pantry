/**
 * ローカル開発と同じ server で確かめるため Dockerfile と同じ digest にする。
 * platform を固定しないのは、別アーキテクチャの host でエミュレーションにしないため。
 */
export const LIBSQL_SERVER_IMAGE =
  "ghcr.io/tursodatabase/libsql-server@sha256:817fb6c6865d048a509f5c120905629fb9b5af20ad0c526cdc68a6d8793898ad";
