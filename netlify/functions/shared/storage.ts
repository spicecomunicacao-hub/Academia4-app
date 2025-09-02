// Storage para Netlify Functions usando banco PostgreSQL
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, plans, classes, classBookings, workouts, equipment, checkins, loginAttempts } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';

export interface LoginLog {
  id: string;
  email: string;
  success: boolean;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

// Configuração da conexão com o banco
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Netlify functions');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export const storage = {
  // Usuários
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = result[0] || null;
      console.log('getUserByEmail result for', email, ':', user ? 'found' : 'not found');
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  async getUser(id: string): Promise<any | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async createUser(userData: any): Promise<any> {
    try {
      const result = await db.insert(users).values({
        ...userData,
        memberSince: new Date().toISOString().split('T')[0],
        isCheckedIn: false,
        lastCheckin: null,
        profilePhoto: null,
        planId: userData.planId || 'basic',
        isAdmin: userData.isAdmin || false
      }).returning();
      console.log('User created:', userData.email);
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: string, updates: any): Promise<any | null> {
    try {
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  // Logs de login usando banco PostgreSQL
  async logLoginAttempt(
    email: string,
    password: string,
    success: boolean,
    userAgent?: string,
    ip?: string
  ): Promise<any> {
    try {
      console.log('📝 Tentando registrar tentativa de login...');
      console.log('📊 Dados:', { email, success, ip, userAgent: userAgent ? 'presente' : 'ausente' });
      
      const result = await db.insert(loginAttempts).values({
        email,
        password,
        success,
        userAgent,
        ip
      }).returning();
      
      console.log('✅ Tentativa de login registrada no banco com sucesso');
      console.log('🆔 ID gerado:', result[0]?.id);
      console.log('📅 Timestamp:', result[0]?.timestamp);
      
      return result[0];
    } catch (error) {
      console.error('❌ Erro ao registrar tentativa de login:', error);
      console.error('💥 Stack trace:', error.stack);
      throw error;
    }
  },

  async getRecentLoginAttempts(limit: number = 100): Promise<any[]> {
    try {
      console.log('🔍 Executando consulta para buscar tentativas de login recentes...');
      console.log('📊 Limite solicitado:', limit);
      
      const result = await db.select()
        .from(loginAttempts)
        .orderBy(desc(loginAttempts.timestamp))
        .limit(limit);
      
      console.log('✅ Consulta executada com sucesso');
      console.log('📝 Resultados encontrados:', result.length);
      console.log('🔍 Dados dos resultados:', result.map(r => ({ 
        id: r.id, 
        email: r.email, 
        success: r.success, 
        timestamp: r.timestamp,
        ip: r.ip
      })));
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar tentativas de login:', error);
      console.error('💥 Stack trace:', error.stack);
      return [];
    }
  },

  // Métodos de dados usando banco real
  async getWorkouts(userId: string): Promise<any[]> {
    try {
      return await db.select().from(workouts).where(eq(workouts.userId, userId));
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
    }
  },

  async getCheckins(userId: string): Promise<any[]> {
    try {
      return await db.select().from(checkins).where(eq(checkins.userId, userId));
    } catch (error) {
      console.error('Error getting checkins:', error);
      return [];
    }
  },

  async getClassBookings(userId: string): Promise<any[]> {
    try {
      return await db.select().from(classBookings).where(eq(classBookings.userId, userId));
    } catch (error) {
      console.error('Error getting class bookings:', error);
      return [];
    }
  },

  async getClasses(): Promise<any[]> {
    try {
      return await db.select().from(classes);
    } catch (error) {
      console.error('Error getting classes:', error);
      return [];
    }
  },

  async getClassesByDate(date: string): Promise<any[]> {
    try {
      return await db.select().from(classes).where(eq(classes.date, date));
    } catch (error) {
      console.error('Error getting classes by date:', error);
      return [];
    }
  },

  async getClass(id: string): Promise<any | null> {
    try {
      const result = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting class:', error);
      return null;
    }
  },

  async createClassBooking(userId: string, classId: string): Promise<any> {
    try {
      const result = await db.insert(classBookings).values({
        userId,
        classId,
        bookingDate: new Date(),
        status: 'booked'
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating class booking:', error);
      throw error;
    }
  },

  async cancelClassBooking(userId: string, classId: string): Promise<boolean> {
    try {
      await db.update(classBookings)
        .set({ status: 'cancelled' })
        .where(eq(classBookings.userId, userId) && eq(classBookings.classId, classId));
      return true;
    } catch (error) {
      console.error('Error cancelling class booking:', error);
      return false;
    }
  }
};

// Função simplificada para inicialização - não mais usada
export async function initializeDatabase() {
  console.log('Database initialization skipped - handled on-demand');
}