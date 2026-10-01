import { Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { cx } from "styled-system/css";

import { useIsInbox } from "../../../../../shared/hooks/use-is-inbox";
import { railIcon, railCount, railItem } from "../../../styles";

export const InboxLink = ({ count }: { count: number }) => {
  const isActive = useIsInbox();

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      to="/bookmarks"
      search={{
        view: "inbox",
      }}
      className={railItem({ active: isActive })}
    >
      <Inbox className={cx(railIcon, "pantry-rail-icon")} />
      未整理
      <span className={cx(railCount, "pantry-rail-count")}>{count}</span>
    </Link>
  );
};
