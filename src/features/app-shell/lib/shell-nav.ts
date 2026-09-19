/**
 * Navigation model shared by the top bar, rail, and bottom tabs.
 * `view` mirrors the rail destinations in the approved shell spec.
 */
export type ShellView = "recent" | "inbox" | "favorites" | "tags" | "account";

export interface ShellTag {
  id: string;
  name: string;
  color?: string | null;
  count: number;
}

export interface ShellCounts {
  recent?: number;
  inbox?: number;
  favorites?: number;
}
