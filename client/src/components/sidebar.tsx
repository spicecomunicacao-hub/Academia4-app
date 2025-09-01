import { Button } from "@/components/ui/button";
import { X, LayoutDashboard, User, Calendar, Dumbbell, CreditCard, Wrench, Clock, LogOut, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, onLogout, isOpen, onClose }: SidebarProps) {
  const currentUser = getCurrentUser();
  const isAdmin = (currentUser as any)?.isAdmin;
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "Meu Perfil", icon: User },
    { id: "classes", label: "Aulas", icon: Calendar },
    { id: "workouts", label: "Treinos", icon: Dumbbell },
    { id: "membership", label: "Planos", icon: CreditCard },
    { id: "equipment", label: "Equipamentos", icon: Wrench },
    { id: "checkin", label: "Check-in", icon: Clock },
    ...(isAdmin ? [{ id: "admin", label: "Logs Admin", icon: Shield }] : []),
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 bg-primary text-primary-foreground transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      data-testid="sidebar"
    >
      <div className="flex items-center justify-between p-4 border-b border-primary-foreground/20">
        <h1 className="text-xl font-bold" data-testid="text-sidebar-title">SportFitness</h1>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
          onClick={onClose}
          data-testid="button-close-sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                onClose();
              }}
              className={`w-full flex items-center px-4 py-3 text-left text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors ${
                isActive ? "border-r-2 border-primary-foreground text-primary-foreground" : ""
              }`}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button
          onClick={onLogout}
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
