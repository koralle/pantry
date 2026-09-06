import { TagColorField } from "./tag-color-field";
import { TagPinField } from "./tag-pin-field";
import { TagSortOrderField } from "./tag-sort-order-field";

interface TagEditFieldsProps {
  readonly pinned: boolean;
  readonly color: string | null;
  readonly sortOrder: number;
  readonly onPinnedChange: (pinned: boolean) => void;
  readonly onColorChange: (color: string | null) => void;
  readonly onSortOrderChange: (sortOrder: number) => void;
  readonly disabled?: boolean;
}

export const TagEditFields = ({
  pinned,
  color,
  sortOrder,
  onPinnedChange,
  onColorChange,
  onSortOrderChange,
  disabled = false,
}: TagEditFieldsProps) => (
  <>
    <TagPinField
      pinned={pinned}
      onPinnedChange={onPinnedChange}
      disabled={disabled}
    />
    <TagColorField
      color={color}
      onColorChange={onColorChange}
      disabled={disabled}
    />
    <TagSortOrderField
      sortOrder={sortOrder}
      onSortOrderChange={onSortOrderChange}
      disabled={disabled}
    />
  </>
);
