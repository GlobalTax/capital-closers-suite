import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserMinus, ChevronDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TeamMember {
  user_id: string;
  full_name: string | null;
}

interface QuickAssignDropdownProps {
  currentAssignee: string | null | undefined;
  onAssign: (userId: string | null) => Promise<void>;
  disabled?: boolean;
}

export function QuickAssignDropdown({ 
  currentAssignee, 
  onAssign,
  disabled = false 
}: QuickAssignDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['admin-users-team'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('user_id, full_name')
        .eq('is_active', true)
        .order('full_name');
      return (data || []) as TeamMember[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentMember = teamMembers.find(m => m.user_id === currentAssignee);
  
  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name?: string | null) => {
    if (!name) return "bg-muted text-muted-foreground";
    const colors = [
      "bg-blue-500/20 text-blue-700 dark:text-blue-300",
      "bg-green-500/20 text-green-700 dark:text-green-300",
      "bg-purple-500/20 text-purple-700 dark:text-purple-300",
      "bg-orange-500/20 text-orange-700 dark:text-orange-300",
      "bg-pink-500/20 text-pink-700 dark:text-pink-300",
      "bg-teal-500/20 text-teal-700 dark:text-teal-300",
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleAssign = async (userId: string | null) => {
    if (userId === currentAssignee) return;
    setIsUpdating(true);
    try {
      await onAssign(userId);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1.5"
          disabled={disabled || isUpdating}
          onClick={(e) => e.stopPropagation()}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentMember ? (
            <>
              <Avatar className={cn("h-5 w-5", getAvatarColor(currentMember.full_name))}>
                <AvatarFallback className="text-[9px] font-medium">
                  {getInitials(currentMember.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs max-w-[80px] truncate hidden sm:inline">
                {currentMember.full_name?.split(' ')[0]}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Sin asignar</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        {teamMembers.map((member) => (
          <DropdownMenuItem
            key={member.user_id}
            onClick={() => handleAssign(member.user_id)}
            className={cn(
              "gap-2 cursor-pointer",
              member.user_id === currentAssignee && "bg-accent"
            )}
          >
            <Avatar className={cn("h-6 w-6", getAvatarColor(member.full_name))}>
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{member.full_name || "Sin nombre"}</span>
          </DropdownMenuItem>
        ))}
        {currentAssignee && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAssign(null)}
              className="gap-2 cursor-pointer text-muted-foreground"
            >
              <UserMinus className="h-4 w-4" />
              <span className="text-sm">Quitar asignación</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
