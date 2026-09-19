import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  Link2,
  LoaderCircle,
  Plus,
  RotateCw,
  Tag,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { Input } from "react-aria-components";
import { css, cx } from "styled-system/css";
import * as v from "valibot";

import { FaviconTile } from "../../../../shared/components/favicon-tile";
import { StyledButton } from "../../../../shared/components/styled-button";
import { button } from "../../../../styles/button";
import { domainToneVar, toneFor } from "../../../../styles/domain-tone";
import { spinner } from "../../../../styles/feedback";
import {
  fieldErr,
  flabel,
  inputBox,
  inputBoxField,
  inputBoxIcon,
  noteArea,
  noteBox,
} from "../../../../styles/form-screen";
import {
  qaActions,
  qaBadge,
  qaBody,
  qaBookmark,
  qaBookmarkMeta,
  qaBookmarkTitle,
  qaBookmarkTx,
  qaCard,
  qaEditTagLink,
  qaErrNote,
  qaFetchRow,
  qaFieldGroup,
  qaHead,
  qaSub,
  qaTagDot,
  qaTagDots,
  qaTitle,
  qaWarnNote,
  qaWarnNoteIcon,
} from "../../../../styles/quick-add";
import { kbd } from "../../../../styles/shell";
import { srOnly } from "../../../../styles/sr-only";
import { bookmarkUrlSchema } from "../../domain/bookmark-values";
import type { CreateTagFromPickerAction } from "../../lib/tag-picker/execute-create-tag-from-picker";
import type {
  BookmarkFormServerError,
  BookmarkTitleFetchAction,
} from "../bookmark-editor/bookmark-form";
import { useBookmarkTagDraft } from "../bookmark-editor/bookmark-form/use-bookmark-tag-draft";
import { BookmarkTagPicker } from "../bookmark-tag-picker";
import type { TagCandidate } from "../bookmark-tag-picker";
import type { NamedTag } from "../bookmark-tag-picker/lib";

export interface QuickAddCreateCommand {
  readonly url: string;
  readonly title: string;
  readonly note: string | null;
  readonly tagIds: readonly number[];
}

/**
 * `failure` が null のときは UNAUTHORIZED。sign-in への redirect が進行中なので
 * 画面側はエラーを表示しない（フォーム画面と同じ契約）。
 */
export type QuickAddCreateResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly failure: BookmarkFormServerError | null };

export interface QuickAddScreenProps {
  /** URL prefill（コマンドバーへの URL 貼付など）。title 系とセットで渡す。 */
  readonly initialUrl?: string | undefined;
  /** prefill 時に route 側で取得済みのタイトル。undefined のとき入力状態から始まる。 */
  readonly initialTitle?: string | undefined;
  readonly initialTitleFailed?: boolean | undefined;
  /** 「詳細を見る」「タグを編集」に引き継ぐ一覧の検索条件。 */
  readonly detailSearch?: Record<string, unknown> | undefined;
  readonly fetchTitleAction: BookmarkTitleFetchAction;
  readonly onCreateBookmark: (
    command: QuickAddCreateCommand
  ) => Promise<QuickAddCreateResult>;
  readonly tagCandidates: readonly TagCandidate[];
  readonly tagsReady: boolean;
  readonly createTagAction: CreateTagFromPickerAction;
}

type QuickAddPhase =
  | { readonly step: "input" }
  | { readonly step: "fetching"; readonly url: string }
  | {
      readonly step: "confirm";
      readonly url: string;
      readonly title: string;
      readonly titleFetchFailed: boolean;
    }
  | {
      readonly step: "done";
      readonly id: string;
      readonly title: string;
      readonly url: string;
      readonly tags: readonly NamedTag[];
    };

const domainOf = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const kbdDesktopOnly = css({
  display: "none",
  md: { display: "inline" },
});

