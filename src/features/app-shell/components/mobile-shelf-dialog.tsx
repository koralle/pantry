import { Menu, Settings, Tags, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { css } from "styled-system/css";

import { StyledButton } from "../../../shared/components/styled-button";
import { StyledLink } from "../../../shared/components/styled-link";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import type { ShelfNavSelection } from "../../tags/components/shelf-nav";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import { ShelfNavPanel } from "./shelf-nav-panel";

const shelfChanger = css({
  "@media (any-hover: hover)": {
    "&:hover:not(:disabled)": {
      background: "transparent",
      borderColor: "transparent",
    },
  },
  alignItems: "center",
  background: "transparent",
  borderColor: "transparent",
  borderWidth: "none",
  color: "fg.default",
  cursor: "pointer",
  display: "inline-flex",
  md: {
    display: "none",
  },
  minBlockSize: "touch",
  paddingBlock: "1.5",
  paddingInline: "2",
  textDecoration: "none",
});

const shelfSheetBackdrop = css({
  background: "overlay.backdrop",
  inset: "0",
  position: "fixed",
});

const shelfSheet = css({
  background: "bg.canvas",
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  borderTopLeftRadius: "sheet",
  borderTopRightRadius: "sheet",
  borderWidth: "none",
  boxSizing: "border-box",
  insetBlockEnd: "0",
  insetInline: "0",
  margin: "0",
  maxBlockSize: "85dvh",
  overflow: "auto",
  paddingBlockEnd: "5",
  paddingBlockStart: "4",
  paddingInline: "3",
  position: "fixed",
  width: "full",
});

const shelfSheetHeader = css({
  alignItems: "center",
  display: "flex",
  gap: "3",
  justifyContent: "space-between",
  marginBlockEnd: "3",
  paddingInline: "1",
});

const shelfSheetTitle = css({
  fontSize: "md2",
  fontWeight: "bold",
  margin: "0",
});

const shelfSheetClose = css({
  "@media (any-hover: hover)": {
    "&:hover:not(:disabled)": {
      background: "transparent",
      borderColor: "transparent",
    },
  },
  alignItems: "center",
  background: "transparent",
  borderColor: "transparent",
  borderWidth: "none",
  color: "fg.default",
  cursor: "pointer",
  display: "inline-flex",
  minBlockSize: "touch",
  paddingBlock: "1.5",
  paddingInline: "2",
  textDecoration: "none",
});

const shelfSheetMeta = css({
  borderBlockStartColor: "border.default",
  borderBlockStartStyle: "solid",
  borderBlockStartWidth: "thin",
  display: "flex",
  flexDirection: "column",
  gap: "1",
  marginBlockStart: "4",
  paddingBlockStart: "3",
});

export const MobileShelfDialog = ({
  shelfTagsPromise,
  selection,
  listSearch,
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
  readonly selection: ShelfNavSelection;
  readonly listSearch: BookmarkSearchSchema | undefined;
}) => {
  const [shelfOpen, setShelfOpen] = useState(false);

  const closeShelf = () => {
    setShelfOpen(false);
  };

  return (
    <DialogTrigger isOpen={shelfOpen} onOpenChange={setShelfOpen}>
      <StyledButton className={shelfChanger} aria-label="タグを選ぶ">
        <Menu size={16} aria-hidden /> タグ
      </StyledButton>
      <ModalOverlay className={shelfSheetBackdrop} isDismissable>
        <Modal className={shelfSheet}>
          <Dialog>
            <div className={shelfSheetHeader}>
              <Heading slot="title" className={shelfSheetTitle}>
                タグを選ぶ
              </Heading>
              <StyledButton slot="close" className={shelfSheetClose}>
                <X size={16} aria-hidden /> 閉じる
              </StyledButton>
            </div>
            <ShelfNavPanel
              shelfTagsPromise={shelfTagsPromise}
              selection={selection}
              listSearch={listSearch}
              onNavigate={closeShelf}
            />
            <div className={shelfSheetMeta}>
              <StyledLink
                to="/tags"
                search={{ limit: 50, offset: 0 }}
                visual="plain"
                onClick={closeShelf}
              >
                <Tags size={16} aria-hidden /> タグ管理
              </StyledLink>
              <StyledLink to="/settings" visual="plain" onClick={closeShelf}>
                <Settings size={16} aria-hidden /> 設定
              </StyledLink>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
