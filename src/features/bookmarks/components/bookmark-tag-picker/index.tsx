import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { StyledButton } from "../../../../shared/components/styled-button";
import {
  fieldErr,
  fieldGroup,
  flabel,
  tagInputBox,
} from "../../../../shared/styles/form-screen";
import type { NamedTag, TagCandidate } from "./lib";
import { TagPickerPanel } from "./panel";
import { SelectedTagChips } from "./selected-chips";
import {
  backdrop,
  dialog,
  dialogBody,
  dialogHeader,
  dialogTitle,
  statusMessage,
  trigger,
} from "./styles";

export type { TagCandidate } from "./lib";

interface BookmarkTagPickerProps {
  readonly selectedTags: readonly NamedTag[];
  readonly tagCandidates: readonly TagCandidate[];
  readonly tagsReady: boolean;
  readonly onToggleTag: (tag: NamedTag) => void;
  readonly onRemoveTag: (tag: NamedTag) => void;
  readonly onCreateTag: (name: string) => void;
  readonly isCreatingTag: boolean;
  readonly lastCreatedTagId: number | null;
  readonly createError: string | null;
  readonly serverError: string | undefined;
}

/**
 * タグの選択と作成を1つの Modal で扱う。dismiss（外側クリック・Escape）と
 * フォーカスの復帰は RAC に任せ、見た目だけ md 以上で中央ダイアログへ変える。
 */
export const BookmarkTagPicker = ({
  selectedTags,
  tagCandidates,
  tagsReady,
  onToggleTag,
  onRemoveTag,
  onCreateTag,
  isCreatingTag,
  lastCreatedTagId,
  createError,
  serverError,
}: BookmarkTagPickerProps) => {
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const closePicker = () => {
    setPickerOpen(false);
    setQuery("");
  };

  const handleCreateTag = (name: string) => {
    closePicker();
    onCreateTag(name);
  };

  // タグ作成が確定したら入力を空へ戻す。render 中の state 調整で
  // prop 変化へ同期する（effect による「描画後の追従」を避ける）。
  const [seenCreatedId, setSeenCreatedId] = useState(lastCreatedTagId);
  if (seenCreatedId !== lastCreatedTagId) {
    setSeenCreatedId(lastCreatedTagId);
    setQuery("");
  }

  const fieldErrorMessage = serverError ?? createError;
  const describedBy = [
    isCreatingTag ? "bookmark-tag-creating" : null,
    fieldErrorMessage !== null && fieldErrorMessage !== undefined
      ? "bookmark-tag-error"
      : null,
  ]
    .filter((id): id is string => id !== null)
    .join(" ");

  return (
    <fieldset
      className={fieldGroup}
      aria-describedby={describedBy === "" ? undefined : describedBy}
      aria-busy={isCreatingTag || undefined}
    >
      <legend className={flabel}>タグ</legend>
      <div
        className={tagInputBox({
          invalid:
            fieldErrorMessage !== null && fieldErrorMessage !== undefined,
        })}
      >
        <SelectedTagChips
          selectedTags={selectedTags}
          onRemoveTag={onRemoveTag}
        />
        <DialogTrigger
          isOpen={pickerOpen}
          onOpenChange={(open) => {
            if (open) {
              setPickerOpen(true);
              return;
            }
            closePicker();
          }}
        >
          <Button className={trigger}>タグを追加</Button>
          <ModalOverlay className={backdrop} isDismissable>
            <Modal className={dialog}>
              <Dialog className={dialogBody}>
                <div className={dialogHeader}>
                  <Heading slot="title" className={dialogTitle}>
                    タグを選ぶ
                  </Heading>
                  <StyledButton slot="close">完了</StyledButton>
                </div>
                <TagPickerPanel
                  tagCandidates={tagCandidates}
                  selectedTags={selectedTags}
                  query={query}
                  onQueryChange={setQuery}
                  onToggleTag={(tag) => {
                    onToggleTag(tag);
                    closePicker();
                  }}
                  onCreateTag={handleCreateTag}
                  tagsReady={tagsReady}
                  isCreatingTag={isCreatingTag}
                  onRequestClose={closePicker}
                />
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>
      </div>
      {isCreatingTag ? (
        <output id="bookmark-tag-creating" className={statusMessage}>
          タグを作成中です。完了するまで保存を開始できません。
        </output>
      ) : null}
      {fieldErrorMessage !== undefined &&
      fieldErrorMessage !== null &&
      fieldErrorMessage !== "" ? (
        <p id="bookmark-tag-error" className={fieldErr} role="alert">
          {fieldErrorMessage}
        </p>
      ) : null}
    </fieldset>
  );
};
