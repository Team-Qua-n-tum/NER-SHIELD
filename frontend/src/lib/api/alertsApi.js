import { ApiClient } from './client';
import { mockAlerts } from '../mockData';

// Local storage cache for acknowledged alerts in session
let localAlerts = [...mockAlerts];

export const alertsApi = {
  async getAlerts() {
    return ApiClient.request(
      '/alerts',
      { method: 'GET' },
      () => ({
        total: localAlerts.length,
        alerts: localAlerts,
      })
    );
  },

  async dismissAlert(alertId) {
    localAlerts = localAlerts.filter((a) => a.id !== alertId);
    return { success: true, remaining: localAlerts.length };
  },

  async addAlert(newAlert) {
    const alertObj = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      ...newAlert,
    };
    localAlerts.unshift(alertObj);
    return alertObj;
  },
};
