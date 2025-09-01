import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { Dumbbell, Calendar, Crown, CalendarX } from "lucide-react";

export default function DashboardStats() {
  const currentUser = getCurrentUser();

  const { data: workouts } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "workouts"],
    enabled: !!currentUser,
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "bookings"],
    enabled: !!currentUser,
  });

  const currentMonth = new Date().getMonth();
  const workoutsThisMonth = (workouts as any[])?.filter((workout: any) => {
    const workoutMonth = new Date(workout.date).getMonth();
    return workoutMonth === currentMonth;
  }).length || 0;

  const upcomingClasses = (bookings as any[])?.filter((booking: any) => booking.status === "booked").length || 0;

  const stats = [
    {
      title: "Treinos este Mês",
      value: workoutsThisMonth,
      icon: Dumbbell,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Aulas Agendadas",
      value: upcomingClasses,
      icon: Calendar,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Plano Atual",
      value: currentUser?.planId === "premium" ? "Premium" : currentUser?.planId === "vip" ? "VIP" : "Básico",
      icon: Crown,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Dias até Renovação",
      value: "15",
      icon: CalendarX,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground" data-testid={`stat-title-${index}`}>
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-card-foreground" data-testid={`stat-value-${index}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.color} h-6 w-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
