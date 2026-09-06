export type ListLayout = "table" | "card";

const STORAGE_KEY = "pantry:listLayout:v1";

export const readListLayout = (): ListLayout => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "table" || value === "card") {
      return value;
    }
  } catch {
    // Ignore storage failures (private mode, SSR)
  }
  return "table";
};

export const writeListLayout = (layout: ListLayout): void => {
  try {
    localStorage.setItem(STORAGE_KEY, layout);
  } catch {
    // Ignore storage failures
  }
};
