export interface User {
  id: number;
  email: string;
  password: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  username: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserDTO {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}
