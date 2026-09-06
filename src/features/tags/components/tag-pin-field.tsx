import { Pin, PinOff } from "lucide-react";

import { StyledButton } from "../../../shared/components/styled-button";
import { field, fieldLabel } from "../../../styles/form";

interface TagPinFieldProps {
  readonly pinned: boolean;
  readonly onPinnedChange: (pinned: boolean) => void;
  readonly disabled?: boolean;
}

const pinLabel = (pinned: boolean): string => {
  if (pinned) {
    return "ピン留め中";
  }
  return "ピン留めする";
};

export const TagPinField = ({
  pinned,
  onPinnedChange,
  disabled = false,
}: TagPinFieldProps) => (
  <div className={field}>
    <span className={fieldLabel} id="tag-pinned-label">
      ピン留め
    </span>
    <StyledButton
      aria-pressed={pinned}
      aria-labelledby="tag-pinned-label"
      isDisabled={disabled}
      onPress={() => {
        onPinnedChange(!pinned);
      }}
    >
      {pinned ? (
        <PinOff size={16} aria-hidden />
      ) : (
        <Pin size={16} aria-hidden />
      )}{" "}
      {pinLabel(pinned)}
    </StyledButton>
  </div>
);
