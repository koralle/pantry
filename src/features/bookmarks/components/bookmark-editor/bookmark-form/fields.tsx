import { getInputProps, getTextareaProps } from "@conform-to/react";
import type { FieldMetadata } from "@conform-to/react";
import { CircleAlert, Download, Link2 } from "lucide-react";
import { Input } from "react-aria-components";

import { StyledButton } from "../../../../../shared/components/styled-button";
import {
  fieldErr,
  fieldGroup,
  flabel,
  inputBox,
  inputBoxField,
  inputBoxIcon,
  inputRow,
  noteArea,
  noteBox,
} from "../../../../../shared/styles/form-screen";
import type { BookmarkFormFieldKey, BookmarkFormServerError } from "./types";

interface BookmarkFormFieldsProps {
  readonly fields: {
    readonly url: FieldMetadata;
    readonly title: FieldMetadata;
  };
  readonly serverFieldErrors?: BookmarkFormServerError["fields"];
  readonly busy: boolean;
  readonly isFetchingTitle: boolean;
  readonly handleFetchTitle: () => void;
  readonly onClearServerFieldError: (key: BookmarkFormFieldKey) => void;
}

// Field に表示するメッセージの優先順位を「Conform の validation error → server error」に固定する。
// Conform は現在の入力値に対する結果、server error は直前の送信時点の入力値に対する結果なので、
// 現在値へのフィードバックを優先する方が入力者の認知と一致する。
// また serverError は入力変更時に onClearServerFieldError で clear されるため、
// この優先順位は過渡状態や race condition に対する最終的な解決ルールでもある。
const resolveFieldMessage = (
  formErrors: readonly string[] | null | undefined,
  serverMessage: string | undefined
): string | undefined => {
  const formError = formErrors?.[0];
  if (formError !== undefined) {
    return formError;
  }
  return serverMessage;
};

interface BookmarkFormNoteFieldProps {
  readonly note: FieldMetadata;
  readonly serverMessage?: string | undefined;
  readonly onClearServerFieldError: (key: BookmarkFormFieldKey) => void;
}

export const BookmarkFormNoteField = ({
  note,
  serverMessage,
  onClearServerFieldError,
}: BookmarkFormNoteFieldProps) => {
  const noteError = resolveFieldMessage(note.errors, serverMessage);

  return (
    <div className={fieldGroup}>
      <label className={flabel} htmlFor={note.id}>
        メモ
      </label>
      <div
        className={`${inputBox({ invalid: noteError !== undefined })} ${noteBox}`}
      >
        <textarea
          {...getTextareaProps(note)}
          className={noteArea}
          autoComplete="off"
          placeholder="ひとことメモ…"
          aria-invalid={noteError !== undefined}
          aria-describedby={noteError === undefined ? undefined : note.errorId}
          onChange={() => {
            onClearServerFieldError("note");
          }}
        />
      </div>
      {noteError === undefined ? null : (
        <p id={note.errorId} className={fieldErr}>
          <CircleAlert size={12} aria-hidden /> {noteError}
        </p>
      )}
    </div>
  );
};

export const BookmarkFormFields = ({
  fields,
  serverFieldErrors,
  busy,
  isFetchingTitle,
  handleFetchTitle,
  onClearServerFieldError,
}: BookmarkFormFieldsProps) => {
  const handleFieldChange = (key: BookmarkFormFieldKey) => {
    onClearServerFieldError(key);
  };

  const urlError = resolveFieldMessage(
    fields.url.errors,
    serverFieldErrors?.url
  );
  const titleError = resolveFieldMessage(
    fields.title.errors,
    serverFieldErrors?.title
  );
  return (
    <>
      <div className={fieldGroup}>
        <label className={flabel} htmlFor={fields.url.id}>
          URL
        </label>
        <div className={inputRow}>
          <div className={inputBox({ invalid: urlError !== undefined })}>
            <span aria-hidden className={inputBoxIcon}>
              <Link2 size={13} />
            </span>
            <Input
              {...getInputProps(fields.url, { type: "url" })}
              className={inputBoxField}
              autoComplete="url"
              placeholder="https://example.com/article"
              required
              aria-invalid={urlError !== undefined}
              aria-describedby={
                urlError === undefined ? undefined : fields.url.errorId
              }
              onChange={() => {
                handleFieldChange("url");
              }}
            />
          </div>
          <StyledButton
            type="button"
            size="sm"
            onPress={handleFetchTitle}
            isDisabled={busy}
            aria-busy={isFetchingTitle}
          >
            <Download size={14} aria-hidden />
            {isFetchingTitle ? "取得中…" : "タイトルを取得"}
          </StyledButton>
        </div>
        {urlError === undefined ? null : (
          <p id={fields.url.errorId} className={fieldErr}>
            <CircleAlert size={12} aria-hidden /> {urlError}
          </p>
        )}
      </div>

      <div className={fieldGroup}>
        <label className={flabel} htmlFor={fields.title.id}>
          タイトル
        </label>
        <div className={inputBox({ invalid: titleError !== undefined })}>
          <Input
            {...getInputProps(fields.title, { type: "text" })}
            className={inputBoxField}
            autoComplete="off"
            placeholder="タイトル（URLから自動取得）"
            required
            aria-invalid={titleError !== undefined}
            aria-describedby={
              titleError === undefined ? undefined : fields.title.errorId
            }
            onChange={() => {
              handleFieldChange("title");
            }}
          />
        </div>
        {titleError === undefined ? null : (
          <p id={fields.title.errorId} className={fieldErr}>
            <CircleAlert size={12} aria-hidden /> {titleError}
          </p>
        )}
      </div>
    </>
  );
};
