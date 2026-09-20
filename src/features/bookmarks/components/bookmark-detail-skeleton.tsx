import { detailCenter } from "../../../shared/styles/detail";
import { stateMessage } from "../../../shared/styles/feedback";

export const BookmarkDetailSkeleton = () => (
  <div aria-busy="true" className={detailCenter}>
    <p className={stateMessage}>読み込み中…</p>
  </div>
);
