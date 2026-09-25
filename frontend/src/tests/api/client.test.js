import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../../lib/api/client';

describe('ApiClient', () => {
  const originalFetch = global.fetch;
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    ApiClient.isBackendAvailable = null;
  });

  it('checkBackendHealth returns true on success', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });
    
    const result = await ApiClient.checkBackendHealth();
    
    expect(result).toBe(true);
    expect(ApiClient.isBackendAvailable).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${VITE_API_URL}/health`, expect.any(Object));
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
      json: async () => mockData
    });
    
    const result = await ApiClient.request('/test-endpoint');
    
    expect(result).toEqual(mockData);
    expect(ApiClient.isBackendAvailable).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${VITE_API_URL}/test-endpoint`, expect.any(Object));
  });

  it('request uses fallbackData on failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const fallback = { fallback: true };
    const result = await ApiClient.request('/test-endpoint', {}, fallback);
    
    expect(result).toEqual(fallback);
    expect(ApiClient.isBackendAvailable).toBe(false);
  });
});
