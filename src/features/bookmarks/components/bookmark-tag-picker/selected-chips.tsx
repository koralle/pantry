import { X } from "lucide-react";

import { TagDot } from "../../../../shared/components/tag-chip";
import { toneFor } from "../../../../styles/domain-tone";
import { tchip, tchipName, tchipRemove } from "../../../../styles/form-screen";
import type { NamedTag } from "./lib";

interface SelectedTagChipsProps {
  readonly selectedTags: readonly NamedTag[];
  readonly onRemoveTag: (tag: NamedTag) => void;
}

export const SelectedTagChips = ({
  selectedTags,
  onRemoveTag,
}: SelectedTagChipsProps) => (
  <>
    {selectedTags.map((tag) => (
      <span key={tag.id} className={tchip}>
        <TagDot tone={toneFor(tag.name)} />
        <span className={tchipName}>{tag.name}</span>
        <button
          type="button"
          className={tchipRemove}
          aria-label={`${tag.name}を外す`}
          onClick={() => {
            onRemoveTag(tag);
          }}
        >
          <X size={10} aria-hidden />
        </button>
      </span>
    ))}
  </>
);
