import { toTagName } from "@pantry/api-contract/schemas/tag-values";
import { Check, Plus } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef } from "react";
import { ListBox, ListBoxItem, SearchField } from "react-aria-components";

import { StyledButton } from "../../../../shared/components/styled-button";
import { StyledInput } from "../../../../shared/components/styled-input";
import { TagDot } from "../../../../shared/components/tag-chip";
import { toneFor } from "../../../../shared/styles/domain-tone";
import { srOnly } from "../../../../shared/styles/sr-only";
import { sortTagsForNav } from "../../../tags/lib/tag-shelf";
import { canOfferCreateTag, filterTagCandidates } from "./lib";
import type { NamedTag, TagCandidate } from "./lib";
import {
  candidateItem,
  candidateList,
  candidateName,
  candidateState,
  checkSlot,
  emptyState,
  panel,
} from "./styles";

interface TagPickerPanelProps {
  readonly tagCandidates: readonly TagCandidate[];
  readonly selectedTags: readonly NamedTag[];
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly onToggleTag: (tag: NamedTag) => void;
  readonly onCreateTag: (name: string) => void;
  readonly tagsReady: boolean;
  readonly isCreatingTag: boolean;
  readonly onRequestClose: () => void;
}

export const TagPickerPanel = ({
  tagCandidates,
  selectedTags,
  query,
  onQueryChange,
  onToggleTag,
  onCreateTag,
  tagsReady,
  isCreatingTag,
  onRequestClose,
}: TagPickerPanelProps) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastCompositionEndAtRef = useRef<number | null>(null);
  const selectedIds = new Set(selectedTags.map((tag) => tag.id));
  const candidates = filterTagCandidates(sortTagsForNav(tagCandidates), query);
  const canCreate = canOfferCreateTag({
    query,
    tags: tagCandidates,
    tagsReady,
  });

  const isImeComposing = (event: KeyboardEvent<HTMLInputElement>): boolean =>
    event.nativeEvent.isComposing ||
    (lastCompositionEndAtRef.current !== null &&
      Math.abs(event.timeStamp - lastCompositionEndAtRef.current) < 50);

  // ダイアログを開いたら検索欄へフォーカスする。autoFocus 属性は
  // markuplint が許さず、RAC の FocusScope は最初の要素（完了ボタン）を
  // 選ぶため、mount 時に自分で移す（panel は開くたびに mount される）。
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const renderEmpty = () => {
    if (!tagsReady) {
      return <output className={emptyState}>タグ候補を読み込み中です</output>;
    }
    if (canCreate) {
      return null;
    }
    if (query.trim() === "") {
      return <p className={emptyState}>タグはまだありません</p>;
    }
    return <p className={emptyState}>該当するタグはありません</p>;
  };

  return (
    <div className={panel}>
      <SearchField
        value={query}
        onChange={onQueryChange}
        aria-label="タグを検索"
      >
        {/* キー処理は SearchField ではなく input に置く。Escape は RAC の
            SearchField が input 側で握って stopPropagation するため、
            SearchField の onKeyDown には届かない。 */}
        <StyledInput
          ref={inputRef}
          type="search"
          placeholder="タグ名で探す"
          onCompositionEnd={(event) => {
            lastCompositionEndAtRef.current = event.timeStamp;
          }}
          onKeyDown={(event) => {
            // IME 変換中および Safari 確定直後の Enter/Escape/ArrowDown は素通しする
            if (isImeComposing(event)) {
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (canCreate && !isCreatingTag) {
                onCreateTag(query);
              }
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onRequestClose();
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              listRef.current
                ?.querySelector<HTMLElement>('[role="option"]')
                ?.focus();
            }
          }}
        />
      </SearchField>

      <ListBox
        ref={listRef}
        aria-label="タグ候補"
        className={candidateList}
        items={[...candidates]}
        selectionMode="none"
        renderEmptyState={renderEmpty}
      >
        {(tag) => {
          const selected = selectedIds.has(tag.id);
          return (
            <ListBoxItem
              id={tag.id}
              textValue={tag.name}
              aria-selected={selected}
              data-selected={selected ? "true" : "false"}
              className={candidateItem}
              onAction={() => {
                onToggleTag({ id: tag.id, name: tag.name });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                }
              }}
            >
              {selected ? (
                <Check size={16} aria-hidden />
              ) : (
                <span aria-hidden className={checkSlot} />
              )}
              <TagDot tone={toneFor(tag.name)} />
              <span className={candidateName}>{tag.name}</span>
              <span className={selected ? candidateState : srOnly}>
                {selected ? "選択済み" : "未選択"}
              </span>
            </ListBoxItem>
          );
        }}
      </ListBox>

      {canCreate ? (
        <StyledButton
          type="button"
          onPress={() => {
            onCreateTag(query);
          }}
          isDisabled={isCreatingTag}
        >
          <Plus size={16} aria-hidden />
          {isCreatingTag
            ? "作成中…"
            : `「${toTagName(query).display}」を新しいタグとして作成`}
        </StyledButton>
      ) : null}
    </div>
  );
};
