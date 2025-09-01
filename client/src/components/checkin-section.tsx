import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { DoorOpen, DoorClosed, LogIn, LogOut, Calendar } from "lucide-react";

export default function CheckinSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  const { data: activeCheckin } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "checkins", "active"],
    enabled: !!currentUser,
  });

  const { data: checkinHistory } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "checkins"],
    enabled: !!currentUser,
  });

  const checkinMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/checkins", { userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "checkins"] });
      toast({
        title: "Check-in realizado!",
        description: "Bom treino!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no check-in",
        description: error.message || "Não foi possível realizar o check-in",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/checkins/${(activeCheckin as any)?.id}/checkout`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "checkins"] });
      toast({
        title: "Check-out realizado!",
        description: "Até a próxima!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no check-out",
        description: error.message || "Não foi possível realizar o check-out",
      });
    },
  });

  const isCheckedIn = !!activeCheckin;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    return date.toLocaleDateString("pt-BR");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Check-in Status */}
      <Card data-testid="card-checkin-status">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className={`w-20 h-20 ${isCheckedIn ? "bg-red-500/10" : "bg-green-500/10"} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {isCheckedIn ? (
                <DoorClosed className="text-red-500 h-8 w-8" />
              ) : (
                <DoorOpen className="text-green-500 h-8 w-8" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2" data-testid="text-checkin-status">
              Você está {isCheckedIn ? "NA academia" : "FORA da academia"}
            </h3>
            <p className="text-muted-foreground" data-testid="text-checkin-subtitle">
              {isCheckedIn
                ? `Check-in realizado às ${activeCheckin ? formatTime((activeCheckin as any).checkinTime) : ""}`
                : "Faça seu check-in para começar o treino"}
            </p>
          </div>

          <Button
            size="lg"
            variant={isCheckedIn ? "destructive" : "default"}
            onClick={() => isCheckedIn ? checkoutMutation.mutate() : checkinMutation.mutate()}
            disabled={checkinMutation.isPending || checkoutMutation.isPending}
            className="px-8 py-3 text-lg font-semibold"
            data-testid="button-checkin-toggle"
          >
            {checkinMutation.isPending || checkoutMutation.isPending ? (
              "Carregando..."
            ) : isCheckedIn ? (
              <>
                <LogOut className="mr-2 h-5 w-5" />
                Fazer Check-out
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Fazer Check-in
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Check-in History */}
      <Card data-testid="card-checkin-history">
        <CardContent className="pb-0">
          <h3 className="font-semibold text-lg mb-4" data-testid="text-checkin-history-title">Histórico de Visitas</h3>
        </CardContent>
        <CardContent>
          <div className="space-y-4">
            {(checkinHistory as any[])?.length > 0 ? (
              (checkinHistory as any[]).slice(0, 10).map((visit: any, index: number) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  data-testid={`checkin-history-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground" data-testid={`checkin-date-${index}`}>
                        {formatDate(visit.checkinTime)}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`checkin-time-${index}`}>
                        {formatTime(visit.checkinTime)} - {visit.checkoutTime ? formatTime(visit.checkoutTime) : "Em andamento"} 
                        {visit.duration && ` (${Math.floor(visit.duration / 60)}h ${visit.duration % 60}m)`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={visit.checkoutTime ? "default" : "secondary"}
                    data-testid={`checkin-status-${index}`}
                  >
                    {visit.checkoutTime ? "Concluído" : "Em andamento"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-checkins">
                  Nenhum histórico de check-in ainda
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Faça seu primeiro check-in para começar!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
