import { ApiClient } from './client';
import { mockVehicles } from '../mockData';

let localVehicles = [...mockVehicles];

export const vehiclesApi = {
  async getVehicles() {
    return ApiClient.request(
      '/vehicles',
      { method: 'GET' },
      () => ({
        total: localVehicles.length,
        vehicles: localVehicles,
      })
    );
  },

  async updateVehicleStatus(id, updates) {
    localVehicles = localVehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));
    return localVehicles.find((v) => v.id === id);
  },
};
