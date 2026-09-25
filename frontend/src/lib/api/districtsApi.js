import { ApiClient } from './client';
import { mockDistrictConnectivity } from '../mockData';

export const districtsApi = {
  async getDistricts() {
    return ApiClient.request(
      '/districts',
      { method: 'GET' },
      () => ({
        total: mockDistrictConnectivity.length,
        districts: mockDistrictConnectivity,
      })
    );
  },
};
