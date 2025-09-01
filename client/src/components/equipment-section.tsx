import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function EquipmentSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["/api/equipment"],
  });

  const reserveEquipmentMutation = useMutation({
    mutationFn: (equipmentId: string) =>
      apiRequest("PUT", `/api/equipment/${equipmentId}/reserve`, { userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Equipamento reservado!",
        description: "Você tem 1 hora para usar o equipamento.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao reservar",
        description: error.message || "Não foi possível reservar o equipamento",
      });
    },
  });

  // Group equipment by category
  const equipmentByCategory = (equipment as any[])?.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {}) || {};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500/10 text-green-600" data-testid="badge-available">Livre</Badge>;
      case "occupied":
        return <Badge variant="destructive" data-testid="badge-occupied">Ocupado</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500/10 text-yellow-600" data-testid="badge-maintenance">Manutenção</Badge>;
      case "reserved":
        return <Badge variant="secondary" data-testid="badge-reserved">Reservado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryStatus = (items: any[]) => {
    const available = items.filter(item => item.status === "available").length;
    const total = items.length;
    
    if (available === 0) return { label: "Indisponível", variant: "destructive" as const };
    if (available === total) return { label: "Disponível", variant: "default" as const };
    return { label: "Parcial", variant: "secondary" as const };
  };

  const canReserve = (items: any[]) => {
    return items.some(item => item.status === "available");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-card-foreground" data-testid="text-equipment-title">
          Disponibilidade de Equipamentos
        </h3>
        <p className="text-muted-foreground" data-testid="text-equipment-subtitle">
          Verifique quais equipamentos estão disponíveis em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(equipmentByCategory).map(([category, items], categoryIndex) => {
          const categoryStatus = getCategoryStatus(items as any[]);
          
          return (
            <Card key={category} data-testid={`card-equipment-category-${categoryIndex}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-card-foreground" data-testid={`text-category-name-${categoryIndex}`}>
                    {category}
                  </h4>
                  <Badge
                    variant={categoryStatus.variant}
                    data-testid={`badge-category-status-${categoryIndex}`}
                  >
                    {categoryStatus.label}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {(items as any[]).map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between"
                      data-testid={`equipment-item-${categoryIndex}-${itemIndex}`}
                    >
                      <span className="text-sm text-muted-foreground" data-testid={`equipment-name-${categoryIndex}-${itemIndex}`}>
                        {item.name}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full mt-4"
                  disabled={!canReserve(items as any[]) || reserveEquipmentMutation.isPending}
                  onClick={() => {
                    const availableItem = (items as any[]).find(item => item.status === "available");
                    if (availableItem) {
                      reserveEquipmentMutation.mutate(availableItem.id);
                    }
                  }}
                  data-testid={`button-reserve-${categoryIndex}`}
                >
                  {reserveEquipmentMutation.isPending
                    ? "Reservando..."
                    : canReserve(items as any[])
                    ? "Reservar"
                    : "Indisponível"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
