import { apiClient } from './api';
import type { Category } from '../types';

class CategoryService {
  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories');
  }

  async getCategory(id: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  }
}

export const categoryService = new CategoryService();
