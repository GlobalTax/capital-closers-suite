import { useState } from "react";
import { Plus, Trash2, Columns, Rows, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface TableData {
  headers: string[];
  rows: string[][];
  highlightColumn?: number;
  showRowNumbers?: boolean;
  caption?: string;
}

interface TableEditorProps {
  table: TableData | undefined;
  onUpdate: (table: TableData) => void;
}

const DEFAULT_TABLE: TableData = {
  headers: ['Métrica', 'FY22', 'FY23', 'FY24'],
  rows: [
    ['Revenue', '€35M', '€42M', '€52M'],
    ['EBITDA', '€6M', '€8M', '€11M'],
    ['Margin', '17%', '19%', '21%'],
  ],
  highlightColumn: 3,
  showRowNumbers: false,
};

export function TableEditor({ table, onUpdate }: TableEditorProps) {
  const data = table || DEFAULT_TABLE;
  
  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...data.headers];
    newHeaders[index] = value;
    onUpdate({ ...data, headers: newHeaders });
  };
  
  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = data.rows.map((row, ri) => 
      ri === rowIndex 
        ? row.map((cell, ci) => ci === colIndex ? value : cell)
        : row
    );
    onUpdate({ ...data, rows: newRows });
  };
  
  const addColumn = () => {
    const newHeaders = [...data.headers, `Col ${data.headers.length + 1}`];
    const newRows = data.rows.map(row => [...row, '']);
    onUpdate({ ...data, headers: newHeaders, rows: newRows });
  };
  
  const removeColumn = (index: number) => {
    if (data.headers.length <= 2) return;
    const newHeaders = data.headers.filter((_, i) => i !== index);
    const newRows = data.rows.map(row => row.filter((_, i) => i !== index));
    const newHighlight = data.highlightColumn === index 
      ? undefined 
      : data.highlightColumn && data.highlightColumn > index 
        ? data.highlightColumn - 1 
        : data.highlightColumn;
    onUpdate({ ...data, headers: newHeaders, rows: newRows, highlightColumn: newHighlight });
  };
  
  const addRow = () => {
    const newRows = [...data.rows, new Array(data.headers.length).fill('')];
    onUpdate({ ...data, rows: newRows });
  };
  
  const removeRow = (index: number) => {
    if (data.rows.length <= 1) return;
    const newRows = data.rows.filter((_, i) => i !== index);
    onUpdate({ ...data, rows: newRows });
  };
  
  const toggleHighlight = (colIndex: number) => {
    onUpdate({ 
      ...data, 
      highlightColumn: data.highlightColumn === colIndex ? undefined : colIndex 
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Tabla de datos</Label>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={addColumn}>
            <Columns className="h-4 w-4 mr-1" />
            Columna
          </Button>
          <Button variant="ghost" size="sm" onClick={addRow}>
            <Rows className="h-4 w-4 mr-1" />
            Fila
          </Button>
        </div>
      </div>
      
      {/* Table Preview/Editor */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {data.showRowNumbers && <th className="w-8 p-2 text-center">#</th>}
              {data.headers.map((header, i) => (
                <th key={i} className="p-1 relative group">
                  <div className="flex items-center gap-1">
                    <Input
                      value={header}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      className={cn(
                        "h-8 text-center font-medium",
                        data.highlightColumn === i && "bg-primary/10 border-primary"
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => toggleHighlight(i)}
                      title={data.highlightColumn === i ? "Quitar destacado" : "Destacar columna"}
                    >
                      <Sparkles className={cn(
                        "h-3 w-3",
                        data.highlightColumn === i && "text-primary"
                      )} />
                    </Button>
                    {data.headers.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => removeColumn(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className="group border-t">
                {data.showRowNumbers && (
                  <td className="w-8 p-2 text-center text-muted-foreground">{ri + 1}</td>
                )}
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className={cn(
                        "h-8",
                        data.highlightColumn === ci && "bg-primary/5"
                      )}
                    />
                  </td>
                ))}
                <td className="w-8">
                  {data.rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeRow(ri)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Options */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={data.showRowNumbers || false}
            onCheckedChange={(checked) => onUpdate({ ...data, showRowNumbers: checked })}
          />
          <Label className="text-sm">Números de fila</Label>
        </div>
      </div>
      
      {/* Caption */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Caption (opcional)</Label>
        <Input
          value={data.caption || ''}
          onChange={(e) => onUpdate({ ...data, caption: e.target.value })}
          placeholder="Fuente: Datos internos FY24"
          className="text-sm"
        />
      </div>
    </div>
  );
}

export default TableEditor;
