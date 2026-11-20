import { CircleAlert, CircleCheck } from "lucide-react";
import { css, cx } from "styled-system/css";

import { flash } from "../../../../shared/styles/flash";
import {
  formSummary,
  formSummaryIcon,
  formSummaryText,
} from "../../../../shared/styles/form";

const passkeyFeedback = css({
  fontSize: "xs",
  marginBlockEnd: "3",
});

/** パスキー操作の結果表示（失敗 → alert、成功 → flash）。 */
export const PasskeyFeedback = ({
  errorMessage,
  statusMessage,
}: {
  readonly errorMessage: string | null;
  readonly statusMessage: string | null;
}) => (
  <>
    {errorMessage === null ? null : (
      <div
        className={cx(formSummary, passkeyFeedback)}
        role="alert"
        aria-live="polite"
      >
        <CircleAlert aria-hidden className={formSummaryIcon} size={14} />
        <p className={formSummaryText}>{errorMessage}</p>
      </div>
    )}

    {statusMessage === null ? null : (
      <output className={cx(flash, passkeyFeedback)} aria-live="polite">
        <CircleCheck
          size={14}
          aria-hidden
          className={css({ verticalAlign: "-2px" })}
        />{" "}
        {statusMessage}
      </output>
    )}
  </>
);
