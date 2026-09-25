/**
 * NER-SHIELD Resilient API Client
 * Seamlessly connects to FastAPI backend (/api/v1).
 *
 * Requirements:
 * - Ensure API base URL has only one /api/v1 suffix.
 * - Do not silently fallback to mock data unless VITE_DEMO_MODE=true.
 * - Attaches Bearer token from session if available.
 */

export function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export function isDemoModeEnabled() {
  return import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === true;
}

const REQUEST_TIMEOUT_MS = 3500;

export class ApiClient {
  static isBackendAvailable = null;

  static getBaseUrl() {
    return resolveApiBaseUrl();
  }

  static async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${resolveApiBaseUrl()}/health`, {
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
    const url = `${resolveApiBaseUrl()}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Retrieve session Bearer token if present
    let authToken = null;
    try {
      const raw = sessionStorage.getItem('ner_shield_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        authToken = parsed?.token;
      }
    } catch {
      // sessionStorage unavailable
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
      ApiClient.isBackendAvailable = false;

      // Automated mock fallback is permitted ONLY if VITE_DEMO_MODE is true
      if (isDemoModeEnabled() && fallbackData !== null && fallbackData !== undefined) {
        console.warn(`[NER-SHIELD DEMO API] ${endpoint} failed (${err.message}). Using local demo store.`);
        return typeof fallbackData === 'function' ? fallbackData() : fallbackData;
      }

      console.warn(`[NER-SHIELD API] ${endpoint} failed (${err.message}). No demo fallback.`);
      throw err;
    }
  }
}

export default ApiClient;
