import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import RecentActivity from "@/components/recent-activity";
import QuickActions from "@/components/quick-actions";
import ProfileSection from "@/components/profile-section";
import ClassesSection from "@/components/classes-section";
import WorkoutsSection from "@/components/workouts-section";
import MembershipSection from "@/components/membership-section";
import EquipmentSection from "@/components/equipment-section";
import CheckinSection from "@/components/checkin-section";
import AdminLogsSection from "@/components/admin-logs-section";
import { getCurrentUser, clearCurrentUser } from "@/lib/auth";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = getCurrentUser();

  if (!currentUser) {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    clearCurrentUser();
    setLocation("/");
  };

  const sectionTitles = {
    dashboard: "Dashboard",
    profile: "Meu Perfil",
    classes: "Aulas",
    workouts: "Treinos",
    membership: "Planos",
    equipment: "Equipamentos",
    checkin: "Check-in",
    admin: "Logs Admin",
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-8">
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <QuickActions onSectionChange={setActiveSection} />
            </div>
          </div>
        );
      case "profile":
        return <ProfileSection />;
      case "classes":
        return <ClassesSection />;
      case "workouts":
        return <WorkoutsSection />;
      case "membership":
        return <MembershipSection />;
      case "equipment":
        return <EquipmentSection />;
      case "checkin":
        return <CheckinSection />;
      case "admin":
        return <AdminLogsSection />;
      default:
        return <div>Seção não encontrada</div>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-40 lg:hidden"
        onClick={() => setSidebarOpen(true)}
        data-testid="button-menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-card-foreground" data-testid="text-page-title">
              {sectionTitles[activeSection as keyof typeof sectionTitles]}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground" data-testid="text-welcome">
                Bem-vindo, <span data-testid="text-username">{currentUser.name}</span>
              </span>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <i className="fas fa-user text-primary-foreground"></i>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {renderActiveSection()}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