const urlValue = css({
  color: "fg.default",
  flex: "1",
  fontFamily: "mono",
  fontSize: "xs",
  minInlineSize: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const qaFieldset = css({
  borderWidth: "none",
  display: "flex",
  flexDirection: "column",
  margin: "0",
  minInlineSize: "0",
  padding: "0",
});

const CardHead = ({
  icon,
  title,
  sub,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly sub?: string | undefined;
}) => (
  <div className={qaHead}>
    <span aria-hidden className={qaBadge}>
      {icon}
    </span>
    <div>
      <h1 className={qaTitle}>{title}</h1>
      {sub === undefined ? null : <p className={qaSub}>{sub}</p>}
    </div>
  </div>
);

/**
 * タイトル取得中の静的カード。route 側の URL prefill 待ちと
 * 画面内の取得中フェーズで同じ見た目を共有する。
 */
export const QuickAddFetchingCard = ({ url }: { readonly url: string }) => (
  <div className={qaCard}>
    <CardHead
      icon={<Link2 size={16} />}
      sub="URLを入力するとタイトルを自動取得します"
      title="ブックマークを登録"
    />
    <div className={qaBody}>
      <div className={qaFieldGroup}>
        <span className={flabel}>URL</span>
        <div className={inputBox()}>
          <span aria-hidden className={inputBoxIcon}>
            <Link2 size={13} />
          </span>
          <span className={urlValue}>{url}</span>
        </div>
      </div>
      <output className={qaFetchRow}>
        <LoaderCircle aria-hidden className={spinner} size={14} />
        タイトルを取得中…
      </output>
      <div className={qaActions}>
        <StyledButton data-primary isDisabled visual="accent">
          <Check aria-hidden size={13} />
          登録する
        </StyledButton>
      </div>
    </div>
  </div>
);

/**
 * URL 入力 → タイトル取得 → 確認 → 保存 → 完了 を画面内で回すミニ画面。
 * 「続けて登録」は round の remount で全下書きを初期状態へ戻す
 * （useEffect で state を後追いリセットしない）。
 */
export const QuickAddScreen = (props: QuickAddScreenProps) => {
  const [round, setRound] = useState(0);
  const { initialUrl, initialTitle, initialTitleFailed, ...roundProps } = props;
  return (
    <QuickAddRound
      key={round}
      onRestart={() => {
        setRound((current) => current + 1);
      }}
      // initial 値は最初の round だけに適用する。
      // 「続けて登録」後の remount で prefill が再適用されないよう切り離す。
      {...roundProps}
      {...(round === 0 ? { initialTitle, initialTitleFailed, initialUrl } : {})}
    />
  );
};

const QuickAddRound = ({
  initialUrl,
  initialTitle,
  initialTitleFailed,
  detailSearch,
  fetchTitleAction,
  onCreateBookmark,
  tagCandidates,
  tagsReady,
  createTagAction,
  onRestart,
}: QuickAddScreenProps & { readonly onRestart: () => void }) => {
  const urlInputId = useId();
  const titleInputId = useId();
  const noteInputId = useId();

  const [phase, setPhase] = useState<QuickAddPhase>(() =>
    initialUrl !== undefined && initialTitle !== undefined
      ? {
          step: "confirm",
          title: initialTitle,
          titleFetchFailed: initialTitleFailed ?? false,
          url: initialUrl,
        }
      : { step: "input" }
  );
  const [urlDraft, setUrlDraft] = useState(initialUrl ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState(initialTitle ?? "");
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<BookmarkFormServerError | null>(
    null
  );
  const urlSubmitInFlight = useRef(false);
  const saveInFlight = useRef(false);

  const {
    selectedTags,
    tagIds,
    handleToggleTag,
    handleRemoveTag,
    handleCreateTag,
    isCreatingTag,
    createError,
    lastCreatedTagId,
  } = useBookmarkTagDraft({
    createTagAction,
    initialTagIds: [],
    // tags フィールド宛の server error だけを外す。他の summary は残す。
    onClearFieldError: () => {
      setSaveError((current) => {
        if (current?.fields?.tags === undefined) {
          return current;
        }
        const { tags: _removed, ...restFields } = current.fields;
        return {
          ...(current.summary === undefined
            ? {}
            : { summary: current.summary }),
          ...(Object.keys(restFields).length === 0
            ? {}
            : { fields: restFields }),
        };
      });
    },
    tagCandidates,
    tagsReady,
  });

  const submitUrl = async () => {
    if (urlSubmitInFlight.current) {
      return;
    }
    const url = urlDraft.trim();
    const parsed = v.safeParse(bookmarkUrlSchema, url);
    if (!parsed.success) {
      setUrlError(
        parsed.issues[0]?.message ??
          "URLの形式が正しくありません（例: https://example.com）"
      );
      return;
    }
    setUrlError(null);
    urlSubmitInFlight.current = true;
    setPhase({ step: "fetching", url });
    try {
      const result = await fetchTitleAction({ status: "idle" }, { url });
      if (result.status === "success") {
        setTitleDraft(result.title);
        setPhase({
          step: "confirm",
          title: result.title,
          titleFetchFailed: false,
          url,
        });
      } else {
        setTitleDraft("");
        setPhase({ step: "confirm", title: "", titleFetchFailed: true, url });
      }
    } finally {
      urlSubmitInFlight.current = false;
    }
  };

  const submitConfirm = async () => {
    if (phase.step !== "confirm" || saveInFlight.current || isCreatingTag) {
      return;
    }
    saveInFlight.current = true;
    setSaving(true);
    setSaveError(null);
    const { url } = phase;
    // タイトル未取得のまま空欄でも「そのまま登録」できるようドメインへ倒す。
    const title =
      (phase.titleFetchFailed ? titleDraft : phase.title).trim() ||
      domainOf(url);
    try {
      const result = await onCreateBookmark({
        note: noteDraft.trim() === "" ? null : noteDraft,
        tagIds,
        title,
        url,
      });
      if (result.ok) {
        setPhase({
          id: result.id,
          step: "done",
          tags: selectedTags,
          title,
          url,
        });
        return;
      }
      if (result.failure !== null) {
        setSaveError(result.failure);
      }
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  if (phase.step === "fetching") {
    return <QuickAddFetchingCard url={phase.url} />;
  }

  if (phase.step === "input") {
    return (
      <div className={qaCard}>
        <CardHead
          icon={<Link2 size={16} />}
          sub="URLを入力するとタイトルを自動取得します"
          title="ブックマークを登録"
        />
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submitUrl();
          }}
        >
          <div className={qaBody}>
            <div className={qaFieldGroup}>
              <label className={flabel} htmlFor={urlInputId}>
                URL
              </label>
              <div className={inputBox({ invalid: urlError !== null })}>
                <span aria-hidden className={inputBoxIcon}>
                  <Link2 size={13} />
                </span>
                <Input
                  aria-describedby={
                    urlError === null ? undefined : `${urlInputId}-error`
                  }
                  aria-invalid={urlError !== null}
                  autoComplete="url"
                  className={inputBoxField}
                  id={urlInputId}
                  onChange={(event) => {
                    setUrlDraft(event.currentTarget.value);
                    if (urlError !== null) {
                      setUrlError(null);
                    }
                  }}
                  placeholder="https://…"
                  type="url"
                  value={urlDraft}
                />
                <kbd className={cx(kbd(), kbdDesktopOnly)}>⌘V</kbd>
              </div>
              {urlError === null ? null : (
                <p className={fieldErr} id={`${urlInputId}-error`} role="alert">
                  <CircleAlert aria-hidden size={12} /> {urlError}
                </p>
              )}
            </div>
            <div className={qaActions}>
              <StyledButton
                data-primary
                isDisabled={urlDraft.trim() === ""}
                type="submit"
                visual="accent"
              >
                <Check aria-hidden size={13} />
                登録する
              </StyledButton>
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (phase.step === "done") {
    const domain = domainOf(phase.url);
    return (
      <div className={qaCard}>
        <CardHead icon={<Check size={16} />} title="保存しました" />
        <div className={qaBody}>
          <div className={qaBookmark}>
            <FaviconTile domain={domain} size="md" />
            <div className={qaBookmarkTx}>
              <div className={qaBookmarkTitle}>{phase.title}</div>
              <div className={qaBookmarkMeta}>
                {domain}
                {phase.tags.length === 0 ? null : (
                  <span aria-hidden className={qaTagDots}>
                    {phase.tags.map((tag) => (
                      <span
                        className={qaTagDot}
                        key={tag.id}
                        style={{
                          background: domainToneVar[toneFor(tag.name)],
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>
            </div>
            <Link
              className={qaEditTagLink}
              params={{ id: phase.id }}
              search={detailSearch ?? {}}
              to="/bookmarks/$id/edit"
            >
              <Tag aria-hidden size={12} />
              タグを編集
            </Link>
          </div>
        </div>
        <div className={qaActions}>
          <Link
            className={button({ size: "md", visual: "default" })}
            params={{ id: phase.id }}
            search={detailSearch ?? {}}
            to="/bookmarks/$id"
          >
            <ArrowUpRight aria-hidden size={13} />
            詳細を見る
          </Link>
          <StyledButton data-primary onPress={onRestart} visual="accent">
            <Plus aria-hidden size={13} />
            続けて登録
          </StyledButton>
        </div>
      </div>
    );
  }

  const confirm = phase;
  const busy = saving || isCreatingTag;
  const submitLabel = (() => {
    if (saving) {
      return (
        <>
          <LoaderCircle aria-hidden className={spinner} size={13} />
          保存中…
        </>
      );
    }
    if (saveError !== null) {
      return (
        <>
          <RotateCw aria-hidden size={13} />
          もう一度保存
        </>
      );
    }
    return (
      <>
        <Check aria-hidden size={13} />
        登録する
      </>
    );
  })();

  return (
    <div className={qaCard}>
      <CardHead
        icon={<Link2 size={16} />}
        sub="タグはあとでも付けられます"
        title="ブックマークを登録"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitConfirm();
        }}
      >
        <fieldset className={qaFieldset} disabled={busy}>
          <legend className={srOnly}>ブックマークを登録</legend>
          <div className={qaBody}>
            {confirm.titleFetchFailed ? (
              <>
                <div className={qaFieldGroup}>
                  <span className={flabel}>URL</span>
                  <div className={inputBox()}>
                    <span aria-hidden className={inputBoxIcon}>
                      <Link2 size={13} />
                    </span>
                    <span className={urlValue}>{confirm.url}</span>
                  </div>
                </div>
                <p className={qaWarnNote}>
                  <TriangleAlert
                    aria-hidden
                    className={qaWarnNoteIcon}
                    size={13}
                  />
                  タイトルを取得できませんでした。手で入力するか、そのまま登録できます。
                </p>
                <div className={qaFieldGroup}>
                  <label className={flabel} htmlFor={titleInputId}>
                    タイトル
                  </label>
                  <div className={inputBox()}>
                    <Input
                      className={inputBoxField}
                      id={titleInputId}
                      onChange={(event) => {
                        setTitleDraft(event.currentTarget.value);
                      }}
                      placeholder="タイトルを入力…"
                      type="text"
                      value={titleDraft}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className={qaBookmark}>
                <FaviconTile domain={domainOf(confirm.url)} size="md" />
                <div className={qaBookmarkTx}>
                  <div className={qaBookmarkTitle}>{confirm.title}</div>
                  <div className={qaBookmarkMeta}>{domainOf(confirm.url)}</div>
                </div>
              </div>
            )}
            <BookmarkTagPicker
              createError={createError}
              isCreatingTag={isCreatingTag}
              lastCreatedTagId={lastCreatedTagId}
              onCreateTag={handleCreateTag}
              onRemoveTag={handleRemoveTag}
              onToggleTag={handleToggleTag}
              selectedTags={selectedTags}
              serverError={saveError?.fields?.tags}
              tagCandidates={tagCandidates}
              tagsReady={tagsReady}
            />
            <div className={qaFieldGroup}>
              <label className={flabel} htmlFor={noteInputId}>
                メモ（任意）
              </label>
              <div className={`${inputBox()} ${noteBox}`}>
                <textarea
                  className={noteArea}
                  id={noteInputId}
                  onChange={(event) => {
                    setNoteDraft(event.currentTarget.value);
                  }}
                  placeholder="ひとことメモ…"
                  value={noteDraft}
                />
              </div>
            </div>
            {saveError?.summary === undefined ? null : (
              <p className={qaErrNote} role="alert">
                <CircleAlert aria-hidden className={qaWarnNoteIcon} size={13} />
                {saveError.summary}
              </p>
            )}
            <div className={qaActions}>
              <StyledButton
                data-primary
                isDisabled={busy}
                type="submit"
                visual="accent"
              >
                {submitLabel}
              </StyledButton>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
};
