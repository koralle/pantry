/**
 * @file index.tsx
 *
 * Input:    icon, title, optional description + action node, tone
 * Output:   StateView component
 * Position: Centered display for Empty / Error / NotFound / partial states
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ./index.stories.tsx
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

const box = css({
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  paddingBlock: "10",
  paddingInline: "5",
  rowGap: "2.5",
  textAlign: "center",
});

const iconBadge = css({
  alignItems: "center",
  background: "surface.muted",
  borderColor: "border.default",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "fg.muted",
  display: "inline-flex",
  blockSize: "12",
  inlineSize: "12",
  justifyContent: "center",
  marginBlockEnd: "1",
});

const dangerBadge = css({
  alignItems: "center",
  background: "danger.surface",
  borderColor: "danger.border",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  color: "danger.solid",
  display: "inline-flex",
  blockSize: "12",
  inlineSize: "12",
  justifyContent: "center",
  marginBlockEnd: "1",
});

const titleStyle = css({
  color: "fg.default",
  fontSize: "md",
  fontWeight: "bold",
  margin: "0",
  textWrap: "balance",
});

const descriptionStyle = css({
  color: "fg.muted",
  fontSize: "xs",
  lineHeight: "relaxed",
  margin: "0",
  maxInlineSize: "[24rem]",
  textWrap: "pretty",
});

const actionStyle = css({
  columnGap: "2.5",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  marginBlockStart: "2",
  rowGap: "2.5",
});

export interface StateViewProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}

export const StateView = ({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: StateViewProps) => (
  <div className={cx(box, className)}>
    {Icon ? (
      <span className={tone === "danger" ? dangerBadge : iconBadge}>
        <Icon aria-hidden size={20} />
      </span>
    ) : null}
    <p className={titleStyle}>{title}</p>
    {description ? <p className={descriptionStyle}>{description}</p> : null}
    {action ? <div className={actionStyle}>{action}</div> : null}
  </div>
);
