import { apiClient } from './api';
import type { AnalyticsOverview, EventAnalytics } from '../types';

class AnalyticsService {
  async getOverview(days: number = 30): Promise<AnalyticsOverview> {
    return apiClient.get<AnalyticsOverview>(`/analytics/overview?days=${days}`);
  }

  async getEventAnalytics(eventId: string): Promise<EventAnalytics> {
    return apiClient.get<EventAnalytics>(`/analytics/event/${eventId}`);
  }
}

export const analyticsService = new AnalyticsService();
