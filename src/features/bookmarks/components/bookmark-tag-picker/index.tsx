import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
} from "../../../../shared/styles/form-screen";
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
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // FocusScope が閉じたピッカーから入力欄へ戻すフォーカスで onFocus が
  // 開き直すのを抑止するフラグ。closePicker 後の rAF 2回で解除する。
  const suppressFocusOpenRef = useRef(false);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => globalThis.matchMedia(desktopQuery).matches,
    () => true
  );

  // ピッカー内にフォーカスがある状態で閉じると FocusScope がフォーカスを入力欄へ
  // 戻し、その onFocus でピッカーが開き直される。先に入力欄へ戻せれば復帰自体が
  // 走らないが、モーダルの contain に阻まれる場合は復帰の onFocus をフラグで抑止する。
  const closePicker = useCallback(() => {
    suppressFocusOpenRef.current = true;
    if (overlayRef.current?.contains(document.activeElement) ?? false) {
      inputRef.current?.focus();
    }
    setPickerOpen(false);
    setQuery("");
    // 復帰が走らない経路ではフラグが残るので、復帰の rAF より後で解除する
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        suppressFocusOpenRef.current = false;
      });
    });
  }, []);

  // isNonModal の Popover は外側操作で閉じない（isDismissable 無効）ため、
  // ピッカー外へのポインター操作とフォーカス移動を自前で検知して閉じる。
  useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const isInsidePicker = (target: EventTarget | null): boolean =>
      target instanceof Node &&
      ((boxRef.current?.contains(target) ?? false) ||
        (overlayRef.current?.contains(target) ?? false));
    const onPointerDown = (event: PointerEvent) => {
      if (!isInsidePicker(event.target)) {
        closePicker();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!isInsidePicker(event.target)) {
        closePicker();
      }
    };
    // isNonModal では Escape がオーバレイの onOpenChange に届かない（実測）ため
    // ピッカー内では自前で閉じる。キーイベントは filterDOMProps で落とされるので
    // JSX の onKeyDown ではなくネイティブリスナーで拾う。IME 変換中の Escape は
    // 変換キャンセルなのでピッカーは閉じない。
    const overlay = overlayRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        closePicker();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    overlay?.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      overlay?.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen, closePicker]);

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

  const canCreate = canOfferCreateTag({
    query,
    tags: tagCandidates,
    tagsReady,
  });

  const panel = (
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
            // フラグは rAF でしか解除しない（消費しない）。inert 非対応の環境では
            // 事前の focus() が通り contain がフォーカスを戻し、復帰の onFocus が
            // 再度来る経路があるため。
            if (!suppressFocusOpenRef.current) {
              setPickerOpen(true);
            }
          }}
          onClick={() => {
            setPickerOpen(true);
          }}
          readOnly={!isDesktop}
          placeholder={selectedTags.length === 0 ? "タグを入力…" : ""}
          aria-label="タグを検索・追加"
          aria-expanded={pickerOpen}
          aria-controls={candidatesListId}
          onKeyDown={(event) => {
            // IME 変換中の Enter/Escape/ArrowDown は変換操作なので素通しする
            if (event.nativeEvent.isComposing) {
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (canCreate) {
                handleCreateTag(query);
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
              overlayRef.current
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
          ref={overlayRef}
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
          <Modal className={sheet} ref={overlayRef}>
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
