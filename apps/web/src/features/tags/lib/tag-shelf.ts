export type { ShelfTag } from "@pantry/api-contract/schemas/tag-procedures";

const compareName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name);

export const sortTagsForNav = <
  T extends { pinned: boolean; sortOrder: number; name: string },
>(
  tags: readonly T[]
): T[] =>
  [...tags].toSorted((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return compareName(a, b);
  });
