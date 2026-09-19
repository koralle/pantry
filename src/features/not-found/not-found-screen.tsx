import { ArrowLeft, Compass } from "lucide-react";
import { css, cx } from "styled-system/css";

import { StyledLink } from "../../shared/components/styled-link";
import { button } from "../../styles/button";
import {
  stateActions,
  stateCenter,
  stateCode,
  stateIcon,
  stateIconMute,
  stateSub,
  stateTitle,
} from "../../styles/not-found";
import { defaultBookmarkSearch } from "../navigation/lib/bookmark-search";

const desktopOnly = css({
  display: { base: "none", md: "inline-flex" },
});

/** シェル内404。存在しないパス・削除済みブックマークの着地先。 */
export const NotFoundScreen = () => (
  <div className={stateCenter}>
    <p className={stateCode}>404</p>
    <span className={cx(stateIcon, stateIconMute)}>
      <Compass size={26} aria-hidden />
    </span>
    <p className={stateTitle}>ページが見つかりません</p>
    <p className={stateSub}>
      URLが間違っているか、ページが移動・削除された可能性があります。
    </p>
    <div className={stateActions}>
      <StyledLink
        className={button({ size: "sm", visual: "accent" })}
        search={defaultBookmarkSearch}
        to="/bookmarks"
      >
        <ArrowLeft size={14} aria-hidden /> 一覧へ戻る
      </StyledLink>
      <StyledLink
        className={cx(button({ size: "sm", visual: "ghost" }), desktopOnly)}
        search={defaultBookmarkSearch}
        to="/bookmarks"
      >
        検索する
      </StyledLink>
    </div>
  </div>
);
