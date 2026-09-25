import { ApiClient } from './client';
import { mockDashboardMetrics } from '../mockData';

export const dashboardApi = {
  async getMetrics() {
    return ApiClient.request(
      '/dashboard',
      { method: 'GET' },
      () => ({ ...mockDashboardMetrics, lastUpdated: new Date().toISOString() })
    );
  },

  async getHealth() {
    return ApiClient.request(
      '/health',
      { method: 'GET' },
      () => ({ status: 'ok', fallback: true, mode: 'local-prototype' })
    );
  },
};
