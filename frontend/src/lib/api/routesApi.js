import { ApiClient } from './client';
import { mockRouteRecommendations } from '../mockData';
import { CommodityMetadata } from '../types';

export const routesApi = {
  async recommendRoute({ source, destination, commodity = 'MEDICINE', avoidHighRisk = true }) {
    const payload = {
      source_district: source || 'dist-guwahati',
      destination_district: destination || 'dist-imphal',
      commodity,
      constraints: {
        avoid_high_risk: avoidHighRisk,
        vehicle_type: 'TRUCK',
      },
    };

    return ApiClient.request(
      '/routes/recommend',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        // Dynamic mock route tailored to commodity priority
        const meta = CommodityMetadata[commodity] || CommodityMetadata.GENERAL;
        return {
          ...mockRouteRecommendations,
          commodity,
          priorityLabel: meta.label,
          riskMultiplier: meta.riskMultiplier,
        };
      }
    );
  },

  async predictDisruptionRisk(data) {
    return ApiClient.request(
      '/risk/predict',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      () => ({
        risk_probability: 0.85,
        risk_level: 'HIGH',
        risk_factors: [
          { factor: 'Rainfall Saturation', contribution: '+42%' },
          { factor: 'Steep Slope Gradient', contribution: '+28%' },
          { factor: 'Active Landslide History', contribution: '+15%' },
        ],
      })
    );
  },
};
