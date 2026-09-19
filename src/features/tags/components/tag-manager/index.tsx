/**
 * @file index.tsx
 *
 * Input:    ShelfTag 一覧、create/rename/delete の action、行タップ先の一覧検索
 * Output:   TagManagerScreen（行一覧 + 検索 + 3 種のダイアログ）、TagManagerSkeleton
 * Position: /tags の画面本体。データ取得は route が担い、ここは resolved な tags を受ける。
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx
 * - ../../../../styles/tags.ts
 * - ../../../../routes/_protected/tags/index.tsx
 */

import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  SearchX,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  Text,
} from "react-aria-components";
import { css } from "styled-system/css";
import * as v from "valibot";

import { IconButton } from "../../../../shared/components/icon-button";
import { StateView } from "../../../../shared/components/state-view";
import { StyledButton } from "../../../../shared/components/styled-button";
import { StyledInput } from "../../../../shared/components/styled-input";
import { TagDot } from "../../../../shared/components/tag-chip";
import {
  dialog,
  dialogActions,
  dialogBackdrop,
  dialogDescription,
  dialogError,
  dialogField,
  dialogTitle,
} from "../../../../styles/dialog";
import { toneFor } from "../../../../styles/domain-tone";
import { spinner, skeletonBar } from "../../../../styles/feedback";
import {
  tagDialogLabel,
  tagRow,
  tagRowChevron,
  tagRowCount,
  tagRowLink,
  tagRowList,
  tagRowName,
  tagRowOps,
  tagRowSkeleton,
  tagSearchBox,
  tagSearchIcon,
  tagSearchInput,
  tagsCount,
  tagsHeadCreate,
  tagsHeadCreateMobile,
  tagsHeadRow,
  tagsLoadingNote,
  tagsPage,
  tagsPageInner,
  tagsTitle,
} from "../../../../styles/tags";
import { tagShelfSearch } from "../../../navigation/lib/bookmark-search-builders";
import { tagNameSchema } from "../../lib/tag-name-schema";
import type { ShelfTag } from "../../lib/tag-shelf";
import { sortTagsForNav } from "../../lib/tag-shelf";

/**
 * `message` が null のときは UNAUTHORIZED。sign-in への redirect が進行中なので
 * ダイアログ側はエラーを表示しない（フォーム画面と同じ契約）。
 */
export type TagActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string | null };

export interface TagManagerScreenProps {
  readonly tags: readonly ShelfTag[];
  readonly onCreateTag: (name: string) => Promise<TagActionResult>;
  readonly onRenameTag: (
    tag: ShelfTag,
    name: string
  ) => Promise<TagActionResult>;
  readonly onDeleteTag: (tag: ShelfTag) => Promise<TagActionResult>;
}

type TagDialogState =
  | { readonly kind: "create" }
  | { readonly kind: "rename"; readonly tag: ShelfTag }
  | { readonly kind: "delete"; readonly tag: ShelfTag }
  | null;

const filterTags = (tags: readonly ShelfTag[], query: string): ShelfTag[] => {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") {
    return sortTagsForNav(tags);
  }
  return sortTagsForNav(
    tags.filter((tag) => tag.name.toLowerCase().includes(normalized))
  );
};

