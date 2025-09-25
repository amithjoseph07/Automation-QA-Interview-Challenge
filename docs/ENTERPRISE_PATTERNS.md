# Enterprise Testing Patterns for MyMusicStaff

## Architectural Testing Considerations

### System Architecture Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[React/Next.js UI]
        Mobile[Mobile Responsive]
    end

    subgraph "API Gateway"
        Gateway[API Gateway/Load Balancer]
        Auth[Authentication Service]
    end

    subgraph "Business Logic Layer"
        StudentService[Student Service]
        ScheduleService[Schedule Service]
        BillingService[Billing Service]
        NotificationService[Notification Service]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[S3 Documents]
    end

    subgraph "External Services"
        Stripe[Stripe Payments]
        SendGrid[SendGrid Email]
        Twilio[Twilio SMS]
    end

    UI --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Gateway --> StudentService
    Gateway --> ScheduleService
    Gateway --> BillingService

    StudentService --> PostgreSQL
    StudentService --> Redis
    ScheduleService --> PostgreSQL
    BillingService --> Stripe
    NotificationService --> SendGrid
    NotificationService --> Twilio
```

### Testing at Each Layer

| Layer | Testing Focus | Tools/Approach |
|-------|--------------|----------------|
| UI Layer | User flows, form validation, responsive design | Playwright E2E |
| API Gateway | Authentication, rate limiting, routing | Playwright API + E2E |
| Business Logic | Business rules, data validation, workflows | API tests, Integration tests |
| Data Layer | Data persistence, consistency, performance | Verification queries |
| External Services | Integration reliability, error handling | Mocked responses, contract tests |

## Event-Driven Architecture Patterns

### Student Creation Event Flow

```mermaid
sequenceDiagram
    participant UI as UI Layer
    participant API as API Gateway
    participant Service as Student Service
    participant Events as Event Bus
    participant Billing as Billing Service
    participant Email as Email Service
    participant Search as Search Index

    UI->>API: POST /students
    API->>Service: CreateStudent(data)
    Service->>Service: Validate Business Rules
    Service->>Service: Save to Database

    Service->>Events: Publish StudentCreated Event

    par Async Processing
        Events->>Billing: Subscribe: Setup Account
        Billing-->>Events: BillingAccountCreated
    and
        Events->>Email: Subscribe: Send Welcome
        Email-->>Events: EmailQueued
    and
        Events->>Search: Subscribe: Index Student
        Search-->>Events: IndexUpdated
    end

    Service-->>API: Return Student ID
    API-->>UI: 201 Created + Location
```

### Testing Event-Driven Systems

```typescript
// Example: Testing eventual consistency
async function testEventualConsistency() {
  // Create student
  const student = await createStudent(testData);

  // Immediate check - should exist in primary DB
  const immediate = await getStudent(student.id);
  expect(immediate).toBeDefined();

  // Wait for eventual consistency
  await waitFor(async () => {
    // Check search index
    const searchResult = await searchStudent(student.email);
    return searchResult.length > 0;
  }, {
    timeout: 5000,
    interval: 500
  });

  // Verify all downstream services
  const billing = await getBillingAccount(student.id);
  expect(billing).toBeDefined();

  const welcomeEmail = await getEmailQueue(student.email);
  expect(welcomeEmail).toContain('Welcome');
}
```

## Domain-Driven Design Patterns

### Bounded Contexts in Music School Domain

```mermaid
graph TB
    subgraph "Student Management Context"
        Student[Student Aggregate]
        Family[Family Aggregate]
        Enrollment[Enrollment Process]
    end

    subgraph "Scheduling Context"
        Schedule[Schedule Aggregate]
        Lesson[Lesson Entity]
        Availability[Availability Value Object]
    end

    subgraph "Billing Context"
        Invoice[Invoice Aggregate]
        Payment[Payment Entity]
        Package[Package Value Object]
    end

    subgraph "Communication Context"
        Notification[Notification Aggregate]
        Template[Template Entity]
        Preference[Preference Value Object]
    end

    Student -->|Triggers| Enrollment
    Enrollment -->|Creates| Schedule
    Schedule -->|Generates| Invoice
    Invoice -->|Sends| Notification
