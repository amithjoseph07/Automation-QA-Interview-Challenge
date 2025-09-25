import { APIRequestContext, APIResponse } from '@playwright/test';

export interface ApiClientOptions {
  baseURL?: string;
  token?: string;
  timeout?: number;
}

export class ApiClient {
  private request: APIRequestContext;
  private baseURL: string;
  private token: string;

  constructor(request: APIRequestContext, options: ApiClientOptions = {}) {
    this.request = request;
    this.baseURL = options.baseURL || process.env.API_URL || 'http://localhost:8000';
    this.token = options.token || process.env.API_TOKEN || 'test-token';
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}) {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...additionalHeaders,
    };
  }

  async get(endpoint: string, options: any = {}): Promise<APIResponse> {
    return this.request.get(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers),
      ...options,
    });
  }

  async post(endpoint: string, data?: any, options: any = {}): Promise<APIResponse> {
    return this.request.post(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers),
      data,
      ...options,
    });
  }

  async put(endpoint: string, data?: any, options: any = {}): Promise<APIResponse> {
    return this.request.put(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers),
      data,
      ...options,
    });
  }

  async patch(endpoint: string, data?: any, options: any = {}): Promise<APIResponse> {
    return this.request.patch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers),
      data,
      ...options,
    });
  }

  async delete(endpoint: string, options: any = {}): Promise<APIResponse> {
    return this.request.delete(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(options.headers),
      ...options,
    });
  }

  async waitForJobCompletion(
    jobId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<any> {
    let attempts = 0;
    let status = 'running';
    let jobData: any;

    while (status === 'running' && attempts < maxAttempts) {
      const response = await this.get(`/api/jobs/${jobId}`);
      jobData = await response.json();
      status = jobData.status;

      if (status === 'running') {
        await this.wait(intervalMs);
        attempts++;
      }
    }

    if (status === 'running') {
      throw new Error(`Job ${jobId} did not complete within timeout`);
    }

    return jobData;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async pollUntilCondition<T>(
    fn: () => Promise<T>,
    condition: (result: T) => boolean,
    options: { maxAttempts?: number; intervalMs?: number } = {}
  ): Promise<T> {
    const { maxAttempts = 30, intervalMs = 1000 } = options;
    let attempts = 0;
    let result: T;

    while (attempts < maxAttempts) {
      result = await fn();
      if (condition(result)) {
        return result;
      }
      await this.wait(intervalMs);
      attempts++;
    }

    throw new Error('Condition not met within timeout');
  }
}