import { apiClient } from "./api";
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UsersResponse,
} from "@/types/user.types";

export const userService = {
  /**
   * Get all users with pagination
   */
  async getUsers(page = 1, pageSize = 10): Promise<UsersResponse> {
    const response = await apiClient.get<UsersResponse>("/users", {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  async createUser(data: CreateUserDto): Promise<User> {
    const response = await apiClient.post<User>("/users", data);
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  /**
   * Toggle user status
   */
  async toggleUserStatus(id: string): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}/toggle-status`);
    return response.data;
  },
};
