import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'react-aria-components/Button'
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog'
import { Heading } from 'react-aria-components/Heading'
import { Modal, ModalOverlay } from 'react-aria-components/Modal'
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
    <DialogTrigger
      isOpen={shelfOpen}
      onOpenChange={setShelfOpen}>
      <Button className={shelfChanger}>
        <Menu
          size={16}
          aria-hidden
        />{' '}
        棚を変える
      </Button>
      <ModalOverlay
        className={shelfSheetBackdrop}
        isDismissable>
        <Modal>
          <Dialog className={shelfSheet}>
            <div className={shelfSheetHeader}>
              <Heading
                slot='title'
                level={2}
                className={shelfSheetTitle}>
                棚を選ぶ
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
              onNavigate={closeShelf}
            />
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