```

### Aggregate Testing Strategies

```typescript
// Testing Student Aggregate invariants
describe('Student Aggregate', () => {
  test('should enforce business invariants', async () => {
    const student = new Student();

    // Invariant: Child must have parent
    expect(() => {
      student.setType('Child');
      student.save();
    }).toThrow('Child student requires parent information');

    // Invariant: Cannot have duplicate active enrollments
    student.addEnrollment({ instrument: 'Piano', teacher: 'Smith' });
    expect(() => {
      student.addEnrollment({ instrument: 'Piano', teacher: 'Smith' });
    }).toThrow('Student already enrolled in Piano with Smith');

    // Invariant: Status transitions must be valid
    student.setStatus('Trial');
    expect(() => {
      student.setStatus('Graduated');
    }).toThrow('Cannot transition from Trial to Graduated');
  });
});
```

## Microservices Testing Patterns

### Service Interaction Testing

```mermaid
graph LR
    subgraph "Test Scenario: Student Creation"
        Test[Playwright Test]
    end

    subgraph "Service Mesh"
        Gateway[API Gateway]
        Student[Student Service]
        Billing[Billing Service]
        Notification[Notification Service]
    end

    subgraph "Test Doubles"
        StubBilling[Billing Stub]
        MockNotification[Notification Mock]
    end

    Test -->|1. Create Student| Gateway
    Gateway -->|2. Route| Student
    Student -->|3. Check Billing| StubBilling
    Student -->|4. Queue Notification| MockNotification
    StubBilling -->|5. Return Success| Student
    Student -->|6. Return Created| Gateway
    Gateway -->|7. Response| Test

    Test -->|8. Verify Mock Calls| MockNotification
```

### Contract Testing Between Services

```typescript
// Consumer Contract Test (Student Service → Billing Service)
describe('Student Service as Billing Consumer', () => {
  test('should handle billing service contract', async () => {
    const pact = new Pact({
      consumer: 'StudentService',
      provider: 'BillingService'
    });

    await pact.setup();

    // Define expected interaction
    await pact.addInteraction({
      state: 'Billing service is available',
      uponReceiving: 'a request to create billing account',
      withRequest: {
        method: 'POST',
        path: '/billing/accounts',
        body: {
          studentId: like('sdt_12345'),
          type: 'student',
          billingCycle: 'monthly'
        }
      },
      willRespondWith: {
        status: 201,
        body: {
          accountId: like('acc_67890'),
          status: 'active'
        }
      }
    });

    // Test the interaction
    const result = await studentService.createBillingAccount('sdt_12345');
    expect(result.accountId).toBeDefined();

    await pact.verify();
  });
});
```

## CQRS Pattern Implementation

### Command vs Query Separation

```mermaid
graph TB
    subgraph "Commands (Write)"
        CreateStudent[Create Student Command]
        UpdateStatus[Update Status Command]
        EnrollLesson[Enroll Lesson Command]
    end

    subgraph "Command Handlers"
        StudentHandler[Student Command Handler]
    end

    subgraph "Write Model"
        WriteDB[(PostgreSQL - Normalized)]
    end

    subgraph "Queries (Read)"
        GetStudent[Get Student Query]
        SearchStudents[Search Students Query]
        GetSchedule[Get Schedule Query]
    end

    subgraph "Query Handlers"
        StudentQuery[Student Query Handler]
    end

    subgraph "Read Model"
        ReadDB[(PostgreSQL - Denormalized)]
        Cache[(Redis Cache)]
        Search[(Elasticsearch)]
    end

    CreateStudent --> StudentHandler
    UpdateStatus --> StudentHandler
    EnrollLesson --> StudentHandler

    StudentHandler --> WriteDB

    WriteDB -->|Event Projection| ReadDB
    WriteDB -->|Event Projection| Cache
    WriteDB -->|Event Projection| Search

    GetStudent --> StudentQuery
    SearchStudents --> StudentQuery
    GetSchedule --> StudentQuery

    StudentQuery --> ReadDB
    StudentQuery --> Cache
    StudentQuery --> Search
