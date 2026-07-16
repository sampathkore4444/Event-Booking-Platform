import { apiClient } from './api';
import type { Review, ReviewCreate, ReviewUpdate, ReviewStats } from '../types';

class ReviewService {
  async getEventReviews(eventId: string, skip: number = 0, limit: number = 20): Promise<Review[]> {
    return apiClient.get<Review[]>(`/reviews/event/${eventId}?skip=${skip}&limit=${limit}`);
  }

  async getReviewStats(eventId: string): Promise<ReviewStats> {
    return apiClient.get<ReviewStats>(`/reviews/event/${eventId}/stats`);
  }

  async getMyReviews(): Promise<Review[]> {
    return apiClient.get<Review[]>('/reviews/my');
  }

  async createReview(data: ReviewCreate): Promise<Review> {
    return apiClient.post<Review>('/reviews', data);
  }

  async updateReview(id: string, data: ReviewUpdate): Promise<Review> {
    return apiClient.put<Review>(`/reviews/${id}`, data);
  }

  async deleteReview(id: string): Promise<void> {
    return apiClient.delete<void>(`/reviews/${id}`);
  }
}

export const reviewService = new ReviewService();
