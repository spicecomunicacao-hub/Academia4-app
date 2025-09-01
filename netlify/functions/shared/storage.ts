// Storage independente para Netlify Functions
// Usando dados em memória para demo (você pode conectar a um banco real)

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  isAdmin?: boolean;
  isCheckedIn?: boolean;
  planId: string;
}

export interface LoginLog {
  id: string;
  email: string;
  success: boolean;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

// Função para garantir que os dados estejam sempre disponíveis
function getInitialUsers(): User[] {
  return [
    {
      id: "admin-001",
      name: "Administrador",
      email: "admin@gmail.com",
      password: "123456",
      isAdmin: true,
      isCheckedIn: false,
      planId: "premium"
    },
    {
      id: "user-001", 
      name: "João Silva",
      email: "joao@gmail.com",
      password: "123456",
      isAdmin: false,
      isCheckedIn: false,
      planId: "basic"
    }
  ];
}

// Dados de exemplo (substitua por conexão real com banco)
let users: User[] = getInitialUsers();
let loginLogs: LoginLog[] = [];

export const storage = {
  // Usuários
  async getUserByEmail(email: string): Promise<User | null> {
    // Garantir que os dados estão inicializados
    if (users.length === 0) {
      users = getInitialUsers();
    }
    console.log('Available users:', users.map(u => u.email));
    const user = users.find(u => u.email === email) || null;
    console.log('getUserByEmail result for', email, ':', user ? 'found' : 'not found');
    return user;
  },

  async getUser(id: string): Promise<User | null> {
    return users.find(u => u.id === id) || null;
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    // Garantir que os dados estão inicializados
    if (users.length === 0) {
      users = getInitialUsers();
    }
    
    const newUser = {
      ...userData,
      id: `user-${Date.now()}`,
      planId: userData.planId || 'basic',
      isAdmin: false,
      isCheckedIn: false
    };
    users.push(newUser);
    console.log('User created:', newUser.email);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    return users[index];
  },

  // Logs de login
  async logLoginAttempt(
    email: string,
    password: string,
    success: boolean,
    userAgent?: string,
    ip?: string
  ): Promise<void> {
    const log: LoginLog = {
      id: `log-${Date.now()}`,
      email,
      success,
      timestamp: new Date().toISOString(),
      userAgent,
      ip
    };
    loginLogs.push(log);
  },

  async getRecentLoginAttempts(limit: number = 100): Promise<LoginLog[]> {
    return loginLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  // Dados estáticos para demonstração
  async getWorkouts(userId: string): Promise<any[]> {
    return [];
  },

  async getCheckins(userId: string): Promise<any[]> {
    return [];
  },

  async getClassBookings(userId: string): Promise<any[]> {
    return [];
  },

  async getClasses(): Promise<any[]> {
    return [];
  },

  async getClassesByDate(date: string): Promise<any[]> {
    return [];
  },

  async getClass(id: string): Promise<any | null> {
    return null;
  },

  async createClassBooking(userId: string, classId: string): Promise<any> {
    return { id: `booking-${Date.now()}`, userId, classId };
  },

  async cancelClassBooking(userId: string, classId: string): Promise<boolean> {
    return true;
  }
};