import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Globe } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { BuyerSourceBadge } from "./BuyerSourceBadge";
import type { CorporateBuyer, BuyerSourceTag } from "@/types/corporateBuyers";
import { getBuyerTypeLabel } from "@/types/corporateBuyers";
import { useDeleteCorporateBuyer } from "@/hooks/queries/useCorporateBuyers";

interface CorporateBuyersTableProps {
  buyers: CorporateBuyer[] | undefined;
  sourceTags: BuyerSourceTag[] | undefined;
  isLoading: boolean;
  onEdit: (buyer: CorporateBuyer) => void;
}

export function CorporateBuyersTable({ 
  buyers, 
  sourceTags,
  isLoading, 
  onEdit 
}: CorporateBuyersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<CorporateBuyer | null>(null);
  const deleteMutation = useDeleteCorporateBuyer();

  const handleDelete = async () => {
    if (!buyerToDelete) return;
    await deleteMutation.mutateAsync(buyerToDelete.id);
    setDeleteDialogOpen(false);
    setBuyerToDelete(null);
  };

  const formatRange = (min: number | null, max: number | null): string => {
    if (min && max) return `${min}M - ${max}M €`;
    if (min) return `> ${min}M €`;
    if (max) return `< ${max}M €`;
    return "-";
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Sectores</TableHead>
              <TableHead>EBITDA</TableHead>
              <TableHead>Deal Size</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(8)].map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!buyers || buyers.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No hay compradores corporativos que coincidan con los filtros
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Sectores</TableHead>
              <TableHead>EBITDA</TableHead>
              <TableHead>Deal Size</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyers.map((buyer) => (
              <TableRow key={buyer.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {buyer.name}
                    {buyer.website && (
                      <a
                        href={buyer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Globe className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getBuyerTypeLabel(buyer.buyer_type)}
                  </Badge>
                </TableCell>
                <TableCell>{buyer.country_base || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {buyer.sector_focus?.slice(0, 2).map((sector) => (
                      <Badge key={sector} variant="outline" className="text-xs">
                        {sector}
                      </Badge>
                    ))}
                    {buyer.sector_focus && buyer.sector_focus.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{buyer.sector_focus.length - 2}
                      </Badge>
                    )}
                    {!buyer.sector_focus?.length && "-"}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatRange(buyer.ebitda_min, buyer.ebitda_max)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatRange(buyer.deal_size_min, buyer.deal_size_max)}
                </TableCell>
                <TableCell>
                  <BuyerSourceBadge 
                    tagId={buyer.source_tag_id} 
                    tags={sourceTags}
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(buyer)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setBuyerToDelete(buyer);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comprador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a "{buyerToDelete?.name}" del directorio.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
