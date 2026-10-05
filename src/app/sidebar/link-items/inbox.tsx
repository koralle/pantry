import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { cx } from "styled-system/css";

import {
  railItem,
  railIcon,
  railCount,
} from "../../../features/app-shell/styles";
import { orpc } from "../../../rpc/query";
import { useIsInbox } from "../../../shared/hooks/use-is-inbox";

interface InboxBookmarkCountProps {
  render: (count: number) => ReactNode;
}

const InboxBookmarkCount = ({ render }: InboxBookmarkCountProps): ReactNode => {
  const { data: count } = useSuspenseQuery(
    orpc.bookmarks.counts.inbox.queryOptions({ staleTime: 5000 })
  );

  return render(count);
};

export const InboxBookmarkLink = () => {
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
      <ErrorBoundary
        fallback={<span className={cx(railCount, "pantry-rail-count")}>0</span>}
      >
        <Suspense>
          <InboxBookmarkCount
            render={(count) => (
              <span className={cx(railCount, "pantry-rail-count")}>
                {count}
              </span>
            )}
          />
        </Suspense>
      </ErrorBoundary>
    </Link>
  );
};
