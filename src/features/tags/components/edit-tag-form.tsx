import { use } from "react";

import { getUpdateTagErrorMessage } from "../lib/get-update-tag-error-message";
import type { TagRecord } from "../lib/tag-shelf";
import { TagForm } from "./tag-form";

interface EditTagFormProps {
  readonly tagPromise: Promise<TagRecord>;
  readonly submitAction: (input: {
    id: number;
    name: string;
    pinned: boolean;
    color: string | null;
    sortOrder: number;
  }) => Promise<void>;
}

export const EditTagForm = ({ tagPromise, submitAction }: EditTagFormProps) => {
  const tag = use(tagPromise);

  return (
    <TagForm
      initialValues={{
        color: tag.color,
        name: tag.name,
        pinned: tag.pinned,
        sortOrder: tag.sortOrder,
      }}
      legend="タグ編集"
      submitLabel="更新"
      pendingLabel="更新中..."
      onSubmit={async ({ name, pinned, color, sortOrder }) => {
        await submitAction({
          color,
          id: tag.id,
          name,
          pinned,
          sortOrder,
        });
      }}
      mapError={getUpdateTagErrorMessage}
    />
  );
};