export const TagManagerScreen = ({
  tags,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
}: TagManagerScreenProps) => {
  const [query, setQuery] = useState("");
  const [tagDialog, setTagDialog] = useState<TagDialogState>(null);

  const filtered = filterTags(tags, query);
  const openCreate = () => {
    setTagDialog({ kind: "create" });
  };

  if (tags.length === 0) {
    return (
      <div className={tagsPage}>
        <StateView
          className={tagsEmptyCenter}
          icon={Tag}
          title="タグはまだありません"
          description="ブックマーク登録時のタグ入力でも作れますが、ここから先に作っておくこともできます。"
          action={
            <StyledButton visual="accent" size="sm" onPress={openCreate}>
              <Plus size={14} aria-hidden /> タグを作成
            </StyledButton>
          }
        />
        <TagNameDialog
          isOpen={tagDialog?.kind === "create"}
          mode="create"
          onClose={() => {
            setTagDialog(null);
          }}
          onSubmit={onCreateTag}
        />
      </div>
    );
  }

  return (
    <div className={tagsPage}>
      <div className={tagsPageInner}>
        <div className={tagsHeadRow}>
          <h1 className={tagsTitle}>タグ</h1>
          <span className={tagsCount}>{tags.length} 件</span>
          <StyledButton
            className={tagsHeadCreate}
            onPress={openCreate}
            size="sm"
            visual="accent"
          >
            <Plus size={14} aria-hidden /> 新規タグ
          </StyledButton>
          <IconButton
            aria-label="新規タグ"
            className={tagsHeadCreateMobile}
            onPress={openCreate}
          >
            <Plus size={16} aria-hidden />
          </IconButton>
        </div>

        <div className={tagSearchBox}>
          <Search aria-hidden className={tagSearchIcon} size={14} />
          <input
            aria-label="タグを検索"
            className={tagSearchInput}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="タグを検索…"
            type="search"
            value={query}
          />
          {query === "" ? null : (
            <IconButton
              aria-label="検索をクリア"
              onPress={() => {
                setQuery("");
              }}
              size="sm"
            >
              <X aria-hidden size={12} />
            </IconButton>
          )}
        </div>

        {filtered.length === 0 ? (
          <StateView
            icon={SearchX}
            title="見つかりませんでした"
            description="検索条件を変えてみてください"
          />
        ) : (
          <div className={tagRowList}>
            {filtered.map((tag) => (
              <div className={tagRow} key={tag.id}>
                <Link
                  className={tagRowLink}
                  search={tagShelfSearch(tag.name)}
                  to="/bookmarks"
                >
                  <TagDot color={tag.color} tone={toneFor(tag.name)} />
                  <span className={tagRowName}>{tag.name}</span>
                  <span className={tagRowCount}>{tag.bookmarkCount} 件</span>
                  <ChevronRight
                    aria-hidden
                    className={tagRowChevron}
                    size={14}
                  />
                </Link>
                <span className={tagRowOps}>
                  <IconButton
                    aria-label={`「${tag.name}」を改名`}
                    onPress={() => {
                      setTagDialog({ kind: "rename", tag });
                    }}
                    size="sm"
                  >
                    <Pencil aria-hidden size={14} />
                  </IconButton>
                  <IconButton
                    aria-label={`「${tag.name}」を削除`}
                    onPress={() => {
                      setTagDialog({ kind: "delete", tag });
                    }}
                    size="sm"
                    tone="danger"
                  >
                    <Trash2 aria-hidden size={14} />
                  </IconButton>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <TagNameDialog
        isOpen={tagDialog?.kind === "create"}
        mode="create"
        onClose={() => {
          setTagDialog(null);
        }}
        onSubmit={onCreateTag}
      />
      <TagNameDialog
        initialName={tagDialog?.kind === "rename" ? tagDialog.tag.name : ""}
        isOpen={tagDialog?.kind === "rename"}
        mode="rename"
        onClose={() => {
          setTagDialog(null);
        }}
        onSubmit={async (name) =>
          tagDialog?.kind === "rename"
            ? await onRenameTag(tagDialog.tag, name)
            : { ok: true }
        }
      />
      <TagDeleteDialog
        isOpen={tagDialog?.kind === "delete"}
        onClose={() => {
          setTagDialog(null);
        }}
        onDelete={onDeleteTag}
        tag={tagDialog?.kind === "delete" ? tagDialog.tag : null}
      />
    </div>
  );
};

/**
 * 作成と改名は同一の名前フォームを共有する。フォームの state は Modal の内側に
 * 置き、Modal が閉じて unmount するたびに初期値へ戻る（effect での後追いリセットなし）。
 */
const TagNameDialog = ({
  initialName = "",
  isOpen,
  mode,
  onClose,
  onSubmit,
}: {
  readonly initialName?: string;
  readonly isOpen: boolean;
  readonly mode: "create" | "rename";
  readonly onClose: () => void;
  readonly onSubmit: (name: string) => Promise<TagActionResult>;
}) => {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <ModalOverlay
      className={dialogBackdrop}
      isDismissable={!isSaving}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Modal className={dialog}>
        <Dialog>
          <Heading className={dialogTitle} slot="title">
            {mode === "create" ? "新規タグ" : "タグ名を変更"}
          </Heading>
          <TagNameForm
            initialName={initialName}
            mode={mode}
            onClose={onClose}
            onSavingChange={setIsSaving}
            onSubmit={onSubmit}
          />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

const TagNameForm = ({
  initialName,
  mode,
  onClose,
  onSavingChange,
  onSubmit,
}: {
  readonly initialName: string;
  readonly mode: "create" | "rename";
  readonly onClose: () => void;
  readonly onSavingChange: (saving: boolean) => void;
  readonly onSubmit: (name: string) => Promise<TagActionResult>;
}) => {
  const [draft, setDraft] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = v.safeParse(tagNameSchema, draft);
    if (!parsed.success) {
      setError(parsed.issues[0]?.message ?? "タグ名を入力してください");
      return;
    }
    onSavingChange(true);
    startSaveTransition(async () => {
      const result = await onSubmit(parsed.output.display);
      onSavingChange(false);
      if (result.ok) {
        onClose();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <form noValidate onSubmit={submit}>
      <div className={dialogField}>
        <label className={tagDialogLabel} htmlFor="tag-name-input">
          タグ名
        </label>
        <StyledInput
          id="tag-name-input"
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          value={draft}
        />
      </div>
      {error ? (
        <p className={dialogError} role="alert">
          <CircleAlert aria-hidden size={12} /> {error}
        </p>
      ) : null}
      <div className={dialogActions}>
        <StyledButton
          isDisabled={isSaving}
          onPress={onClose}
          size="sm"
          type="button"
        >
          キャンセル
        </StyledButton>
        <StyledButton
          isPending={isSaving}
          size="sm"
          type="submit"
          visual="accent"
        >
          {isSaving ? (
            <LoaderCircle aria-hidden className={spinner} size={14} />
          ) : (
            <Check aria-hidden size={14} />
          )}
          {mode === "create" ? "作成" : "保存"}
        </StyledButton>
      </div>
    </form>
  );
};

const TagDeleteDialog = ({
  isOpen,
  onClose,
  onDelete,
  tag,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDelete: (tag: ShelfTag) => Promise<TagActionResult>;
  readonly tag: ShelfTag | null;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <ModalOverlay
      className={dialogBackdrop}
      isDismissable={!isDeleting}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Modal className={dialog}>
        <Dialog>
          {tag === null ? null : (
            <TagDeleteConfirm
              onClose={onClose}
              onDeletingChange={setIsDeleting}
              onDelete={onDelete}
              tag={tag}
            />
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

const TagDeleteConfirm = ({
  onClose,
  onDelete,
  onDeletingChange,
  tag,
}: {
  readonly onClose: () => void;
  readonly onDelete: (tag: ShelfTag) => Promise<TagActionResult>;
  readonly onDeletingChange: (deleting: boolean) => void;
  readonly tag: ShelfTag;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const confirm = () => {
    onDeletingChange(true);
    startDeleteTransition(async () => {
      const result = await onDelete(tag);
      onDeletingChange(false);
      if (result.ok) {
        onClose();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <>
      <Heading className={dialogTitle} slot="title">
        「{tag.name}」を削除しますか？
      </Heading>
      <Text className={dialogDescription} slot="description">
        {tag.bookmarkCount > 0
          ? `このタグが付いている ${tag.bookmarkCount} 件のブックマークからも外れます。`
          : "このタグが付いているブックマークからも外れます。"}
      </Text>
      {error ? (
        <p className={dialogError} role="alert">
          <CircleAlert aria-hidden size={12} /> {error}
        </p>
      ) : null}
      <div className={dialogActions}>
        <StyledButton
          isDisabled={isDeleting}
          onPress={onClose}
          size="sm"
          type="button"
        >
          キャンセル
        </StyledButton>
        <StyledButton
          isPending={isDeleting}
          onPress={confirm}
          size="sm"
          visual="danger"
        >
          <Trash2 aria-hidden size={14} /> 削除
        </StyledButton>
      </div>
    </>
  );
};

const tagsEmptyCenter = css({
  flex: "1",
});

/** Suspense fallback。head row の spinner + 行スケルトンはモックの Loading 状態。 */
export const TagManagerSkeleton = () => (
  <div className={tagsPage}>
    <div className={tagsPageInner}>
      <div className={tagsHeadRow}>
        <h1 className={tagsTitle}>タグ</h1>
        <span className={tagsLoadingNote}>
          <LoaderCircle aria-hidden className={spinner} size={12} />
          読み込み中…
        </span>
      </div>
      <div className={tagRowList}>
        {[90, 120, 70, 100].map((width) => (
          <div className={tagRowSkeleton} key={width}>
            <span
              className={skeletonBar}
              style={{ blockSize: "0.625rem", inlineSize: "0.625rem" }}
            />
            <span
              className={skeletonBar}
              style={{ blockSize: "0.75rem", inlineSize: `${width}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);
