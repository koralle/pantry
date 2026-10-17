/**
 * 戻り先はアプリ内 path に限定する。`//example.com` のような
 * protocol-relative URL も外部へ抜けるので拒否する。
 */
export const isInternalPath = (path: string): boolean =>
  path.startsWith("/") && !path.startsWith("//");