```

### Testing CQRS Patterns

```typescript
// Testing Command Side
describe('Student Commands', () => {
  test('CreateStudent command should emit event', async () => {
    const command = new CreateStudentCommand({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com'
    });

    const events = await commandHandler.handle(command);

    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'StudentCreated',
        aggregateId: expect.stringMatching(/^sdt_/),
        data: expect.objectContaining({
          firstName: 'John'
        })
      })
    );
  });
});

// Testing Query Side
describe('Student Queries', () => {
  test('should return denormalized view', async () => {
    // Given: Student exists in write model
    await createStudent({ id: 'sdt_123' });

    // When: Query read model
    const query = new GetStudentQuery('sdt_123');
    const result = await queryHandler.handle(query);

    // Then: Should return enriched view
    expect(result).toMatchObject({
      id: 'sdt_123',
      lessonCount: 0,
      upcomingLessons: [],
      lastActivity: expect.any(Date),
      familyMembers: []
    });
  });
});
```

## Saga Pattern for Distributed Transactions

### Student Enrollment Saga

```mermaid
graph TD
    Start[Start Enrollment Saga] --> CheckAvail[Check Teacher Availability]

    CheckAvail -->|Available| ReserveSlot[Reserve Time Slot]
    CheckAvail -->|Not Available| Compensate1[Notify Unavailable]

    ReserveSlot -->|Success| CreateBilling[Create Billing Setup]
    ReserveSlot -->|Fail| Compensate2[Release Reservation]

    CreateBilling -->|Success| SendConfirm[Send Confirmation]
    CreateBilling -->|Fail| Compensate3[Cancel Enrollment]

    SendConfirm -->|Success| Complete[Complete Saga]
    SendConfirm -->|Fail| Compensate4[Rollback All]

    Compensate1 --> Failed[Saga Failed]
    Compensate2 --> Failed
    Compensate3 --> Failed
    Compensate4 --> Failed
```

### Testing Saga Compensations

```typescript
describe('Enrollment Saga', () => {
  test('should compensate on billing failure', async () => {
    // Arrange: Force billing service to fail
    mockBillingService.createAccount.mockRejectedValue(new Error('Payment method invalid'));

    // Act: Start enrollment saga
    const saga = new EnrollmentSaga();
    const result = await saga.execute({
      studentId: 'sdt_123',
      teacherId: 'tch_456',
      timeSlot: 'Monday 3pm'
    });

    // Assert: Compensation occurred
    expect(result.status).toBe('compensated');
    expect(mockScheduleService.releaseSlot).toHaveBeenCalledWith('Monday 3pm');
    expect(mockNotificationService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EnrollmentFailed',
        reason: 'Payment setup failed'
      })
    );
  });
});
```

## Performance Testing Patterns

### Load Testing Student Creation

```typescript
// k6 Performance Test Script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<5000'], // 95% of requests under 5s
    'errors': ['rate<0.1'],              // Error rate under 10%
  },
};

export default function() {
  const payload = JSON.stringify({
    firstName: `LoadTest${Date.now()}`,
    lastName: 'Student',
    email: `test${Date.now()}@load.com`,
    type: 'Adult',
    status: 'Active'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + __ENV.API_TOKEN,
    },
  };

  const response = http.post('https://app.mymusicstaff.com/api/students', payload, params);

  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 5s': (r) => r.timings.duration < 5000,
    'student id returned': (r) => JSON.parse(r.body).id !== undefined,
  });

  errorRate.add(!success);
  sleep(1);
}
```

## Chaos Engineering Considerations

### Failure Injection Points

```mermaid
graph TB
    subgraph "Failure Scenarios to Test"
        F1[Database Connection Loss]
        F2[Redis Cache Unavailable]
        F3[Payment Gateway Timeout]
        F4[Email Service Down]
        F5[High Latency]
        F6[Disk Full]
    end

    subgraph "Expected Behaviors"
        B1[Graceful Degradation]
        B2[Circuit Breaker Opens]
        B3[Fallback to Queue]
        B4[User Notification]
        B5[Retry with Backoff]
        B6[Switch to Read-only]
    end

    F1 --> B6
    F2 --> B1
    F3 --> B2
    F4 --> B3
    F5 --> B5
    F6 --> B4
