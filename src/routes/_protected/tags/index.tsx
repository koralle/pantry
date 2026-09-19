import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  getRouteApi,
  useRouter,
} from "@tanstack/react-router";
import { RotateCcw, WifiOff } from "lucide-react";
import { Suspense, use } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { FallbackProps } from "react-error-boundary";

import {
  TagManagerScreen,
  TagManagerSkeleton,
} from "../../../features/tags/components/tag-manager";
import { getCreateTagErrorMessage } from "../../../features/tags/lib/get-create-tag-error-message";
import { getDeleteTagErrorMessage } from "../../../features/tags/lib/get-delete-tag-error-message";
import { getUpdateTagErrorMessage } from "../../../features/tags/lib/get-update-tag-error-message";
import { refreshAfterCreateTag } from "../../../features/tags/lib/refresh-after-create-tag";
import { refreshAfterDeleteTag } from "../../../features/tags/lib/refresh-after-delete-tag";
import { refreshAfterUpdateTag } from "../../../features/tags/lib/refresh-after-update-tag";
import type { ShelfTag } from "../../../features/tags/lib/tag-shelf";
import { orpc } from "../../../rpc/query";
import { StateView } from "../../../shared/components/state-view";
import { StyledButton } from "../../../shared/components/styled-button";
import { detailCenter } from "../../../styles/detail";
import { tagsPage } from "../../../styles/tags";

const protectedRouteApi = getRouteApi("/_protected");

export const Route = createFileRoute("/_protected/tags/")({
  component: RouteComponent,
});

function TagsError({ resetErrorBoundary }: FallbackProps) {
  const router = useRouter();
  return (
    <div className={tagsPage}>
      <div className={detailCenter}>
        <StateView
          action={
            <StyledButton
              onPress={() => {
                void router.invalidate().finally(() => {
                  resetErrorBoundary();
                });
              }}
              size="sm"
              visual="accent"
            >
              <RotateCcw aria-hidden size={14} /> 再試行
            </StyledButton>
          }
          description="ネットワーク接続を確認して、もう一度お試しください。"
          icon={WifiOff}
          title="読み込みに失敗しました"
          tone="danger"
        />
      </div>
    </div>
  );
}

function RouteComponent() {
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData();

  return (
    <ErrorBoundary FallbackComponent={TagsError}>
      <Suspense fallback={<TagManagerSkeleton />}>
        <TagManagerResolved tagPromise={shelfTagsPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}

function TagManagerResolved({
  tagPromise,
}: {
  readonly tagPromise: Promise<ShelfTag[]>;
}) {
  const tags = use(tagPromise);
  const router = useRouter();

  const createMutation = useMutation(
    orpc.tags.create.mutationOptions({
      onSuccess: () => {
        refreshAfterCreateTag(router);
      },
    })
  );
  const updateMutation = useMutation(
    orpc.tags.update.mutationOptions({
      onSuccess: () => {
        refreshAfterUpdateTag(router);
      },
    })
  );
  const deleteMutation = useMutation(
    orpc.tags.delete.mutationOptions({
      onSuccess: () => {
        refreshAfterDeleteTag(router);
      },
    })
  );

  return (
    <TagManagerScreen
      onCreateTag={async (name) => {
        try {
          await createMutation.mutateAsync({ name });
          return { ok: true };
        } catch (error) {
          return { message: getCreateTagErrorMessage(error), ok: false };
        }
      }}
      onDeleteTag={async (tag) => {
        try {
          await deleteMutation.mutateAsync({ id: tag.id });
          return { ok: true };
        } catch (error) {
          return { message: getDeleteTagErrorMessage(error), ok: false };
        }
      }}
      onRenameTag={async (tag, name) => {
        try {
          await updateMutation.mutateAsync({
            color: tag.color,
            id: tag.id,
            name,
            pinned: tag.pinned,
            sortOrder: tag.sortOrder,
          });
          return { ok: true };
        } catch (error) {
          return { message: getUpdateTagErrorMessage(error), ok: false };
        }
      }}
      tags={tags}
    />
  );
}
