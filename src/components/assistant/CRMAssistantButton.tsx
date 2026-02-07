import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

export function CRMAssistantButton({ isOpen, onClick }: Props) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
      aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente IA"}
    >
      <Sparkles className={`h-6 w-6 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
    </Button>
  );
}
