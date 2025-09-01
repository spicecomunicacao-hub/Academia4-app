import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Users, MapPin } from "lucide-react";

export default function ClassesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [selectedDate, setSelectedDate] = useState("today");

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const getDateForFilter = () => {
    switch (selectedDate) {
      case "today":
        return today;
      case "tomorrow":
        return tomorrow;
      default:
        return today;
    }
  };

  const { data: classes, isLoading } = useQuery({
    queryKey: ["/api/classes", `date=${getDateForFilter()}`],
  });

  const { data: userBookings } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "bookings"],
    enabled: !!currentUser,
  });

  const bookClassMutation = useMutation({
    mutationFn: (classId: string) =>
      apiRequest("POST", `/api/classes/${classId}/book`, { userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "bookings"] });
      toast({
        title: "Aula agendada!",
        description: "Sua aula foi agendada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: error.message || "Não foi possível agendar a aula",
      });
    },
  });

  const cancelClassMutation = useMutation({
    mutationFn: (classId: string) =>
      apiRequest("DELETE", `/api/classes/${classId}/book`, { userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "bookings"] });
      toast({
        title: "Aula cancelada",
        description: "Sua aula foi cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar",
        description: error.message || "Não foi possível cancelar a aula",
      });
    },
  });

  const isUserBooked = (classId: string) => {
    return (userBookings as any[])?.some((booking: any) => 
      booking.classId === classId && booking.status === "booked"
    );
  };

  const getClassStatus = (cls: any) => {
    if (isUserBooked(cls.id)) return "booked";
    if (cls.currentParticipants >= cls.maxParticipants) return "full";
    return "available";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "booked":
        return <Badge variant="secondary" data-testid="badge-booked">Agendado</Badge>;
      case "full":
        return <Badge variant="destructive" data-testid="badge-full">Lotado</Badge>;
      default:
        return <Badge className="bg-green-500/10 text-green-600" data-testid="badge-available">Disponível</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse" data-testid={`skeleton-class-${i}`}>
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-4"></div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
              <div className="h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-semibold text-card-foreground" data-testid="text-classes-title">
          Agenda de Aulas
        </h3>
        <div className="flex space-x-2">
          <Button
            variant={selectedDate === "today" ? "default" : "secondary"}
            onClick={() => setSelectedDate("today")}
            data-testid="button-filter-today"
          >
            Hoje
          </Button>
          <Button
            variant={selectedDate === "tomorrow" ? "default" : "secondary"}
            onClick={() => setSelectedDate("tomorrow")}
            data-testid="button-filter-tomorrow"
          >
            Amanhã
          </Button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(classes as any[])?.length > 0 ? (
          (classes as any[]).map((cls: any, index: number) => {
            const status = getClassStatus(cls);
            return (
              <Card key={cls.id} data-testid={`card-class-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-card-foreground" data-testid={`text-class-name-${index}`}>
                        {cls.name}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid={`text-class-instructor-${index}`}>
                        com {cls.instructor}
                      </p>
                    </div>
                    {getStatusBadge(status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      <span data-testid={`text-class-time-${index}`}>
                        {cls.startTime} - {cls.endTime}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span data-testid={`text-class-participants-${index}`}>
                        {cls.currentParticipants}/{cls.maxParticipants} participantes
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span data-testid={`text-class-room-${index}`}>{cls.room}</span>
                    </div>
                  </div>

                  {status === "booked" ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => cancelClassMutation.mutate(cls.id)}
                      disabled={cancelClassMutation.isPending}
                      data-testid={`button-cancel-${index}`}
                    >
                      {cancelClassMutation.isPending ? "Cancelando..." : "Cancelar"}
                    </Button>
                  ) : status === "full" ? (
                    <Button variant="secondary" className="w-full" disabled data-testid={`button-waitlist-${index}`}>
                      Lista de Espera
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => bookClassMutation.mutate(cls.id)}
                      disabled={bookClassMutation.isPending}
                      data-testid={`button-book-${index}`}
                    >
                      {bookClassMutation.isPending ? "Agendando..." : "Agendar"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground" data-testid="text-no-classes">
              Nenhuma aula disponível para a data selecionada
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
