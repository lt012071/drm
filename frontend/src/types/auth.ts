export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  role: 'member' | 'admin' | 'developer';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}