import { apiRequest } from "./queryClient";
import type { User, InsertUser } from "@shared/schema";

export interface AuthResponse {
  user: Omit<User, 'password'>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  register: async (userData: InsertUser): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    return response.json();
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiRequest("GET", `/api/users/${id}`);
    return response.json();
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await apiRequest("PUT", `/api/users/${id}`, updates);
    return response.json();
  },
};

export const getCurrentUser = (): Omit<User, 'password'> | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: Omit<User, 'password'>) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const clearCurrentUser = () => {
  localStorage.removeItem('currentUser');
};
