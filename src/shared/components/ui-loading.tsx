import { LoaderCircle } from "lucide-react";

import { skeleton, spinner } from "../../styles/feedback";

export const UiLoading = ({ label = "読み込み中" }: { label?: string }) => (
  <output className={skeleton} aria-live="polite">
    <LoaderCircle size={16} className={spinner} aria-hidden /> {label}
  </output>
);
