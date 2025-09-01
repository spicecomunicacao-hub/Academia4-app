import { z } from "zod";

// Schemas independentes para Netlify Functions
export const insertUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  currentWeight: z.number().optional(),
  targetWeight: z.number().optional(),
  primaryGoal: z.string().optional(),
  planId: z.string().default("basic"),
  profilePhoto: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;