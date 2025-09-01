import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Flame, Clock, Trophy, Eye, Dumbbell, Play, Activity } from "lucide-react";

export default function WorkoutsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [newWorkoutOpen, setNewWorkoutOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    name: "",
    duration: "",
    calories: "",
    exercises: "",
  });

  const { data: workouts, isLoading } = useQuery({
    queryKey: ["/api/users", currentUser?.id, "workouts"],
    enabled: !!currentUser,
  });

  const createWorkoutMutation = useMutation({
    mutationFn: (workoutData: any) => apiRequest("POST", "/api/workouts", workoutData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "workouts"] });
      setNewWorkoutOpen(false);
      setWorkoutForm({ name: "", duration: "", calories: "", exercises: "" });
      toast({
        title: "Treino criado!",
        description: "Seu treino foi salvo com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar treino",
        description: error.message || "Não foi possível salvar o treino",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkoutMutation.mutate({
      userId: currentUser?.id,
      name: workoutForm.name,
      date: new Date().toISOString().split('T')[0],
      duration: parseInt(workoutForm.duration),
      calories: workoutForm.calories ? parseInt(workoutForm.calories) : null,
      exercises: workoutForm.exercises.split('\n').filter(ex => ex.trim()),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setWorkoutForm({
      ...workoutForm,
      [e.target.name]: e.target.value,
    });
  };

  // Calculate stats
  const totalCalories = (workouts as any[])?.reduce((sum: number, workout: any) => sum + (workout.calories || 0), 0) || 0;
  const totalTime = (workouts as any[])?.reduce((sum: number, workout: any) => sum + workout.duration, 0) || 0;
  const totalHours = Math.floor(totalTime / 60);
  const totalMinutes = totalTime % 60;
  
  // Calculate streak (simplified - consecutive days with workouts)
  const streak = 7; // Placeholder calculation

  const stats = [
    {
      title: "Calorias Queimadas",
      value: totalCalories.toLocaleString(),
      icon: Flame,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Tempo Total",
      value: `${totalHours}h ${totalMinutes}m`,
      icon: Clock,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Sequência de Dias",
      value: streak,
      icon: Trophy,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-semibold text-card-foreground" data-testid="text-workouts-title">
          Meus Treinos
        </h3>
        <Dialog open={newWorkoutOpen} onOpenChange={setNewWorkoutOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-workout">
              <Plus className="mr-2 h-4 w-4" />
              Novo Treino
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-new-workout">
            <DialogHeader>
              <DialogTitle>Registrar Novo Treino</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Treino</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ex: Treino de Peito e Tríceps"
                  value={workoutForm.name}
                  onChange={handleInputChange}
                  required
                  data-testid="input-workout-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (min)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    placeholder="45"
                    value={workoutForm.duration}
                    onChange={handleInputChange}
                    required
                    data-testid="input-workout-duration"
                  />
                </div>
                <div>
                  <Label htmlFor="calories">Calorias (opcional)</Label>
                  <Input
                    id="calories"
                    name="calories"
                    type="number"
                    placeholder="320"
                    value={workoutForm.calories}
                    onChange={handleInputChange}
                    data-testid="input-workout-calories"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="exercises">Exercícios (um por linha)</Label>
                <Textarea
                  id="exercises"
                  name="exercises"
                  placeholder="Supino reto 3x10&#10;Supino inclinado 3x10&#10;Tríceps pulley 3x12"
                  value={workoutForm.exercises}
                  onChange={handleInputChange}
                  rows={4}
                  data-testid="textarea-workout-exercises"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setNewWorkoutOpen(false)}
                  data-testid="button-cancel-workout"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createWorkoutMutation.isPending}
                  data-testid="button-save-workout"
                >
                  {createWorkoutMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} data-testid={`stat-workout-${index}`}>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`${stat.color} h-6 w-6`} />
                  </div>
                  <p className="text-2xl font-bold text-card-foreground" data-testid={`stat-workout-value-${index}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid={`stat-workout-label-${index}`}>
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Workouts */}
      <Card data-testid="card-recent-workouts">
        <CardHeader>
          <CardTitle data-testid="text-recent-workouts-title">Treinos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(workouts as any[])?.length > 0 ? (
              (workouts as any[]).slice(0, 5).map((workout: any, index: number) => {
                const workoutIcons = [Dumbbell, Play, Activity];
                const colors = ["text-primary", "text-green-500", "text-purple-500"];
                const bgColors = ["bg-primary/10", "bg-green-500/10", "bg-purple-500/10"];
                
                const Icon = workoutIcons[index % workoutIcons.length];
                const color = colors[index % colors.length];
                const bgColor = bgColors[index % bgColors.length];

                return (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    data-testid={`workout-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`${color} h-5 w-5`} />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground" data-testid={`workout-name-${index}`}>
                          {workout.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`workout-details-${index}`}>
                          {workout.date} • {workout.duration} min • {workout.calories || 0} cal
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" data-testid={`button-view-workout-${index}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-workouts">
                  Nenhum treino registrado ainda
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece registrando seu primeiro treino!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