```

### Resilience Testing Example

```typescript
describe('System Resilience', () => {
  test('should handle payment service failure gracefully', async ({ page }) => {
    // Inject failure
    await page.route('**/api/billing/**', route => {
      route.abort('failed');
    });

    // Attempt student creation
    await createStudentFlow(page, testData);

    // Should show appropriate error
    await expect(page.locator('.alert-warning'))
      .toContainText('Billing setup unavailable. Student created but requires manual billing setup.');

    // Student should still be created
    await page.goto('/students');
    await expect(page.locator(`text=${testData.name}`)).toBeVisible();

    // Should be marked for manual processing
    await expect(page.locator('.billing-pending-badge')).toBeVisible();
  });
});
```

## Security Testing Patterns

### OWASP Top 10 Considerations

| Vulnerability | Test Scenario | Expected Result |
|--------------|--------------|-----------------|
| SQL Injection | Input: `'; DROP TABLE students; --` | Input sanitized, no DB impact |
| XSS | Input: `<script>alert('XSS')</script>` | HTML encoded on display |
| CSRF | Submit without CSRF token | Request rejected |
| Broken Auth | Access with expired token | 401 Unauthorized |
| Sensitive Data | Check response payloads | No passwords, tokens exposed |
| XXE | Upload malicious XML | XML parsing disabled |
| Broken Access | Student A access Student B | 403 Forbidden |
| Security Misconfig | Check error messages | No stack traces exposed |
| Vulnerable Components | Check dependencies | All updated, no CVEs |
| Insufficient Logging | Perform suspicious actions | All logged with context |

## Test Strategy for Complex Systems

### Testing Pyramid for Enterprise Systems

```mermaid
graph TD
    subgraph "Test Distribution"
        E2E[E2E Tests - 10%<br/>Critical User Journeys]
        Integration[Integration Tests - 20%<br/>Service Interactions]
        Component[Component Tests - 30%<br/>Business Logic]
        Unit[Unit Tests - 40%<br/>Functions and Methods]
    end

    subgraph "Execution Time"
        E2ETime[~30 minutes]
        IntTime[~10 minutes]
        CompTime[~5 minutes]
        UnitTime[~1 minute]
    end

    E2E --> E2ETime
    Integration --> IntTime
    Component --> CompTime
    Unit --> UnitTime
```

### Risk-Based Test Selection

```typescript
// Test prioritization based on risk score
const testPriorities = {
  'student-creation': {
    businessImpact: 10,  // Revenue critical
    probability: 8,       // Used daily
    riskScore: 80,       // High priority
    coverage: 'comprehensive'
  },
  'report-generation': {
    businessImpact: 5,   // Nice to have
    probability: 3,       // Used monthly
    riskScore: 15,       // Low priority
    coverage: 'basic'
  }
};

// Dynamic test selection based on risk
function selectTests(timeAvailable: number) {
  const sorted = Object.entries(testPriorities)
    .sort((a, b) => b[1].riskScore - a[1].riskScore);

  const selected = [];
  let timeUsed = 0;

  for (const [test, meta] of sorted) {
    const testTime = getTestDuration(test);
    if (timeUsed + testTime <= timeAvailable) {
      selected.push(test);
      timeUsed += testTime;
    }
  }

  return selected;
}
```

## Key Takeaways for Candidates

1. **Think in Systems**: Consider the entire ecosystem, not just the UI
2. **Embrace Complexity**: Real systems have intricate business rules
3. **Plan for Failure**: Test resilience and recovery scenarios
4. **Consider Scale**: Your tests should work for 10 or 10,000 students
5. **Business First**: Technical patterns serve business needs
6. **Maintainability Matters**: Complex tests need clear structure

Your automation should demonstrate understanding of these enterprise patterns while remaining practical and maintainable.