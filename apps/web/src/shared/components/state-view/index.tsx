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
  paddingInline: "4",
  rowGap: "2",
  textAlign: "center",
});

const iconStyle = css({
  color: "fg.faint",
});

const dangerIconStyle = css({
  color: "danger.solid",
});

const titleStyle = css({
  color: "fg.default",
  fontSize: "sm",
  fontWeight: "semibold",
  margin: "0",
});

const descriptionStyle = css({
  color: "fg.muted",
  fontSize: "xs",
  margin: "0",
});

const actionStyle = css({
  columnGap: "2",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  marginBlockStart: "1",
  rowGap: "2",
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
      <Icon
        aria-hidden
        className={tone === "danger" ? dangerIconStyle : iconStyle}
        size={20}
      />
    ) : null}
    <p className={titleStyle}>{title}</p>
    {description ? <p className={descriptionStyle}>{description}</p> : null}
    {action ? <div className={actionStyle}>{action}</div> : null}
  </div>
);
