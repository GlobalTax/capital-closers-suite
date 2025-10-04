import { ReactNode } from "react";

interface ToolbarProps {
  filtros?: ReactNode;
  acciones?: ReactNode;
}

export function Toolbar({ filtros, acciones }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
      <div className="flex items-center gap-2 flex-1">{filtros}</div>
      <div className="flex items-center gap-2">{acciones}</div>
    </div>
  );
}
