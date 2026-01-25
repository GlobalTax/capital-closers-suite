import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Plus, X, Tag, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUYER_TYPE_CONFIG, type BuyerType } from "@/types";

interface TargetQuickTagsProps {
  tags: string[];
  buyerType?: BuyerType;
  distinctTags?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onBuyerTypeChange?: (type: BuyerType | null) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function TargetQuickTags({
  tags,
  buyerType,
  distinctTags = [],
  onAddTag,
  onRemoveTag,
  onBuyerTypeChange,
  readonly = false,
  compact = false,
}: TargetQuickTagsProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      onAddTag(newTagInput.trim());
      setNewTagInput("");
      setIsAddingTag(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      setIsAddingTag(false);
      setNewTagInput("");
    }
  };

  const availableSuggestions = distinctTags.filter(
    t => !tags.includes(t) && t.includes(newTagInput.toLowerCase())
  );

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
      {/* Buyer Type Badge */}
      {buyerType && (
        <Badge
          variant="outline"
          className={cn(
            "text-xs cursor-pointer transition-colors",
            !readonly && "hover:opacity-80"
          )}
          style={{
            borderColor: BUYER_TYPE_CONFIG[buyerType].color,
            color: BUYER_TYPE_CONFIG[buyerType].color,
            backgroundColor: `${BUYER_TYPE_CONFIG[buyerType].color}10`,
          }}
          onClick={() => !readonly && onBuyerTypeChange?.(null)}
        >
          <Building2 className="h-2.5 w-2.5 mr-0.5" />
          {compact ? buyerType.charAt(0).toUpperCase() : BUYER_TYPE_CONFIG[buyerType].label}
          {!readonly && <X className="h-2.5 w-2.5 ml-0.5" />}
        </Badge>
      )}

      {/* Existing Tags */}
      {tags.map(tag => (
        <Badge
          key={tag}
          variant="secondary"
          className={cn(
            "text-xs",
            !readonly && "cursor-pointer hover:bg-secondary/80"
          )}
        >
          <Tag className="h-2.5 w-2.5 mr-0.5" />
          {tag}
          {!readonly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTag(tag);
              }}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </Badge>
      ))}

      {/* Add Tag Dropdown */}
      {!readonly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs">
              <Plus className="h-3 w-3 mr-0.5" />
              {!compact && "Tag"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {/* Input for new tag */}
            <div className="p-2">
              <Input
                placeholder="Nuevo tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-7 text-xs"
                autoFocus
              />
            </div>
            
            {newTagInput.trim() && (
              <DropdownMenuItem onClick={handleAddTag}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                Crear "{newTagInput.trim()}"
              </DropdownMenuItem>
            )}

            {/* Suggestions from existing tags */}
            {availableSuggestions.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Sugerencias</DropdownMenuLabel>
                {availableSuggestions.slice(0, 5).map(suggestion => (
                  <DropdownMenuItem
                    key={suggestion}
                    onClick={() => onAddTag(suggestion)}
                  >
                    <Tag className="h-3.5 w-3.5 mr-2" />
                    {suggestion}
                  </DropdownMenuItem>
                ))}</>
            )}

            {/* Buyer Type Options */}
            {onBuyerTypeChange && !buyerType && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Tipo de comprador</DropdownMenuLabel>
                {(Object.entries(BUYER_TYPE_CONFIG) as [BuyerType, typeof BUYER_TYPE_CONFIG[BuyerType]][]).map(
                  ([type, config]) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => onBuyerTypeChange(type)}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.label}
                    </DropdownMenuItem>
                  )
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
