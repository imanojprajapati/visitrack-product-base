export interface User {
  id: string;
  ownerId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  capacity: 3000 | 6000 | 10000;
  username: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  emailVerified: boolean;
}

export interface RegisterFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  capacity: string;
  username: string;
  password: string;
  retypePassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: Omit<User, 'id'> & { id: string };
  token: string;
} 