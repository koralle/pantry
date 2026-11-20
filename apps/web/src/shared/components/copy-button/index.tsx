import { Check, CircleAlert, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { iconButton } from "../icon-button/styles";

const RESET_MS = 2000;
const FAILED_LABEL = "コピーに失敗しました";

/** 状態ごとのアイコン。三元演算子の入れ子を避けるため表で持つ。 */
const ICONS = {
  copied: <Check aria-hidden size={14} />,
  failed: <CircleAlert aria-hidden size={14} />,
  idle: <Copy aria-hidden size={14} />,
};

const copyWrap = css({
  display: "inline-flex",
  flexShrink: "0",
  position: "relative",
});

export interface CopyButtonProps {
  /** クリップボードへ書き込む値 */
  readonly value: string;
  /** ボタンのアクセシブル名 */
  readonly label?: string | undefined;
  /** コピー成功時のスクリーンリーダー読み上げ文言 */
  readonly announcement?: string | undefined;
}

export const CopyButton = ({
  value,
  label = "コピー",
  announcement = "コピーしました",
}: CopyButtonProps) => {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [liveMessage, setLiveMessage] = useState("");
  const repeatFlagRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  const scheduleReset = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setStatus("idle");
      timerRef.current = null;
    }, RESET_MS);
  };

  const announce = (base: string) => {
    repeatFlagRef.current = !repeatFlagRef.current;
    // 同一文言の連続コピーでもスクリーンリーダーが再読み上げするよう末尾を交互に変える。
    setLiveMessage(repeatFlagRef.current ? base : `${base}\u00A0`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      announce(announcement);
      scheduleReset();
    } catch {
      setStatus("failed");
      announce(FAILED_LABEL);
      scheduleReset();
    }
  };

  const labelFor = { copied: announcement, failed: FAILED_LABEL, idle: label };
  const buttonLabel = labelFor[status];

  return (
    <span className={copyWrap}>
      <button
        aria-label={buttonLabel}
        className={iconButton({ active: status === "copied", size: "sm" })}
        onClick={() => {
          void handleCopy();
        }}
        title={buttonLabel}
        type="button"
      >
        {ICONS[status]}
      </button>
      <output aria-live="polite" className={visuallyHidden()}>
        {liveMessage}
      </output>
    </span>
  );
};
