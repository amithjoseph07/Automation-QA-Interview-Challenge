export const TestData = {
  sources: {
    valid: {
      name: 'Test Knowledge Source',
      type: 'ONENOTE',
      config: {
        notebook: 'Test Notebook',
        section: 'Test Section',
        credentials: {
          clientId: 'test-client-id',
          tenantId: 'test-tenant-id',
          clientSecret: 'test-secret',
        },
      },
      metadata: {
        owner: 'qa-tester@example.com',
        department: 'QA',
        tags: ['test', 'automation', 'qa'],
      },
    },
    invalid: {
      name: '',
      type: 'INVALID_TYPE',
      config: {},
    },
    github: {
      name: 'GitHub Test Source',
      type: 'GITHUB',
      config: {
        repository: 'test-org/test-repo',
        branch: 'main',
        token: 'github-test-token',
      },
    },
  },

  searchQueries: {
    simple: 'test query',
    complex: 'scheduling AND (conflict OR overlap) NOT resolved',
    semantic: 'how to handle concurrent bookings',
    empty: '',
    specialChars: 'test!@#$%^&*()',
    sqlInjection: "'; DROP TABLE users; --",
    xss: '<script>alert("XSS")</script>',
    long: 'a'.repeat(1000),
  },

  users: {
    admin: {
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin',
      token: 'admin-test-token',
    },
    regular: {
      email: 'user@example.com',
      password: 'User123!',
      role: 'user',
      token: 'user-test-token',
    },
    unauthorized: {
      email: 'unauthorized@example.com',
      password: 'Invalid123!',
      role: 'none',
      token: 'invalid-token',
    },
  },

  documents: {
    sample: {
      title: 'Test Document',
      content: 'This is a test document for automated testing.',
      source: 'TEST',
      metadata: {
        author: 'QA Team',
        created: new Date().toISOString(),
        version: '1.0.0',
      },
    },
  },

  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
    offsets: [0, 10, 20, 50, 100],
  },

  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    extraLong: 60000,
  },

  errors: {
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    serverError: 500,
  },
};

export function generateRandomSource(overrides: any = {}) {
  const timestamp = Date.now();
  return {
    ...TestData.sources.valid,
    name: `Test Source ${timestamp}`,
    ...overrides,
  };
}

export function generateSearchQuery(type: 'simple' | 'complex' | 'semantic' = 'simple') {
  const queries = {
    simple: ['lesson', 'schedule', 'teacher', 'student', 'booking'],
    complex: [
      'lesson AND teacher',
      'schedule OR availability',
      'conflict NOT resolved',
    ],
    semantic: [
      'how to book a lesson',
      'finding available teachers',
      'resolving scheduling conflicts',
    ],
  };

  const querySet = queries[type];
  return querySet[Math.floor(Math.random() * querySet.length)];
}

export function expectResponseSchema(response: any, schema: any) {
  Object.keys(schema).forEach(key => {
    expect(response).toHaveProperty(key);
    if (typeof schema[key] === 'string') {
      expect(typeof response[key]).toBe(schema[key]);
    } else if (typeof schema[key] === 'object') {
      expectResponseSchema(response[key], schema[key]);
    }
  });
}

export const Schemas = {
  source: {
    id: 'string',
    name: 'string',
    type: 'string',
    status: 'string',
    createdAt: 'string',
    updatedAt: 'string',
  },
  searchResult: {
    total: 'number',
    items: 'array',
    pagination: {
      limit: 'number',
      offset: 'number',
      hasNext: 'boolean',
      hasPrevious: 'boolean',
    },
  },
  job: {
    jobId: 'string',
    status: 'string',
    progress: 'number',
    createdAt: 'string',
    completedAt: 'string',
  },
};