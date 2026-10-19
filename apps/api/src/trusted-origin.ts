/**
 * 壊れた設定を「どの Origin とも一致しない」で黙って通さず投げるのは、正規の client は
 * JSON か `Sec-Fetch-Site: same-origin` で通ってしまい、誤りに気付けないまま運用されるため。
 */
export const trustedOriginOf = (url: string | undefined): string => {
  if (url === undefined || url === "") {
    throw new Error("BETTER_AUTH_URL is not set; /rpc cannot verify Origin");
  }
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(
      `BETTER_AUTH_URL must be an http(s) URL; got ${parsed.protocol}`
    );
  }
  return parsed.origin;
};
