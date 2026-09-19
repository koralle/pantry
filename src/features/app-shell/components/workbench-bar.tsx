import { Link } from "@tanstack/react-router";
import { ArrowLeft, UserRound } from "lucide-react";
import { css, cx } from "styled-system/css";

import { backlink } from "../../../styles/detail";
import {
  workbenchBar,
  workbenchBarFlex,
  workbenchBarTitle,
  workbenchWordmark,
} from "../../../styles/form-screen";
import { iconButton } from "../../../styles/icon-button";
import { wordmark } from "../../../styles/shell";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";

const mobileOnly = css({
  md: {
    display: "none",
  },
});

const desktopOnly = css({
  display: "none",
  md: {
    display: "inline",
  },
});

export interface WorkbenchBarProps {
  readonly backTo: string;
  readonly backParams?: Record<string, string> | undefined;
  readonly backSearch?: Record<string, unknown> | undefined;
  readonly backLabel: string;
  /** モバイル時の短い戻るラベル（省略時は backLabel をそのまま出す）。 */
  readonly mobileBackLabel?: string | undefined;
  /** モバイル時に中央へ出す短い画面名。デスクトップでは wordmark を出す。 */
  readonly title: string;
}

/**
 * 集中フロー（新規/編集フォーム・クイック追加）の専用トップバー。
 * シェルのコマンドバーや登録 CTA は出さず、戻る導線とアカウントだけを持つ。
 */
export const WorkbenchBar = ({
  backTo,
  backParams,
  backSearch,
  backLabel,
  mobileBackLabel,
  title,
}: WorkbenchBarProps) => (
  <header className={workbenchBar}>
    <Link
      className={backlink}
      params={backParams ?? {}}
      search={backSearch ?? {}}
      to={backTo}
    >
      <ArrowLeft aria-hidden size={13} />
      {mobileBackLabel === undefined ? (
        backLabel
      ) : (
        <>
          <span className={mobileOnly}>{mobileBackLabel}</span>
          <span className={desktopOnly}>{backLabel}</span>
        </>
      )}
    </Link>
    <Link
      className={cx(wordmark, workbenchWordmark)}
      search={defaultBookmarkSearch}
      to="/bookmarks"
    >
      PANTRY
    </Link>
    <span aria-hidden className={workbenchBarFlex} />
    <span className={workbenchBarTitle}>{title}</span>
    <span aria-hidden className={workbenchBarFlex} />
    <Link
      aria-label="アカウント"
      className={iconButton({ size: "lg" })}
      to="/settings"
    >
      <UserRound aria-hidden size={17} />
    </Link>
  </header>
);
