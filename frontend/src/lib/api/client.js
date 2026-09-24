/**
 * NER-SHIELD Resilient API Client
 * Seamlessly connects to FastAPI backend (/api/v1) with automated graceful fallback
 * to local mock telemetry store if the backend service is offline.
 */

export const DEMO_MODE = !['false', '0', 'no'].includes(
  String(import.meta.env.VITE_DEMO_MODE ?? 'true').toLowerCase(),
);
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
).replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 3500;

export class ApiClient {
  static isBackendAvailable = null;

  static async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(id);
      ApiClient.isBackendAvailable = res.ok;
      return res.ok;
    } catch {
      ApiClient.isBackendAvailable = false;
      return false;
    }
  }

  static async request(endpoint, options = {}, fallbackData = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      ApiClient.isBackendAvailable = true;
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      const fallbackMessage = DEMO_MODE
        ? 'Using local demo data.'
        : 'Live mode has no synthetic fallback.';
      console.warn(`[NER-SHIELD API] ${endpoint} failed (${err.message}). ${fallbackMessage}`);
      ApiClient.isBackendAvailable = false;

      if (DEMO_MODE && fallbackData !== null && fallbackData !== undefined) {
        return typeof fallbackData === 'function' ? fallbackData() : fallbackData;
      }
      throw err;
    }
  }
}

export default ApiClient;
