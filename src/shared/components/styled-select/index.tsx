/* oxlint-disable react/no-multi-comp */
// StyledSelect、Filterable、Item は同じ Select 面を組み立てるための同居コンポーネント。
/**
 * @file index.tsx
 *
 * Input:    React Aria Components `Select` family, Panda `styled` factory
 * Output:   StyledSelect compound component
 * Position: Shared UI primitive; documented by index.stories.tsx
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx (stories for new/changed variants)
 *
 * Last synced props: label, placeholder, selectedKey, onSelectionChange, searchPlaceholder, searchLabel, className, css
 */

import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  Autocomplete,
  Button as AriaButton,
  Label as AriaLabel,
  ListBox,
  ListBoxItem,
  Popover,
  SearchField,
  Select,
  SelectValue,
  useFilter,
} from "react-aria-components";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";
import type { HTMLStyledProps } from "styled-system/types";

import { StyledInput } from "../styled-input";

const RawSelect = styled(Select, {
  base: {
    alignItems: "center",
    display: "inline-flex",
    gap: "1.5",
    minInlineSize: "0",
  },
});

const RawLabel = styled(AriaLabel, {
  base: {
    color: "fg.muted",
    flexShrink: "0",
    fontSize: "xs",
    fontWeight: "semibold",
  },
});

const RawTrigger = styled(AriaButton, {
  base: {
    _focusVisible: {
      outlineColor: "accent.solid",
      outlineOffset: "2px",
      outlineStyle: "solid",
      outlineWidth: "medium",
    },
    alignItems: "center",
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    color: "fg.default",
    cursor: "pointer",
    display: "inline-flex",
    gap: "2",
    justifyContent: "space-between",
    minBlockSize: "touch",
    minInlineSize: "10rem",
    paddingBlock: "2",
    paddingInline: "3",
    textAlign: "start",
  },
});

const RawValue = styled(SelectValue, {
  base: {
    flex: "1",
    minInlineSize: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const RawChevron = styled("span", {
  base: {
    color: "fg.muted",
    display: "inline-flex",
    flexShrink: "0",
  },
});

const RawPopover = styled(Popover, {
  base: {
    background: "bg.surface",
    borderColor: "border.default",
    borderRadius: "box",
    borderStyle: "solid",
    borderWidth: "thin",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    margin: "0",
    maxBlockSize: "18rem",
    minInlineSize: "[var(--trigger-width)]",
    overflow: "hidden",
    padding: "1",
    zIndex: "20",
  },
});

const RawList = styled(ListBox, {
  base: {
    flex: "1",
    margin: "0",
    minBlockSize: "0",
    outline: "none",
    overflow: "auto",
    padding: "0",
  },
});

const filterRoot = css({
  display: "flex",
  flexDirection: "column",
  flex: "1",
  minBlockSize: "0",
  overflow: "hidden",
  // SearchField autofocuses; keep the 2px + 2px focus ring inside overflow:hidden.
  padding: "2",
});

const filterSearch = css({
  flexShrink: "0",
  marginBlockEnd: "1",
});

const emptyState = css({
  color: "fg.muted",
  fontSize: "xs",
  paddingBlock: "2",
  paddingInline: "3",
});

const itemClass = css({
  "&[data-focused]": {
    background: "accent.hover",
  },
  "&[data-selected]": {
    background: "accent.subtle",
    color: "accent.solid",
    fontWeight: "semibold",
  },
  alignItems: "center",
  borderRadius: "box",
  cursor: "pointer",
  display: "flex",
  minBlockSize: "touch",
  outline: "none",
  paddingBlock: "2",
  paddingInline: "3",
});

type StyledSelectRootProps = HTMLStyledProps<typeof RawSelect> & {
  readonly label: string;
  readonly placeholder?: string;
  readonly children: ReactNode;
};

type SelectChromeProps = Omit<StyledSelectRootProps, "children"> & {
  readonly children: ReactNode;
};

const SelectChrome = ({
  label,
  placeholder,
  children,
  ...props
}: SelectChromeProps) => (
  <RawSelect {...props} {...(placeholder === undefined ? {} : { placeholder })}>
    <RawLabel>{label}</RawLabel>
    <RawTrigger>
      <RawValue />
      <RawChevron aria-hidden="true">
        <ChevronDown size={16} />
      </RawChevron>
    </RawTrigger>
    <RawPopover offset={4}>{children}</RawPopover>
  </RawSelect>
);

const StyledSelectRoot = ({ children, ...props }: StyledSelectRootProps) => (
  <SelectChrome {...props}>
    <RawList>{children}</RawList>
  </SelectChrome>
);

type StyledFilterableSelectProps = StyledSelectRootProps & {
  readonly searchPlaceholder?: string;
  readonly searchLabel?: string;
};

const filterEmptyState = () => <div className={emptyState}>該当なし</div>;

const StyledFilterableSelect = ({
  children,
  searchPlaceholder = "検索…",
  searchLabel,
  onOpenChange,
  ...props
}: StyledFilterableSelectProps) => {
  const { contains } = useFilter({ sensitivity: "base" });
  const filterLabel = searchLabel ?? `${props.label}を検索`;
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <SelectChrome
      {...props}
      onOpenChange={(isOpen) => {
        onOpenChange?.(isOpen);
        if (!isOpen) {
          return;
        }
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      }}
    >
      <Autocomplete filter={contains}>
        <div className={filterRoot}>
          <SearchField aria-label={filterLabel} className={filterSearch}>
            <StyledInput
              ref={searchInputRef}
              type="search"
              placeholder={searchPlaceholder}
            />
          </SearchField>
          <RawList renderEmptyState={filterEmptyState}>{children}</RawList>
        </div>
      </Autocomplete>
    </SelectChrome>
  );
};

type StyledSelectItemProps = ComponentProps<typeof ListBoxItem>;

const StyledSelectItem = (props: Omit<StyledSelectItemProps, "className">) => (
  <ListBoxItem {...props} className={itemClass} />
);

/**
 * A labelled React Aria `Select` with pantry chrome.
 *
 * `Filterable` wraps the list in Autocomplete + SearchField so the open menu
 * can be filtered, following the React Aria Select autocomplete pattern.
 *
 * @example
 * ```
 * <StyledSelect label="並び" selectedKey="newest" onSelectionChange={onSort}>
 *   <StyledSelect.Item id="newest">新しい順</StyledSelect.Item>
 *   <StyledSelect.Item id="updated">更新順</StyledSelect.Item>
 * </StyledSelect>
 *
 * <StyledSelect.Filterable label="タグを追加" placeholder="選択…" searchPlaceholder="タグを検索">
 *   <StyledSelect.Item id="reading">reading</StyledSelect.Item>
 * </StyledSelect.Filterable>
 * ```
 */
export const StyledSelect = Object.assign(StyledSelectRoot, {
  Filterable: StyledFilterableSelect,
  Item: StyledSelectItem,
});
