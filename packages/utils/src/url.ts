/**
 * 一覧・詳細のメタ表示に出すホスト名。パースできない入力はそのまま返し、
 * 表示側で空欄にならないようにする。
 */
export const domainOf = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};
