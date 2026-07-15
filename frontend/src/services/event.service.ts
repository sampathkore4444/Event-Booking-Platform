import { apiClient } from './api';
import type {
  Event,
  EventCreate,
  EventUpdate,
  EventListResponse,
  EventStatus,
} from '../types';

class EventService {
  async getEvents(params?: {
    skip?: number;
    limit?: number;
    status?: EventStatus;
    category_id?: string;
    search?: string;
    city?: string;
    is_free?: boolean;
    is_virtual?: boolean;
    upcoming?: boolean;
    sort_by?: string;
    sort_desc?: boolean;
  }): Promise<EventListResponse> {
    return apiClient.get<EventListResponse>('/events', params as Record<string, unknown>);
  }

  async getFeaturedEvents(limit: number = 6): Promise<Event[]> {
    return apiClient.get<Event[]>('/events/featured', { limit });
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    return apiClient.get<Event[]>('/events/upcoming', { limit });
  }

  async getMyEvents(): Promise<Event[]> {
    return apiClient.get<Event[]>('/events/my');
  }

  async getEvent(id: string): Promise<Event> {
    return apiClient.get<Event>(`/events/${id}`);
  }

  async getEventBySlug(slug: string): Promise<Event> {
    return apiClient.get<Event>(`/events/slug/${slug}`);
  }

  async createEvent(data: EventCreate): Promise<Event> {
    return apiClient.post<Event>('/events', data);
  }

  async updateEvent(id: string, data: EventUpdate): Promise<Event> {
    return apiClient.put<Event>(`/events/${id}`, data);
  }

  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete<void>(`/events/${id}`);
  }

  async publishEvent(id: string): Promise<Event> {
    return apiClient.post<Event>(`/events/${id}/publish`);
  }

  async updateEventStatus(id: string, status: EventStatus): Promise<Event> {
    return apiClient.put<Event>(`/events/${id}/status`, { status });
  }

  async toggleFeatured(id: string): Promise<Event> {
    return apiClient.post<Event>(`/events/${id}/feature`);
  }
}

export const eventService = new EventService();
