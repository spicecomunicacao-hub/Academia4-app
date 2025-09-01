import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { CheckCircle, Calendar, Trophy } from "lucide-react";

export default function RecentActivity() {
  const currentUser = getCurrentUser();

  const { data: workouts } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "workouts"],
    enabled: !!currentUser,
  });

  const { data: checkins } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "checkins"],
    enabled: !!currentUser,
  });

  // Create activity feed from workouts and checkins
  const activities = [];
  
  if (workouts && (workouts as any[]).length > 0) {
    const latestWorkout = (workouts as any[])[0];
    activities.push({
      type: "workout",
      title: latestWorkout.name,
      time: "Hoje às 14:30",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    });
  }

  activities.push({
    type: "booking",
    title: "Aula de Yoga agendada",
    time: "Amanhã às 19:00",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10",
  });

  if (workouts && (workouts as any[]).length >= 10) {
    activities.push({
      type: "achievement",
      title: "Meta de 10 treinos atingida!",
      time: "Ontem",
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    });
  }

  return (
    <Card data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle data-testid="text-activity-title">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-3" data-testid={`activity-${index}`}>
                  <div className={`w-8 h-8 ${activity.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`${activity.color} h-4 w-4`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground" data-testid={`activity-title-${index}`}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-4" data-testid="text-no-activity">
              Nenhuma atividade recente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
