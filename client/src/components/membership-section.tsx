import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { Crown, Check, X } from "lucide-react";

export default function MembershipSection() {
  const currentUser = getCurrentUser();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/plans"],
  });

  const currentPlan = (plans as any[])?.find((plan: any) => plan.id === currentUser?.planId);

  const formatPrice = (price: number) => {
    return `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Current Plan */}
      <Card data-testid="card-current-plan">
        <CardHeader>
          <CardTitle data-testid="text-current-plan-title">Plano Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Crown className="text-yellow-500 h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-bold text-card-foreground" data-testid="text-current-plan-name">
                    {currentPlan?.name || "Plano não encontrado"}
                  </p>
                  <p className="text-muted-foreground" data-testid="text-current-plan-description">
                    {currentPlan?.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-card-foreground" data-testid="text-current-plan-price">
                {currentPlan ? formatPrice(currentPlan.monthlyPrice) : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">por mês</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Próxima cobrança</span>
              <span className="text-sm font-medium text-card-foreground" data-testid="text-next-billing">
                25/02/2024
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Método de pagamento</span>
              <span className="text-sm font-medium text-card-foreground" data-testid="text-payment-method">
                •••• 1234
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card data-testid="card-available-plans">
        <CardHeader>
          <CardTitle data-testid="text-available-plans-title">Outros Planos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(plans as any[])?.map((plan: any, index: number) => {
              const isCurrent = plan.id === currentUser?.planId;
              
              return (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 hover:shadow-md transition-shadow relative ${
                    isCurrent ? "border-2 border-primary" : "border border-border"
                  }`}
                  data-testid={`plan-card-${index}`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground" data-testid="badge-current-plan">
                        ATUAL
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-lg text-card-foreground" data-testid={`plan-name-${index}`}>
                      {plan.name}
                    </h4>
                    <p className="text-3xl font-bold text-primary mt-2" data-testid={`plan-price-${index}`}>
                      {formatPrice(plan.monthlyPrice)}
                    </p>
                    <p className="text-sm text-muted-foreground">por mês</p>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <Check className="text-green-500 mr-2 h-4 w-4" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent}
                    data-testid={`button-select-plan-${index}`}
                  >
                    {isCurrent ? "Plano Atual" : plan.id === "vip" ? "Upgrade" : "Selecionar"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
