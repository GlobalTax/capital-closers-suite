import type { ElementType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  Users,
  Building2,
  CheckSquare,
  FolderOpen,
  BarChart3,
  LogOut,
  User,
  Moon,
  Sun,
  ShoppingCart,
  TrendingUp,
  Clock,
  Shield,
  Upload,
  UserCog,
  Monitor,
  Target,
  Settings,
  ExternalLink,
  RefreshCw,
  CalendarDays,
  Link2,
  Search,
  Scale,
  Calculator,
  Briefcase,
  ChevronDown,
  Handshake,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuItem {
  title: string;
  url: string;
  icon: ElementType;
  external?: boolean;
}

interface MenuGroup {
  label: string;
  icon: ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    label: "Mandatos M&A",
    icon: Handshake,
    defaultOpen: true,
    items: [
      { title: "Compra", url: "/mandatos?tipo=compra", icon: ShoppingCart },
      { title: "Venta", url: "/mandatos?tipo=venta", icon: TrendingUp },
    ],
  },
  {
    label: "Servicios",
    icon: Briefcase,
    defaultOpen: true,
    items: [
      { title: "Due Diligence", url: "/servicios?tipo=due_diligence", icon: Search },
      { title: "SPA / Legal", url: "/servicios?tipo=spa_legal", icon: Scale },
      { title: "Valoraciones", url: "/servicios?tipo=valoracion", icon: Calculator },
      { title: "Asesoría", url: "/servicios?tipo=asesoria", icon: Briefcase },
    ],
  },
  {
    label: "Gestión",
    icon: ClipboardList,
    defaultOpen: false,
    items: [
      { title: "Dashboard TV", url: "/dashboard-tv", icon: Monitor },
      { title: "Calendario", url: "/calendario", icon: CalendarDays },
      { title: "Mis Horas", url: "/mis-horas", icon: Clock },
      { title: "Contactos", url: "/contactos", icon: Users },
      { title: "Empresas", url: "/empresas", icon: Building2 },
      { title: "Tareas", url: "/tareas", icon: CheckSquare },
      { title: "Documentos", url: "/documentos", icon: FolderOpen },
      { title: "Generador Docs", url: "/gestor-documentos", icon: FileText },
      { title: "Reportes", url: "/reportes", icon: BarChart3 },
    ],
  },
  {
    label: "Plataformas",
    icon: ExternalLink,
    defaultOpen: false,
    items: [
      { title: "AdminWeb", url: "https://capittal.es/admin/login", icon: ExternalLink, external: true },
    ],
  },
];

const adminDashboardGroup: MenuGroup = {
  label: "Dashboard",
  icon: LayoutDashboard,
  defaultOpen: false,
  items: [
    { title: "Configurar TV", url: "/dashboard-tv/configurar", icon: Settings },
  ],
};

const superAdminGroup: MenuGroup = {
  label: "Super Admin",
  icon: ShieldCheck,
  defaultOpen: false,
  items: [
    { title: "Usuarios", url: "/usuarios", icon: UserCog },
    { title: "Gestión de Leads", url: "/gestion-leads", icon: Target },
    { title: "Sync Valoraciones", url: "/sync-valuations", icon: RefreshCw },
    { title: "Integración Brevo", url: "/integraciones/brevo", icon: Link2 },
    { title: "Importar Datos", url: "/importar-datos", icon: Upload },
    { title: "Horas Equipo", url: "/horas-equipo", icon: Users },
    { title: "Audit Logs", url: "/audit-logs", icon: Shield },
  ],
};

export function AppSidebar() {
  const { adminUser, logout } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500/10 text-purple-500';
      case 'admin': return 'bg-blue-500/10 text-blue-500';
      case 'editor': return 'bg-green-500/10 text-green-500';
      case 'viewer': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      case 'viewer': return 'Visor';
      default: return role;
    }
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => {
      if (item.external) return false;
      const [path, query] = item.url.split('?');
      const currentPath = location.pathname;
      const currentSearch = location.search;
      
      if (query) {
        return currentPath === path && currentSearch.includes(query);
      }
      return currentPath === path;
    });
  };

  const isItemActive = (item: MenuItem) => {
    if (item.external) return false;
    const [path, query] = item.url.split('?');
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    if (query) {
      return currentPath === path && currentSearch.includes(query);
    }
    return currentPath === path;
  };

  const renderMenuGroup = (group: MenuGroup, key: string) => {
    const groupIsActive = isGroupActive(group);
    
    // Collapsed mode: show items directly with tooltips
    if (isCollapsed) {
      return (
        <SidebarGroup key={key} className="p-0 px-2">
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  {item.external ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
                    >
                      <item.icon className="w-5 h-5" />
                    </a>
                  ) : (
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-md transition-colors",
                        isItemActive(item)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </NavLink>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      );
    }

    // Expanded mode: show collapsible groups with labels
    return (
      <Collapsible
        key={key}
        defaultOpen={group.defaultOpen || groupIsActive}
        className="group/collapsible"
      >
        <SidebarGroup className="p-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md mx-2 px-3 py-2 text-sidebar-foreground/70 uppercase text-xs font-medium flex items-center justify-between w-auto">
              <div className="flex items-center gap-2">
                <group.icon className="w-4 h-4" />
                <span>{group.label}</span>
              </div>
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent className="px-2 pb-2">
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.external ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                        </a>
                      ) : (
                        <NavLink
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            isItemActive(item)
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  // Build the list of groups to render based on user role
  const groupsToRender = [...menuGroups];
  
  if (adminUser?.role === 'super_admin' || adminUser?.role === 'admin') {
    groupsToRender.push(adminDashboardGroup);
  }
  
  if (adminUser?.role === 'super_admin') {
    groupsToRender.push(superAdminGroup);
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={cn("p-4", isCollapsed && "p-2")}>
        <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-medium text-lg">C</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-sidebar-foreground font-medium text-lg">Capittal CRM</h1>
              <p className="text-sidebar-foreground/60 text-xs">Cierre</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {groupsToRender.map((group, index) => renderMenuGroup(group, `group-${index}`))}
      </SidebarContent>

      <SidebarFooter className={cn("p-4 border-t border-sidebar-border", isCollapsed && "p-2")}>
        {isCollapsed ? (
          // Collapsed mode: show only icons with tooltips
          <div className="flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(adminUser?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                {adminUser?.full_name || 'Usuario'}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink to="/perfil">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">Mi Perfil</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
                  className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  {actualTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {actualTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar Sesión</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          // Expanded mode: show full user info and buttons
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(adminUser?.full_name || null)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {adminUser?.full_name || 'Usuario'}
                </p>
                <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(adminUser?.role || '')}`}>
                  {getRoleLabel(adminUser?.role || '')}
                </Badge>
              </div>
            </div>
            
            <NavLink to="/perfil">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </Button>
            </NavLink>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {actualTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {actualTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
