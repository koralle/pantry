import { useSuspenseQuery } from "@tanstack/react-query";

import { orpc } from "../../../../../rpc/query";
import { FavoriteLink } from "./favorite";
import { HistoryLink } from "./history";
import { InboxLink } from "./inbox";

export const ViewLinks = () => {
  const { data: counts } = useSuspenseQuery(
    orpc.bookmarks.counts.queryOptions({ staleTime: 5000 })
  );

  return (
    <>
      <HistoryLink count={counts.recent} />
      <InboxLink count={counts.inbox} />
      <FavoriteLink count={counts.favorites} />
    </>
  );
};

export const ViewLinksSkelton = () => (
  <>
    <HistoryLink count={0} />
    <InboxLink count={0} />
    <FavoriteLink count={0} />
  </>
);
