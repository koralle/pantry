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

import { ChevronDown } from 'lucide-react'
import { useRef } from 'react'
import type { ComponentProps, ReactNode } from 'react'
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
  useFilter
} from 'react-aria-components'
import { css } from 'styled-system/css'
import { styled } from 'styled-system/jsx'
import type { HTMLStyledProps } from 'styled-system/types'

import { StyledInput } from '../styled-input'

const RawSelect = styled(Select, {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    minInlineSize: '0'
  }
})

const RawLabel = styled(AriaLabel, {
  base: {
    color: 'fg.muted',
    fontSize: 'xs',
    fontWeight: 'semibold',
    flexShrink: '0'
  }
})

const RawTrigger = styled(AriaButton, {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2',
    minBlockSize: 'touch',
    minInlineSize: '10rem',
    borderWidth: 'thin',
    borderStyle: 'solid',
    borderColor: 'border.default',
    borderRadius: 'box',
    paddingBlock: '2',
    paddingInline: '3',
    background: 'bg.surface',
    color: 'fg.default',
    cursor: 'pointer',
    textAlign: 'start',
    _focusVisible: {
      outlineWidth: 'medium',
      outlineStyle: 'solid',
      outlineColor: 'accent.solid',
      outlineOffset: '2px'
    }
  }
})

const RawValue = styled(SelectValue, {
  base: {
    flex: '1',
    minInlineSize: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})

const RawChevron = styled('span', {
  base: {
    display: 'inline-flex',
    color: 'fg.muted',
    flexShrink: '0'
  }
})

const RawPopover = styled(Popover, {
  base: {
    display: 'flex',
    flexDirection: 'column',
    minInlineSize: '[var(--trigger-width)]',
    maxBlockSize: '18rem',
    overflow: 'hidden',
    zIndex: '20',
    margin: '0',
    padding: '1',
    borderWidth: 'thin',
    borderStyle: 'solid',
    borderColor: 'border.default',
    borderRadius: 'box',
    background: 'bg.surface',
    boxSizing: 'border-box'
  }
})

const RawList = styled(ListBox, {
  base: {
    margin: '0',
    padding: '0',
    outline: 'none',
    flex: '1',
    minBlockSize: '0',
    overflow: 'auto'
  }
})

const filterRoot = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minBlockSize: '0',
  overflow: 'hidden',
  // SearchField autofocuses; keep the 2px + 2px focus ring inside overflow:hidden.
  padding: '2'
})

const filterSearch = css({
  flexShrink: '0',
  marginBlockEnd: '1'
})

const emptyState = css({
  paddingBlock: '2',
  paddingInline: '3',
  color: 'fg.muted',
  fontSize: 'xs'
})

const itemClass = css({
  display: 'flex',
  alignItems: 'center',
  minBlockSize: 'touch',
  paddingBlock: '2',
  paddingInline: '3',
  borderRadius: 'box',
  cursor: 'pointer',
  outline: 'none',
  '&[data-focused]': {
    background: 'accent.hover'
  },
  '&[data-selected]': {
    background: 'accent.subtle',
    color: 'accent.solid',
    fontWeight: 'semibold'
  }
})

type StyledSelectRootProps = HTMLStyledProps<typeof RawSelect> & {
  readonly label: string
  readonly placeholder?: string
  readonly children: ReactNode
}

type SelectChromeProps = Omit<StyledSelectRootProps, 'children'> & {
  readonly children: ReactNode
}

function SelectChrome({ label, placeholder, children, ...props }: SelectChromeProps) {
  return (
    <RawSelect
      {...props}
      {...(placeholder === undefined ? {} : { placeholder })}>
      <RawLabel>{label}</RawLabel>
      <RawTrigger>
        <RawValue />
        <RawChevron aria-hidden='true'>
          <ChevronDown size={16} />
        </RawChevron>
      </RawTrigger>
      <RawPopover offset={4}>{children}</RawPopover>
    </RawSelect>
  )
}

function StyledSelectRoot({ children, ...props }: StyledSelectRootProps) {
  return (
    <SelectChrome {...props}>
      <RawList>{children}</RawList>
    </SelectChrome>
  )
}

type StyledFilterableSelectProps = StyledSelectRootProps & {
  readonly searchPlaceholder?: string
  readonly searchLabel?: string
}

function filterEmptyState() {
  return <div className={emptyState}>該当なし</div>
}

function StyledFilterableSelect({
  children,
  searchPlaceholder = '検索…',
  searchLabel,
  onOpenChange,
  ...props
}: StyledFilterableSelectProps) {
  const { contains } = useFilter({ sensitivity: 'base' })
  const filterLabel = searchLabel ?? `${props.label}を検索`
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <SelectChrome
      {...props}
      onOpenChange={(isOpen) => {
        onOpenChange?.(isOpen)
        if (!isOpen) {
          return
        }
        requestAnimationFrame(() => {
          searchInputRef.current?.focus()
        })
      }}>
      <Autocomplete filter={contains}>
        <div className={filterRoot}>
          <SearchField
            aria-label={filterLabel}
            className={filterSearch}>
            <StyledInput
              ref={searchInputRef}
              type='search'
              placeholder={searchPlaceholder}
            />
          </SearchField>
          <RawList renderEmptyState={filterEmptyState}>{children}</RawList>
        </div>
      </Autocomplete>
    </SelectChrome>
  )
}

type StyledSelectItemProps = ComponentProps<typeof ListBoxItem>

function StyledSelectItem(props: Omit<StyledSelectItemProps, 'className'>) {
  return (
    <ListBoxItem
      {...props}
      className={itemClass}
    />
  )
}

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
  Item: StyledSelectItem,
  Filterable: StyledFilterableSelect
})
