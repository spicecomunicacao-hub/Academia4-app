import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authApi, getCurrentUser, setCurrentUser } from "@/lib/auth";

export default function ProfileSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    birthDate: currentUser?.birthDate || "",
    currentWeight: currentUser?.currentWeight || "",
    targetWeight: currentUser?.targetWeight || "",
    primaryGoal: currentUser?.primaryGoal || "Ganho de Massa",
  });

  const updateUserMutation = useMutation({
    mutationFn: (updates: any) => authApi.updateUser(currentUser!.id, updates),
    onSuccess: (updatedUser) => {
      setCurrentUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível salvar as alterações",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate({
      ...formData,
      currentWeight: formData.currentWeight ? parseInt(formData.currentWeight.toString()) : null,
      targetWeight: formData.targetWeight ? parseInt(formData.targetWeight.toString()) : null,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo and Basic Info */}
        <Card data-testid="card-profile-photo">
          <CardContent className="p-6">
            <div className="text-center">
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
                alt="Foto do perfil"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                data-testid="img-profile-photo"
              />
              <h3 className="text-xl font-semibold text-card-foreground" data-testid="text-profile-name">
                {currentUser?.name}
              </h3>
              <p className="text-muted-foreground" data-testid="text-member-since">
                Membro desde {currentUser?.memberSince}
              </p>
              <Button variant="link" className="mt-3 text-sm" data-testid="button-change-photo">
                Alterar Foto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2" data-testid="card-personal-info">
          <CardHeader>
            <CardTitle data-testid="text-personal-info-title">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-profile-update">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handleInputChange}
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    data-testid="input-birth-date"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Fitness Goals */}
      <Card data-testid="card-fitness-goals">
        <CardHeader>
          <CardTitle data-testid="text-fitness-goals-title">Objetivos Fitness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primaryGoal">Objetivo Principal</Label>
              <Select
                value={formData.primaryGoal}
                onValueChange={(value) => setFormData({ ...formData, primaryGoal: value })}
              >
                <SelectTrigger data-testid="select-primary-goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Perda de Peso">Perda de Peso</SelectItem>
                  <SelectItem value="Ganho de Massa">Ganho de Massa</SelectItem>
                  <SelectItem value="Condicionamento">Condicionamento</SelectItem>
                  <SelectItem value="Reabilitação">Reabilitação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
              <Input
                id="currentWeight"
                name="currentWeight"
                type="number"
                placeholder="75"
                value={formData.currentWeight}
                onChange={handleInputChange}
                data-testid="input-current-weight"
              />
            </div>
            <div>
              <Label htmlFor="targetWeight">Peso Meta (kg)</Label>
              <Input
                id="targetWeight"
                name="targetWeight"
                type="number"
                placeholder="80"
                value={formData.targetWeight}
                onChange={handleInputChange}
                data-testid="input-target-weight"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
