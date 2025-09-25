import { test, expect } from '@playwright/test';
import { ApiClient } from '../fixtures/api-client';

test.describe('Health Check API Tests', () => {
  let apiClient: ApiClient;

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request);
  });

  test('should return healthy status', async () => {
    const response = await apiClient.get('/health');

    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health.status).toBe('healthy');
    expect(health.timestamp).toBeDefined();
    expect(new Date(health.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('should include service dependencies status', async () => {
    const response = await apiClient.get('/health');
    const health = await response.json();

    expect(health.services).toBeDefined();
    expect(health.services).toHaveProperty('database');
    expect(health.services).toHaveProperty('vectorDb');
    expect(health.services).toHaveProperty('cache');

    Object.values(health.services).forEach((service: any) => {
      expect(['healthy', 'degraded', 'unhealthy']).toContain(service.status);
      expect(service.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  test('should return version information', async () => {
    const response = await apiClient.get('/health');
    const health = await response.json();

    expect(health.version).toBeDefined();
    expect(health.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(health.environment).toBeDefined();
    expect(['development', 'staging', 'production']).toContain(health.environment);
  });

  test('should respond within acceptable time', async () => {
    const startTime = Date.now();
    const response = await apiClient.get('/health');
    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });

  test('should handle concurrent health checks', async () => {
    const promises = Array(10).fill(null).map(() =>
      apiClient.get('/health')
    );

    const responses = await Promise.all(promises);

    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });

    // Check that responses are consistent
    const healthData = await Promise.all(responses.map(r => r.json()));
    const statuses = healthData.map(h => h.status);
    expect(new Set(statuses).size).toBe(1); // All should have same status
  });

  test('should include uptime information', async () => {
    const response = await apiClient.get('/health');
    const health = await response.json();

    expect(health.uptime).toBeDefined();
    expect(health.uptime).toBeGreaterThan(0);
    expect(health.startedAt).toBeDefined();

    const startTime = new Date(health.startedAt).getTime();
    const currentTime = new Date(health.timestamp).getTime();
    const calculatedUptime = Math.floor((currentTime - startTime) / 1000);

    // Allow small variance due to processing time
    expect(Math.abs(health.uptime - calculatedUptime)).toBeLessThanOrEqual(2);
  });

  test('should not expose sensitive information', async () => {
    const response = await apiClient.get('/health');
    const health = await response.json();

    // Should not contain sensitive data
    expect(health).not.toHaveProperty('databasePassword');
    expect(health).not.toHaveProperty('apiKeys');
    expect(health).not.toHaveProperty('secrets');
    expect(health).not.toHaveProperty('tokens');

    // Check nested objects
    if (health.services?.database) {
      expect(health.services.database).not.toHaveProperty('connectionString');
      expect(health.services.database).not.toHaveProperty('password');
    }
  });

  test('should handle HEAD requests for monitoring tools', async ({ request }) => {
    const response = await request.head(`${process.env.API_URL || 'http://localhost:8000'}/health`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    // HEAD request should not have body
    const body = await response.text();
    expect(body).toBe('');
  });
});