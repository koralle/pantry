import { Dialog } from '@base-ui/react/dialog'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { css } from 'styled-system/css'

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

export function MobileShelfDialog({
  shelfTagsPromise,
  selection
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>
  readonly selection: ShelfNavSelection
}) {
  const [shelfOpen, setShelfOpen] = useState(false)

  const closeShelf = () => {
    setShelfOpen(false)
  }

  return (
    <Dialog.Root
      open={shelfOpen}
      onOpenChange={setShelfOpen}>
      <Dialog.Trigger className={shelfChanger}>
        <Menu
          size={16}
          aria-hidden
        />{' '}
        棚を変える
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={shelfSheetBackdrop} />
        <Dialog.Popup className={shelfSheet}>
          <div className={shelfSheetHeader}>
            <Dialog.Title className={shelfSheetTitle}>棚を選ぶ</Dialog.Title>
            <Dialog.Close className={shelfSheetClose}>
              <X
                size={16}
                aria-hidden
              />{' '}
              閉じる
            </Dialog.Close>
          </div>
          <ShelfNavPanel
            shelfTagsPromise={shelfTagsPromise}
            selection={selection}
            onNavigate={closeShelf}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
