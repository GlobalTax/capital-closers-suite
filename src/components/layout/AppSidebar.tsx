import { NavLink } from "react-router-dom";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mandatosItems = [
  { title: "Mandatos Compra", url: "/mandatos?tipo=compra", icon: ShoppingCart },
  { title: "Mandatos Venta", url: "/mandatos?tipo=venta", icon: TrendingUp },
];

const otherMenuItems = [
  { title: "Mis Horas", url: "/mis-horas", icon: Clock },
  { title: "Contactos", url: "/contactos", icon: Users },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Tareas", url: "/tareas", icon: CheckSquare },
  { title: "Documentos", url: "/documentos", icon: FolderOpen },
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
];

const superAdminItems = [
  { title: "Usuarios", url: "/usuarios", icon: UserCog },
  { title: "Importar Datos", url: "/importar-datos", icon: Upload },
  { title: "Horas Equipo", url: "/horas-equipo", icon: Users },
  { title: "Audit Logs", url: "/audit-logs", icon: Shield },
];

export function AppSidebar() {
  const { adminUser, logout } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();

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

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-semibold text-lg">Capittal CRM</h1>
            <p className="text-sidebar-foreground/60 text-xs">Cierre</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-medium px-3">
            Mandatos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mandatosItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-medium px-3">
            Gestión
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminUser?.role === 'super_admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs font-medium px-3">
              Super Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          }`
                        }
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
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
      </SidebarFooter>
    </Sidebar>
  );
}
