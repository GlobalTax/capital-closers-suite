import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Lock, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { FolderTreeNode, DocumentWithVersion } from "@/types/documents";

interface FolderTreeProps {
  folders: FolderTreeNode[];
  unfiledDocuments: DocumentWithVersion[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectDocument: (document: DocumentWithVersion) => void;
  onCreateFolder?: (parentId?: string) => void;
  onRenameFolder?: (folderId: string, currentName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export function FolderTree({
  folders,
  unfiledDocuments,
  selectedFolderId,
  onSelectFolder,
  onSelectDocument,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  return (
    <div className="space-y-1">
      {/* Todos los documentos */}
      <FolderItem
        label="Todos los documentos"
        isSelected={selectedFolderId === null}
        onClick={() => onSelectFolder(null)}
        icon={<Folder className="w-4 h-4" />}
        documentCount={unfiledDocuments.length + folders.reduce((acc, f) => acc + f.documents.length, 0)}
      />

      {/* Carpetas */}
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onSelectDocument={onSelectDocument}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}

      {/* Sin carpeta */}
      {unfiledDocuments.length > 0 && (
        <FolderItem
          label="Sin carpeta"
          isSelected={selectedFolderId === 'unfiled'}
          onClick={() => onSelectFolder('unfiled')}
          icon={<File className="w-4 h-4 text-muted-foreground" />}
          documentCount={unfiledDocuments.length}
        />
      )}

      {/* Botón crear carpeta */}
      {onCreateFolder && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
          onClick={() => onCreateFolder()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva carpeta
        </Button>
      )}
    </div>
  );
}

interface FolderNodeProps {
  folder: FolderTreeNode;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectDocument: (document: DocumentWithVersion) => void;
  onCreateFolder?: (parentId?: string) => void;
  onRenameFolder?: (folderId: string, currentName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

function FolderNode({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
  onSelectDocument,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children.length > 0 || folder.documents.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const isDataRoom = folder.is_data_room;

  return (
    <div>
      <div className="group relative">
        <FolderItem
          label={folder.name}
          isSelected={isSelected}
          onClick={() => onSelectFolder(folder.id)}
          onToggle={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          icon={
            isDataRoom ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : isExpanded ? (
              <FolderOpen className="w-4 h-4 text-primary" />
            ) : (
              <Folder className="w-4 h-4 text-primary" />
            )
          }
          documentCount={folder.documents.length}
          level={level}
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCreateFolder && (
                  <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva subcarpeta
                  </DropdownMenuItem>
                )}
                {onRenameFolder && folder.folder_type === 'custom' && (
                  <DropdownMenuItem onClick={() => onRenameFolder(folder.id, folder.name)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Renombrar
                  </DropdownMenuItem>
                )}
                {onDeleteFolder && folder.folder_type === 'custom' && (
                  <DropdownMenuItem 
                    onClick={() => onDeleteFolder(folder.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ml-4 border-l border-border">
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onSelectDocument={onSelectDocument}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderItemProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  onToggle?: () => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
  icon: React.ReactNode;
  documentCount?: number;
  level?: number;
  actions?: React.ReactNode;
}

function FolderItem({
  label,
  isSelected,
  onClick,
  onToggle,
  isExpanded,
  hasChildren,
  icon,
  documentCount,
  level = 0,
  actions,
}: FolderItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
        isSelected 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-accent text-foreground"
      )}
      style={{ paddingLeft: `${8 + level * 12}px` }}
      onClick={onClick}
    >
      {hasChildren && onToggle ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-0.5 hover:bg-accent rounded"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      ) : (
        <div className="w-4" />
      )}

      {icon}
      
      <span className="flex-1 truncate text-sm font-medium">{label}</span>

      {documentCount !== undefined && documentCount > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {documentCount}
        </Badge>
      )}

      {actions}
    </div>
  );
}
