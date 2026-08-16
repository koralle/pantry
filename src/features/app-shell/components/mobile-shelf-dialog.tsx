import { Menu, Settings, Tags, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import type { BookmarkSearchSchema } from '../../navigation/lib/bookmark-search'
import type { ShelfNavSelection } from '../../tags/components/shelf-nav'
import type { ShelfTag } from '../../tags/lib/tag-shelf'
import { ShelfNavPanel } from './shelf-nav-panel'

const shelfChanger = css({
  color: 'fg.default',
  textDecoration: 'none',
  minBlockSize: 'touch',
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '1.5',
  paddingInline: '2',
  borderWidth: 'none',
  background: 'transparent',
  cursor: 'pointer',
  md: {
    display: 'none'
  }
})

const shelfSheetBackdrop = css({
  position: 'fixed',
  inset: '0',
  background: 'overlay.backdrop'
})

const shelfSheet = css({
  position: 'fixed',
  insetInline: '0',
  insetBlockEnd: '0',
  maxBlockSize: '85dvh',
  overflow: 'auto',
  margin: '0',
  paddingBlockStart: '4',
  paddingInline: '3',
  paddingBlockEnd: '5',
  borderWidth: 'none',
  borderBlockStartWidth: 'thin',
  borderBlockStartStyle: 'solid',
  borderBlockStartColor: 'border.default',
  borderTopLeftRadius: 'sheet',
  borderTopRightRadius: 'sheet',
  background: 'bg.canvas',
  boxSizing: 'border-box',
  width: 'full'
})

const shelfSheetHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  marginBlockEnd: '3',
  paddingInline: '1'
})

const shelfSheetTitle = css({
  margin: '0',
  fontSize: 'md2',
  fontWeight: 'bold'
})

const shelfSheetClose = css({
  color: 'fg.default',
  textDecoration: 'none',
  minBlockSize: 'touch',
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '1.5',
  paddingInline: '2',
  borderWidth: 'none',
  background: 'transparent',
  cursor: 'pointer'
})

const shelfSheetMeta = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  marginBlockStart: '4',
  borderBlockStartWidth: 'thin',
  borderBlockStartStyle: 'solid',
  borderBlockStartColor: 'border.default',
  paddingBlockStart: '3'
})

export function MobileShelfDialog({
  shelfTagsPromise,
  selection,
  listSearch
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly selection: ShelfNavSelection
  readonly listSearch: BookmarkSearchSchema | undefined
}) {
  const [shelfOpen, setShelfOpen] = useState(false)

  const closeShelf = () => {
    setShelfOpen(false)
  }

  return (
    <DialogTrigger
      isOpen={shelfOpen}
      onOpenChange={setShelfOpen}>
      <Button
        className={shelfChanger}
        aria-label='タグを選ぶ'>
        <Menu
          size={16}
          aria-hidden
        />{' '}
        タグ
      </Button>
      <ModalOverlay
        className={shelfSheetBackdrop}
        isDismissable>
        <Modal className={shelfSheet}>
          <Dialog>
            <div className={shelfSheetHeader}>
              <Heading
                slot='title'
                className={shelfSheetTitle}>
                タグを選ぶ
              </Heading>
              <Button
                slot='close'
                className={shelfSheetClose}>
                <X
                  size={16}
                  aria-hidden
                />{' '}
                閉じる
              </Button>
            </div>
            <ShelfNavPanel
              shelfTagsPromise={shelfTagsPromise}
              selection={selection}
              listSearch={listSearch}
              onNavigate={closeShelf}
            />
            <div className={shelfSheetMeta}>
              <StyledLink
                to='/tags'
                search={{ limit: 50, offset: 0 }}
                visual='plain'
                onClick={closeShelf}>
                <Tags
                  size={16}
                  aria-hidden
                />{' '}
                タグ管理
              </StyledLink>
              <StyledLink
                to='/settings'
                visual='plain'
                onClick={closeShelf}>
                <Settings
                  size={16}
                  aria-hidden
                />{' '}
                設定
              </StyledLink>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
