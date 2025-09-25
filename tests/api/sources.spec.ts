import { test, expect } from '@playwright/test';
import { ApiClient } from '../fixtures/api-client';
import { TestData, generateRandomSource, expectResponseSchema, Schemas } from '../fixtures/test-data';

test.describe('Knowledge Sources API Tests', () => {
  let apiClient: ApiClient;
  let createdSourceId: string;

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request);
  });

  test.afterEach(async () => {
    // Cleanup created sources
    if (createdSourceId) {
      await apiClient.delete(`/api/sources/${createdSourceId}`);
      createdSourceId = '';
    }
  });

  test.describe('Create Source', () => {
    test('should create a new knowledge source', async () => {
      const sourceData = generateRandomSource();
      const response = await apiClient.post('/api/sources', sourceData);

      expect(response.status()).toBe(201);

      const source = await response.json();
      createdSourceId = source.id;

      expect(source.id).toBeDefined();
      expect(source.name).toBe(sourceData.name);
      expect(source.type).toBe(sourceData.type);
      expect(source.status).toBe('configured');
      expectResponseSchema(source, Schemas.source);
    });

    test('should validate required fields', async () => {
      const invalidSource = { name: 'Test' }; // Missing required fields
      const response = await apiClient.post('/api/sources', invalidSource);

      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toBeDefined();
      expect(error.details).toContain('type');
    });

    test('should prevent duplicate source names', async () => {
      const sourceData = generateRandomSource();

      // Create first source
      const response1 = await apiClient.post('/api/sources', sourceData);
      expect(response1.status()).toBe(201);
      const source1 = await response1.json();
      createdSourceId = source1.id;

      // Try to create duplicate
      const response2 = await apiClient.post('/api/sources', sourceData);
      expect(response2.status()).toBe(409);

      const error = await response2.json();
      expect(error.error).toContain('already exists');
    });

    test('should validate source type', async () => {
      const invalidSource = generateRandomSource({ type: 'INVALID_TYPE' });
      const response = await apiClient.post('/api/sources', invalidSource);

      expect(response.status()).toBe(400);

      const error = await response.json();
      expect(error.error).toContain('Invalid source type');
      expect(error.validTypes).toEqual(
        expect.arrayContaining(['ONENOTE', 'GITHUB', 'CODE_REPO', 'AI_CHAT'])
      );
    });
  });

  test.describe('Get Sources', () => {
    test('should list all sources', async () => {
      const response = await apiClient.get('/api/sources');

      expect(response.status()).toBe(200);

      const sources = await response.json();
      expect(Array.isArray(sources.items)).toBe(true);
      expect(sources.total).toBeGreaterThanOrEqual(0);
      expect(sources.pagination).toBeDefined();
    });

    test('should support pagination', async () => {
      // Get first page
      const page1 = await apiClient.get('/api/sources?limit=5&offset=0');
      expect(page1.status()).toBe(200);
      const data1 = await page1.json();

      expect(data1.items.length).toBeLessThanOrEqual(5);
      expect(data1.pagination.limit).toBe(5);
      expect(data1.pagination.offset).toBe(0);

      // Get second page
      const page2 = await apiClient.get('/api/sources?limit=5&offset=5');
      expect(page2.status()).toBe(200);
      const data2 = await page2.json();

      // Verify no duplicates between pages
      const ids1 = data1.items.map((s: any) => s.id);
      const ids2 = data2.items.map((s: any) => s.id);
      const intersection = ids1.filter((id: string) => ids2.includes(id));
      expect(intersection.length).toBe(0);
    });

    test('should filter by source type', async () => {
      const response = await apiClient.get('/api/sources?type=GITHUB');

      expect(response.status()).toBe(200);

      const sources = await response.json();
      sources.items.forEach((source: any) => {
        expect(source.type).toBe('GITHUB');
      });
    });

    test('should filter by status', async () => {
      const response = await apiClient.get('/api/sources?status=active');

      expect(response.status()).toBe(200);

      const sources = await response.json();
      sources.items.forEach((source: any) => {
        expect(source.status).toBe('active');
      });
    });
  });

  test.describe('Get Single Source', () => {
    test('should get source by ID', async () => {
      // Create a source first
      const sourceData = generateRandomSource();
      const createResponse = await apiClient.post('/api/sources', sourceData);
      const created = await createResponse.json();
      createdSourceId = created.id;

      // Get the source
      const response = await apiClient.get(`/api/sources/${created.id}`);

      expect(response.status()).toBe(200);

      const source = await response.json();
      expect(source.id).toBe(created.id);
      expect(source.name).toBe(sourceData.name);
      expectResponseSchema(source, Schemas.source);
    });

    test('should return 404 for non-existent source', async () => {
      const response = await apiClient.get('/api/sources/non-existent-id');

      expect(response.status()).toBe(404);

      const error = await response.json();
      expect(error.error).toContain('not found');
    });
  });

  test.describe('Update Source', () => {
    test('should update source configuration', async () => {
      // Create source
      const sourceData = generateRandomSource();
      const createResponse = await apiClient.post('/api/sources', sourceData);
      const created = await createResponse.json();
      createdSourceId = created.id;

      // Update source
      const updates = {
        name: 'Updated Source Name',
        config: {
          ...sourceData.config,
          section: 'Updated Section',
        },
      };

      const updateResponse = await apiClient.patch(
        `/api/sources/${created.id}`,
        updates
      );

      expect(updateResponse.status()).toBe(200);

      const updated = await updateResponse.json();
      expect(updated.name).toBe(updates.name);
      expect(updated.config.section).toBe('Updated Section');
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    test('should validate updates', async () => {
      // Create source
      const sourceData = generateRandomSource();
      const createResponse = await apiClient.post('/api/sources', sourceData);
      const created = await createResponse.json();
      createdSourceId = created.id;

      // Try invalid update
      const invalidUpdate = {
        type: 'INVALID_TYPE', // Can't change type to invalid value
      };

      const updateResponse = await apiClient.patch(
        `/api/sources/${created.id}`,
        invalidUpdate
      );

      expect(updateResponse.status()).toBe(400);

      const error = await updateResponse.json();
      expect(error.error).toContain('Invalid');
    });
  });

  test.describe('Delete Source', () => {
    test('should delete source', async () => {
      // Create source
      const sourceData = generateRandomSource();
      const createResponse = await apiClient.post('/api/sources', sourceData);
      const created = await createResponse.json();

      // Delete source
      const deleteResponse = await apiClient.delete(`/api/sources/${created.id}`);
      expect(deleteResponse.status()).toBe(204);

      // Verify it's deleted
      const getResponse = await apiClient.get(`/api/sources/${created.id}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should handle deletion of non-existent source', async () => {
      const response = await apiClient.delete('/api/sources/non-existent');
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Source Validation', () => {
    test('should validate source connectivity', async () => {
      // Create source
      const sourceData = generateRandomSource();
      const createResponse = await apiClient.post('/api/sources', sourceData);
      const created = await createResponse.json();
      createdSourceId = created.id;

      // Validate source
      const response = await apiClient.post(`/api/sources/${created.id}/validate`);

      expect(response.status()).toBe(200);

      const validation = await response.json();
      expect(validation.isValid).toBeDefined();
      expect(validation.connectivity).toBeDefined();
      expect(validation.permissions).toBeDefined();

      if (!validation.isValid) {
        expect(validation.errors).toBeDefined();
        expect(Array.isArray(validation.errors)).toBe(true);
      }
    });

    test('should handle validation timeout', async () => {
      // Create source with unreachable endpoint
      const sourceData = generateRandomSource({
        config: {
          ...TestData.sources.valid.config,
          endpoint: 'http://unreachable-host-12345.local',
        },
      });

      const createResponse = await apiClient.post('/api/sources', sourceData);
      const created = await createResponse.json();
      createdSourceId = created.id;

      const response = await apiClient.post(`/api/sources/${created.id}/validate`);

      expect([200, 408]).toContain(response.status());

      const validation = await response.json();
      if (response.status() === 200) {
        expect(validation.isValid).toBe(false);
        expect(validation.connectivity).toBe('failed');
      }
    });
  });
});