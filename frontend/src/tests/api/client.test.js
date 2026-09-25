import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, resolveApiBaseUrl } from '../../lib/api/client';

describe('ApiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    ApiClient.isBackendAvailable = null;
    vi.unstubAllEnvs();
  });

  it('ensures API base URL has only one /api/v1 suffix', () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000');
    expect(resolveApiBaseUrl()).toBe('http://localhost:8000/api/v1');

    vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api/v1');
    expect(resolveApiBaseUrl()).toBe('http://localhost:8000/api/v1');

    vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api/v1/');
    expect(resolveApiBaseUrl()).toBe('http://localhost:8000/api/v1');
  });

  it('checkBackendHealth returns true on success', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });

    const result = await ApiClient.checkBackendHealth();

    expect(result).toBe(true);
    expect(ApiClient.isBackendAvailable).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${ApiClient.getBaseUrl()}/health`, expect.any(Object));
  });

  it('checkBackendHealth returns false on failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await ApiClient.checkBackendHealth();

    expect(result).toBe(false);
    expect(ApiClient.isBackendAvailable).toBe(false);
  });

  it('request returns json on success', async () => {
    const mockData = { data: 'test' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await ApiClient.request('/test-endpoint');

    expect(result).toEqual(mockData);
    expect(ApiClient.isBackendAvailable).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${ApiClient.getBaseUrl()}/test-endpoint`, expect.any(Object));
  });

  it('mock fallback only occurs when VITE_DEMO_MODE=true', async () => {
    const fallback = { fallback: true };

    // Case 1: VITE_DEMO_MODE=true -> returns fallbackData
    vi.stubEnv('VITE_DEMO_MODE', 'true');
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const resultDemo = await ApiClient.request('/test-endpoint', {}, fallback);
    expect(resultDemo).toEqual(fallback);
    expect(ApiClient.isBackendAvailable).toBe(false);

    // Case 2: VITE_DEMO_MODE=false -> throws error, does NOT return fallbackData
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(ApiClient.request('/test-endpoint', {}, fallback)).rejects.toThrow('Network error');
  });
});
