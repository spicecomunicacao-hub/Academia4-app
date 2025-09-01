import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi, setCurrentUser, getCurrentUser } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Check if already logged in
  const currentUser = getCurrentUser();
  if (currentUser) {
    setLocation("/dashboard");
    return null;
  }

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setCurrentUser(data.user);
      setLocation("/dashboard");
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta, ${data.user.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setCurrentUser(data.user);
      setLocation("/dashboard");
      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo, ${data.user.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoginMode) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      registerMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        planId: "basic",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary" data-testid="text-app-title">
              Academia SportFitness
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-auth-subtitle">
              {isLoginMode ? "Faça login para continuar" : "Cadastre-se para começar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-auth">
            {!isLoginMode && (
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLoginMode}
                  data-testid="input-name"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Seu e-mail"
                value={formData.email}
                onChange={handleInputChange}
                required
                data-testid="input-email"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={handleInputChange}
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || registerMutation.isPending}
              data-testid="button-submit"
            >
              {loginMutation.isPending || registerMutation.isPending
                ? "Carregando..."
                : isLoginMode
                ? "Entrar"
                : "Cadastrar"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Button
              variant="link"
              onClick={() => setIsLoginMode(!isLoginMode)}
              data-testid="button-toggle-mode"
            >
              {isLoginMode
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Faça login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
