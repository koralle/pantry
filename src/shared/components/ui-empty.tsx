import { CircleDashed } from "lucide-react";
import type { ReactNode } from "react";

import { stateBox, stateMessage } from "../../styles/feedback";

export const UiEmpty = ({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) => (
  <div className={stateBox}>
    <CircleDashed size={20} aria-hidden />
    <p className={stateMessage}>{title}</p>
    {action}
  </div>
);
