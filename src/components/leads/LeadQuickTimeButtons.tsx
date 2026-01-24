import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, Video, Users } from "lucide-react";

interface LeadQuickTimeButtonsProps {
  onLogCall: () => void;
  onLogVideoCall: () => void;
  onLogMeeting: () => void;
}

export function LeadQuickTimeButtons({
  onLogCall,
  onLogVideoCall,
  onLogMeeting,
}: LeadQuickTimeButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              onLogCall();
            }}
          >
            <Phone className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Registrar llamada</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={(e) => {
              e.stopPropagation();
              onLogVideoCall();
            }}
          >
            <Video className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Registrar videollamada</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            onClick={(e) => {
              e.stopPropagation();
              onLogMeeting();
            }}
          >
            <Users className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Registrar reunión</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
