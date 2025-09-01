import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Plus, Play, TrendingUp } from "lucide-react";

interface QuickActionsProps {
  onSectionChange: (section: string) => void;
}

export default function QuickActions({ onSectionChange }: QuickActionsProps) {
  const actions = [
    {
      title: "Check-in",
      icon: LogIn,
      color: "text-primary",
      bgColor: "bg-primary/5 hover:bg-primary/10",
      section: "checkin",
    },
    {
      title: "Agendar Aula",
      icon: Plus,
      color: "text-green-500",
      bgColor: "bg-green-500/5 hover:bg-green-500/10",
      section: "classes",
    },
    {
      title: "Novo Treino",
      icon: Play,
      color: "text-orange-500",
      bgColor: "bg-orange-500/5 hover:bg-orange-500/10",
      section: "workouts",
    },
    {
      title: "Ver Progresso",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/5 hover:bg-purple-500/10",
      section: "workouts",
    },
  ];

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader>
        <CardTitle data-testid="text-actions-title">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onSectionChange(action.section)}
                className={`flex flex-col items-center p-4 h-auto ${action.bgColor} transition-colors`}
                data-testid={`button-action-${action.section}`}
              >
                <Icon className={`${action.color} h-6 w-6 mb-2`} />
                <span className="text-sm font-medium text-card-foreground">
                  {action.title}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
