import { useRef, useState, useSyncExternalStore } from "react";
import {
  Dialog,
  Heading,
  Input,
  Modal,
  ModalOverlay,
  Popover,
} from "react-aria-components";

import { StyledButton } from "../../../../shared/components/styled-button";
import {
  fieldErr,
  fieldGroup,
  flabel,
  tagInputBox,
  tagInputField,
} from "../../../../styles/form-screen";
import { canOfferCreateTag } from "./lib";
import type { NamedTag, TagCandidate } from "./lib";
import { TagPickerPanel } from "./panel";
import { SelectedTagChips } from "./selected-chips";
import {
  popover,
  sheet,
  sheetBackdrop,
  sheetHeader,
  sheetTitle,
  statusMessage,
} from "./styles";

export type { TagCandidate } from "./lib";

const desktopQuery = "(min-width: 768px)";

const subscribeDesktop = (onStoreChange: () => void): (() => void) => {
  const media = globalThis.matchMedia(desktopQuery);
  media.addEventListener("change", onStoreChange);
  return () => {
    media.removeEventListener("change", onStoreChange);
  };
};

const candidatesListId = "bookmark-tag-candidates";

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
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLElement | null>(null);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => globalThis.matchMedia(desktopQuery).matches,
    () => true
  );

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

  const canCreate = canOfferCreateTag({
    query,
    tags: tagCandidates,
    tagsReady,
  });

  const closePicker = () => {
    setPickerOpen(false);
    setQuery("");
  };

  const panel = (
    <TagPickerPanel
      tagCandidates={tagCandidates}
      selectedTags={selectedTags}
      query={query}
      onQueryChange={setQuery}
      onToggleTag={onToggleTag}
      onCreateTag={onCreateTag}
      tagsReady={tagsReady}
      isCreatingTag={isCreatingTag}
      listMaxHeight={isDesktop ? "popover" : "sheet"}
      hideSearch={isDesktop}
      listId={candidatesListId}
    />
  );

  return (
    <fieldset
      className={fieldGroup}
      aria-describedby={describedBy === "" ? undefined : describedBy}
      aria-busy={isCreatingTag || undefined}
    >
      <legend className={flabel}>タグ</legend>
      <div
        ref={boxRef}
        className={tagInputBox({
          invalid:
            fieldErrorMessage !== null && fieldErrorMessage !== undefined,
        })}
      >
        <SelectedTagChips
          selectedTags={selectedTags}
          onRemoveTag={onRemoveTag}
        />
        <Input
          ref={inputRef}
          type="search"
          className={tagInputField}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            if (!pickerOpen) {
              setPickerOpen(true);
            }
          }}
          onFocus={() => {
            setPickerOpen(true);
          }}
          readOnly={!isDesktop}
          placeholder={selectedTags.length === 0 ? "タグを追加" : ""}
          aria-label="タグを検索・追加"
          aria-expanded={pickerOpen}
          aria-controls={candidatesListId}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (canCreate) {
                onCreateTag(query);
              }
              return;
            }
            if (event.key === "Escape" && pickerOpen) {
              event.preventDefault();
              event.stopPropagation();
              closePicker();
              return;
            }
            if (event.key === "ArrowDown" && pickerOpen) {
              event.preventDefault();
              popoverRef.current
                ?.querySelector<HTMLElement>('[role="option"]')
                ?.focus();
            }
          }}
        />
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
      {isDesktop ? (
        <Popover
          ref={popoverRef}
          isOpen={pickerOpen}
          onOpenChange={(open) => {
            if (!open) {
              closePicker();
            }
          }}
          shouldCloseOnInteractOutside={(element) =>
            !(boxRef.current?.contains(element) ?? false)
          }
          triggerRef={boxRef}
          placement="bottom start"
          offset={4}
          className={popover}
          isNonModal
        >
          <div>{panel}</div>
        </Popover>
      ) : (
        <ModalOverlay
          isDismissable
          isOpen={pickerOpen}
          onOpenChange={(open) => {
            if (!open) {
              closePicker();
            }
          }}
          className={sheetBackdrop}
        >
          <Modal className={sheet}>
            <Dialog>
              <div className={sheetHeader}>
                <Heading slot="title" className={sheetTitle}>
                  タグを選ぶ
                </Heading>
                <StyledButton slot="close" type="button">
                  完了
                </StyledButton>
              </div>
              {panel}
            </Dialog>
          </Modal>
        </ModalOverlay>
      )}
    </fieldset>
  );
};
