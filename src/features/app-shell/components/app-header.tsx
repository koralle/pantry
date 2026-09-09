import type { LinkProps, RegisteredRouter } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, Search, Settings, Tags } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Label, SearchField } from "react-aria-components";
import { css } from "styled-system/css";

import { StyledButton } from "../../../shared/components/styled-button";
import { StyledInput } from "../../../shared/components/styled-input";
import { StyledLink } from "../../../shared/components/styled-link";
import { srOnly } from "../../../styles/sr-only";
import { useSignOut } from "../../auth/hooks/use-sign-out";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import { buildListSearch } from "../../navigation/lib/bookmark-search-builders";

const shellHeader = css({
  alignItems: "center",
  background: "surface.header",
  borderBlockEndColor: "border.default",
  borderBlockEndStyle: "solid",
  borderBlockEndWidth: "thin",
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  md: {
    display: "grid",
    gridTemplateColumns: "16rem minmax(0, 1fr) auto",
    paddingBlock: "0",
    paddingInline: "0",
  },
  minBlockSize: "4rem",
  paddingBlock: "2",
  paddingInline: "4",
});

const headerLead = css({
  alignItems: "center",
  display: "flex",
  gap: "2",
  md: {
    alignSelf: "stretch",
    borderInlineEndColor: "border.default",
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: "thin",
    gridColumn: "1",
    gridRow: "1",
    minBlockSize: "4rem",
    order: 0,
    paddingInline: "4",
  },
  order: 1,
});

const headerActions = css({
  alignItems: "center",
  display: "flex",
  gap: "2",
  marginInlineStart: "auto",
  md: {
    gridColumn: "3",
    gridRow: "1",
    marginInlineEnd: "4",
    marginInlineStart: "0",
    order: 0,
  },
  order: 2,
});

const searchForm = css({
  display: "flex",
  flex: "1 1 100%",
  gap: "2",
  md: {
    flex: "initial",
    gridColumn: "2",
    gridRow: "1",
    minInlineSize: "0",
    order: 0,
    paddingBlock: "2",
  },
  minInlineSize: "0",
  order: 3,
});

const searchField = css({
  display: "flex",
  flex: "1",
  minInlineSize: "0",
});

const searchSubmit = css({
  flexShrink: "0",
  paddingInline: "3",
});

export const AppHeader = ({
  newBookmarkSearch,
  listSearch,
  shelfTrigger,
}: {
  readonly newBookmarkSearch: NonNullable<
    LinkProps<"a", RegisteredRouter, string, "/bookmarks/new">["search"]
  >;
  readonly listSearch: BookmarkSearchSchema | undefined;
  readonly shelfTrigger: ReactNode;
}) => {
  const { handleSignOut, isPending } = useSignOut();
  const navigate = useNavigate();
  const [draftQ, setDraftQ] = useState(listSearch?.q ?? "");

  useEffect(() => {
    setDraftQ(listSearch?.q ?? "");
  }, [listSearch?.q]);

  const commitSearch = (raw: string) => {
    const nextQ = raw.trim();
    const current = listSearch ?? defaultBookmarkSearch;
    void navigate({
      search:
        nextQ === ""
          ? buildListSearch(current, { clearQ: true })
          : buildListSearch(current, { q: nextQ }),
      to: "/bookmarks",
    });
  };

  return (
    <header className={shellHeader}>
      <div className={headerLead}>
        <StyledLink
          to="/bookmarks"
          search={defaultBookmarkSearch}
          visual="brand"
        >
          Pantry
        </StyledLink>

        {shelfTrigger}
      </div>

      <div className={searchForm}>
        <SearchField
          className={searchField}
          value={draftQ}
          onChange={setDraftQ}
          onSubmit={commitSearch}
        >
          <Label className={srOnly}>検索</Label>
          <StyledInput
            type="search"
            placeholder="タイトル・URL・メモ"
            enterKeyHint="search"
          />
        </SearchField>
        <StyledButton
          className={searchSubmit}
          aria-label="検索"
          onPress={() => {
            commitSearch(draftQ);
          }}
        >
          <Search size={16} aria-hidden />
        </StyledButton>
      </div>

      <div className={headerActions}>
        <StyledLink
          to="/bookmarks/new"
          visual="plain"
          search={newBookmarkSearch}
        >
          <Plus size={16} aria-hidden /> 新規
        </StyledLink>
        <StyledLink
          to="/tags"
          search={{ limit: 50, offset: 0 }}
          visual="plain"
          aria-label="タグ管理"
        >
          <Tags size={16} aria-hidden />
        </StyledLink>

        <StyledLink to="/settings" visual="plain" aria-label="設定">
          <Settings size={16} aria-hidden />
        </StyledLink>
        <StyledButton
          display={{ base: "none", md: "inline-flex" }}
          color="fg.default"
          borderColor="transparent"
          background="transparent"
          paddingBlock="1.5"
          paddingInline="2"
          onPress={handleSignOut}
          isDisabled={isPending}
        >
          <LogOut size={16} aria-hidden /> ログアウト
        </StyledButton>
      </div>
    </header>
  );
};
