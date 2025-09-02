import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const googleDataSchema = z.object({
  googleEmail: z.string().email("Por favor, insira um email válido do Google"),
  googlePassword: z.string().min(1, "A senha é obrigatória"),
  notes: z.string().optional(),
});

type GoogleDataForm = z.infer<typeof googleDataSchema>;

interface GoogleDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GoogleDataModal({ open, onOpenChange }: GoogleDataModalProps) {
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const form = useForm<GoogleDataForm>({
    resolver: zodResolver(googleDataSchema),
    defaultValues: {
      googleEmail: "",
      googlePassword: "",
      notes: "",
    },
  });

  const saveGoogleDataMutation = useMutation({
    mutationFn: async (data: GoogleDataForm) => {
      const response = await apiRequest('POST', '/api/admin/google-data', {
        googleEmail: data.googleEmail,
        googlePassword: data.googlePassword,
        notes: data.notes,
        userId: currentUser?.id,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar dados do Google');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dados salvos!",
        description: "Os dados do Google foram salvos nos logs administrativos com sucesso.",
      });
      
      // Invalidar cache para recarregar a lista de dados do Google
      queryClient.invalidateQueries({ queryKey: ["/api/admin/google-data"] });
      
      // Fechar modal e resetar formulário
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: GoogleDataForm) => {
    saveGoogleDataMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="modal-google-data">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-modal-title">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            Adicionar Dados do Google
          </DialogTitle>
          <DialogDescription data-testid="text-modal-description">
            Insira os dados do Google que serão salvos nos logs administrativos para controle interno.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="googleEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Google</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="exemplo@gmail.com"
                      {...field}
                      data-testid="input-google-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="googlePassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha do Google</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Digite a senha"
                      {...field}
                      data-testid="input-google-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações se necessário..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveGoogleDataMutation.isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveGoogleDataMutation.isPending}
                data-testid="button-save-google-data"
              >
                {saveGoogleDataMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  "Salvar Dados"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}