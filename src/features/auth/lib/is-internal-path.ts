/**
 * 戻り先はアプリ内 path に限定する。`//example.com` のような
 * protocol-relative URL も外部へ抜けるので拒否する。
 */
export function isInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//')
}
