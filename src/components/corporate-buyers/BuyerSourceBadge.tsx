import { Badge } from "@/components/ui/badge";
import type { BuyerSourceTag } from "@/types/corporateBuyers";

interface BuyerSourceBadgeProps {
  tagId: string | null | undefined;
  tags: BuyerSourceTag[] | undefined;
  className?: string;
}

export function BuyerSourceBadge({ tagId, tags, className }: BuyerSourceBadgeProps) {
  if (!tagId || !tags) {
    return (
      <Badge variant="outline" className={className}>
        Sin origen
      </Badge>
    );
  }

  const tag = tags.find(t => t.id === tagId);
  if (!tag) {
    return (
      <Badge variant="outline" className={className}>
        Sin origen
      </Badge>
    );
  }

  return (
    <Badge
      className={className}
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color || undefined,
        borderColor: tag.color || undefined,
      }}
    >
      {tag.label}
    </Badge>
  );
}
