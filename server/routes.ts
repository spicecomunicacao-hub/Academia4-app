import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWorkoutSchema, insertCheckinSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.connection.remoteAddress;
      
      const user = await storage.getUserByEmail(email);
      const success = user && user.password === password;
      
      // Log da tentativa de login
      await storage.logLoginAttempt(email, password, !!success, userAgent, ip);
      
      if (!success) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates through this route
      
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Plan routes
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Class routes
  app.get("/api/classes", async (req, res) => {
    try {
      const { date } = req.query;
      const classes = date ? 
        await storage.getClassesByDate(date as string) : 
        await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/classes/:id/book", async (req, res) => {
    try {
      const { userId } = req.body;
      const classId = req.params.id;
      
      const cls = await storage.getClass(classId);
      if (!cls) {
        return res.status(404).json({ message: "Aula não encontrada" });
      }
      
      if (cls.currentParticipants! >= cls.maxParticipants) {
        return res.status(400).json({ message: "Aula lotada" });
      }
      
      const booking = await storage.createClassBooking(userId, classId);
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/classes/:id/book", async (req, res) => {
    try {
      const { userId } = req.body;
      const classId = req.params.id;
      
      const success = await storage.cancelClassBooking(userId, classId);
      if (!success) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      
      res.json({ message: "Agendamento cancelado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/users/:userId/bookings", async (req, res) => {
    try {
      const bookings = await storage.getClassBookings(req.params.userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Workout routes
  app.get("/api/users/:userId/workouts", async (req, res) => {
    try {
      const workouts = await storage.getWorkouts(req.params.userId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/workouts", async (req, res) => {
    try {
      const workoutData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(workoutData);
      res.json(workout);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Equipment routes
  app.get("/api/equipment", async (req, res) => {
    try {
      const { category } = req.query;
      const equipment = category ? 
        await storage.getEquipmentByCategory(category as string) :
        await storage.getEquipment();
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/equipment/:id/reserve", async (req, res) => {
    try {
      const { userId } = req.body;
      const equipment = await storage.updateEquipmentStatus(req.params.id, "reserved", userId);
      if (!equipment) {
        return res.status(404).json({ message: "Equipamento não encontrado" });
      }
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Checkin routes
  app.get("/api/users/:userId/checkins", async (req, res) => {
    try {
      const checkins = await storage.getCheckins(req.params.userId);
      res.json(checkins);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/users/:userId/checkins/active", async (req, res) => {
    try {
      const activeCheckin = await storage.getActiveCheckin(req.params.userId);
      res.json(activeCheckin);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/checkins", async (req, res) => {
    try {
      const checkinData = insertCheckinSchema.parse(req.body);
      
      // Check if user is already checked in
      const activeCheckin = await storage.getActiveCheckin(checkinData.userId);
      if (activeCheckin) {
        return res.status(400).json({ message: "Usuário já está na academia" });
      }
      
      const checkin = await storage.createCheckin(checkinData);
      
      // Update user status
      await storage.updateUser(checkinData.userId, { 
        isCheckedIn: true, 
        lastCheckin: checkin.checkinTime! 
      });
      
      res.json(checkin);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/checkins/:id/checkout", async (req, res) => {
    try {
      const checkin = await storage.updateCheckin(req.params.id, new Date());
      if (!checkin) {
        return res.status(404).json({ message: "Check-in não encontrado" });
      }
      
      // Update user status
      await storage.updateUser(checkin.userId, { isCheckedIn: false });
      
      res.json(checkin);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login logs routes (apenas para admins)
  app.get("/api/admin/login-logs", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(401).json({ message: "Acesso negado" });
      }
      
      const user = await storage.getUser(userId as string);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Apenas administradores podem acessar os logs" });
      }
      
      const logs = await storage.getRecentLoginAttempts(100);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
