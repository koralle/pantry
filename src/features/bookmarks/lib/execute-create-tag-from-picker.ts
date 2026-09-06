import { ORPCError } from "@orpc/client";

import { toTagName } from "../../tags/domain/tag-values";
import { getCreateTagErrorMessage } from "../../tags/lib/get-create-tag-error-message";
import { resolveCreateTagConflict } from "../components/bookmark-tag-picker/lib";
import type { NamedTag } from "../components/bookmark-tag-picker/lib";

export type CreateTagFromPickerState =
  | { readonly status: "idle" }
  | { readonly status: "created"; readonly tag: NamedTag }
  | { readonly status: "error"; readonly message: string };

interface CreateTagFromPickerPayload {
  readonly name: string;
}

export type CreateTagFromPickerAction = (
  previousState: CreateTagFromPickerState,
  payload: CreateTagFromPickerPayload
) => Promise<CreateTagFromPickerState>;

const isNameConflict = (error: unknown): boolean =>
  error instanceof ORPCError &&
  error.defined &&
  error.code === "tag-name-already-exists";

export const executeCreateTagFromPicker = async (params: {
  readonly name: string;
  readonly createTag: (name: string) => Promise<{ readonly id: number }>;
  readonly loadTags: () => Promise<readonly NamedTag[]>;
}): Promise<CreateTagFromPickerState> => {
  try {
    const created = await params.createTag(params.name);
    return {
      status: "created",
      tag: { id: created.id, name: toTagName(params.name).display },
    };
  } catch (error: unknown) {
    if (isNameConflict(error)) {
      const existing = resolveCreateTagConflict({
        query: params.name,
        tags: await params.loadTags(),
      });
      if (existing !== null) {
        return { status: "created", tag: existing };
      }
      return { message: "タグの作成に失敗しました", status: "error" };
    }

    const message = getCreateTagErrorMessage(error);
    if (message === null) {
      return { status: "idle" };
    }
    return { message, status: "error" };
  }
};
