import { useState, useMemo } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CorporateBuyersKPIs } from "@/components/corporate-buyers/CorporateBuyersKPIs";
import { CorporateBuyersTable } from "@/components/corporate-buyers/CorporateBuyersTable";
import { CorporateBuyerDrawer } from "@/components/corporate-buyers/CorporateBuyerDrawer";

import {
  useCorporateBuyers,
  useCorporateBuyersKPIs,
  useBuyerSourceTags,
} from "@/hooks/queries/useCorporateBuyers";
import type { CorporateBuyer, CorporateBuyersFilters } from "@/types/corporateBuyers";
import { BUYER_TYPE_OPTIONS } from "@/types/corporateBuyers";

export default function CorporateBuyers() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<CorporateBuyer | null>(null);
  const [filters, setFilters] = useState<CorporateBuyersFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search
  const debouncedFilters = useMemo(() => {
    return { ...filters, search: searchTerm || undefined };
  }, [filters, searchTerm]);

  const { data: buyers, isLoading: loadingBuyers } = useCorporateBuyers(debouncedFilters);
  const { data: kpis, isLoading: loadingKPIs } = useCorporateBuyersKPIs();
  const { data: sourceTags } = useBuyerSourceTags();

  const handleNewClick = () => {
    console.log('[corporate-buyers] click new');
    setEditingBuyer(null);
    setDrawerOpen(true);
  };

  const handleEdit = (buyer: CorporateBuyer) => {
    setEditingBuyer(buyer);
    setDrawerOpen(true);
  };

  const handleDrawerClose = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setEditingBuyer(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Directorio Corporativo"
        description="Gestiona compradores corporativos, holdings y family offices"
        icon={Building2}
        actions={
          <Button onClick={handleNewClick} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo
          </Button>
        }
      />

      {/* KPIs */}
      <CorporateBuyersKPIs kpis={kpis} isLoading={loadingKPIs} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={filters.buyer_type || "all"}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              buyer_type: v === "all" ? null : (v as CorporateBuyersFilters["buyer_type"]),
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {BUYER_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.source_tag_id || "all"}
          onValueChange={(v) =>
            setFilters({
              ...filters,
              source_tag_id: v === "all" ? null : v,
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            {sourceTags?.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <CorporateBuyersTable
        buyers={buyers}
        sourceTags={sourceTags}
        isLoading={loadingBuyers}
        onEdit={handleEdit}
      />

      {/* Drawer */}
      <CorporateBuyerDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerClose}
        buyer={editingBuyer}
      />
    </div>
  );
}
