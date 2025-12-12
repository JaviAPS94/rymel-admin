export const Role = {
  ADMIN: "ADMIN",
  NORM: "NORM",
  DESIGN: "DESIGN",
  USER: "USER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface User {
  id: string;
  email: string;
  roles?: Role[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  roles?: Role[];
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  roles?: Role[];
  status?: "active" | "inactive";
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}
