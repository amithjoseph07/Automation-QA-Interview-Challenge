# Student Onboarding Flow - Detailed Testing Scope

## Access Points & Navigation

### Getting to Student Onboarding

1. **Direct URL**: `https://app.mymusicstaff.com/Teacher/v2/en/students/add`

2. **Via Dashboard**:
   - Login → Dashboard → Quick Actions → "Add New Student"

3. **Via Students List**:
   - Login → Students (left sidebar) → "Add Student" button (top right)

## Detailed Page-by-Page Flow Analysis

### Step 1: Student Information Page
**URL**: `/Teacher/v2/en/students/add`

#### Form Fields & Validation Rules

##### Section 1: Student Details

| Field | Type | Required | Validation Rules | Error Messages |
|-------|------|----------|-----------------|----------------|
| First Name | Text | Yes | 1-50 chars, letters, spaces, hyphens, apostrophes | "First name is required"<br/>"First name contains invalid characters" |
| Last Name | Text | Yes | 1-50 chars, letters, spaces, hyphens, apostrophes | "Last name is required"<br/>"Last name contains invalid characters" |
| Email | Email | Conditional | Valid email format<br/>Unique in system (warning only) | "Please enter a valid email"<br/>"This email is already in use" |
| Phone Number | Phone | Conditional | 10+ digits, international formats accepted | "Invalid phone number format" |
| SMS Capable | Checkbox | No | When checked, phone becomes required | N/A |

##### Section 2: Student Status

**Status Options** (Radio Buttons):
- **Active** (Default) - Full access, can book lessons
- **Trial** - Limited lessons, evaluation period
- **Waiting** - On waitlist, cannot book
- **Lead** - Prospect only
- **Inactive** - Past student

##### Section 3: Student Type

**Type Options** (Radio Buttons):
- **Adult** - Independent account
- **Child** - Requires family linkage

#### Conditional Logic: Child Student Fields

When "Child" is selected, additional fields appear:

**Family Selection**:
- **New Family** (Radio) - Creates new family account
- **Existing Family** (Radio) - Links to existing family

**If New Family Selected**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Parent First Name | Text | Yes | 1-50 chars |
| Parent Last Name | Text | Yes | 1-50 chars |
| Parent Email | Email | Yes | Primary contact for child |
| Parent Phone | Phone | No | Secondary contact |
| Mobile Number | Phone | No | For SMS notifications |

**If Existing Family Selected**:
- Family Dropdown (searchable) - Shows "FamilyName (ParentEmail)"
- Auto-populates parent information (read-only)

#### Additional Details Section

**Show additional details** (Expandable):

| Field | Type | Required | Options/Notes |
|-------|------|----------|---------------|
| Skill Level | Dropdown | No | Beginner, Intermediate, Advanced, Professional |
| School | Text | No | Student's regular school |
| Group Tags | Multi-select | No | Custom tags for grouping |
| Referrer | Dropdown | No | How they heard about school |
| Instruments | Multi-select | No | Piano, Guitar, Violin, etc. |

#### Default Settings Section (Pre-populated)

**Default Billing**:
- Student pays based on the number of lessons taken (default)
- Other options available in dropdown

**Default Lesson Category**:
- Lesson (default)
- Masterclass, Workshop, Group Class options

**Default Duration**:
- 30 minutes (default)
- 15, 45, 60, 90 minute options

**Price**:
- $30.00/lesson (default)
- Customizable per student

**Notes Section**:
- Private notes (teacher only)
- Character limit: 500

### Step 2: Billing Setup Page
**URL**: `/Teacher/v2/en/students/add` (Step 2/2)

#### Automatic Invoicing Decision

**Main Question**: "Would you like to set up automatic invoicing for this Family now?"

**Options**:
- **Yes** - Configure billing immediately
- **No** - Setup later through Family Account

#### If "Yes" Selected - Billing Configuration

**Billing Frequency**:
- Monthly (1st of month)
- Weekly
- Per lesson
- Custom schedule

**Payment Method**:
- Credit Card (via Stripe)
- Bank Transfer (ACH)
- Cash/Check (manual)

**Invoice Settings**:
- Send invoice X days before due
- Payment due X days after invoice
- Late fee settings
- Auto-charge enabled/disabled

### Post-Creation: Student Details Page
**URL**: `/Teacher/v2/en/students/details?id=sdt_[uniqueId]#AdditionalDetails`

#### Page Structure & Tabs

**Tab Navigation**:
1. **Student Details** - Core information, edit capabilities
2. **Family Contacts** - Parent/guardian information
3. **Practice Log** - Practice tracking (empty initially)
4. **Attendance & Notes** - Lesson attendance history
5. **Repertoire** - Songs/pieces being learned
6. **Message History** - Communication log
7. **Student Portal** - Portal access management

#### Verification Points for Testing

**Immediate Verification** (< 1 second):
- Student ID generated (format: `sdt_XXXXX`)
- All entered data displays correctly
- Status badge shows correctly
- Edit button functional

**Near Real-time Verification** (< 5 seconds):
- Student appears in main list
- Search finds student by name/email
- Count in sidebar updates

**Async Verification** (< 30 seconds):
- Welcome email sent (if configured)
- Billing account created
- Calendar updated
- Audit log entry created

## Test Scenarios by Business Priority

### Priority 1: Revenue-Impacting Scenarios

#### Scenario 1.1: Trial to Active Conversion
```gherkin
Feature: Trial Student Conversion
  Critical for revenue realization

  Background:
    Given a trial student "Emma Thompson" exists
    And trial period is set to 2 lessons
    And student has completed 2 trial lessons

  Scenario: Successful conversion to active
    When admin converts student to active status
    And selects monthly billing package
    And enters payment information
    Then student status changes to "Active"
    And billing account is created
    And first invoice is generated
    And welcome package email is sent
    And teacher is notified of conversion
```

#### Scenario 1.2: Family Account Billing
```gherkin
Feature: Multi-Student Family Billing
  Critical for family discounts and consolidated billing

  Scenario: Adding second child to existing family
    Given a family "Johnson Family" exists
    And has one active student "Billy Johnson"
    When adding new student "Sally Johnson"
    And selecting "Existing Family" → "Johnson Family"
    Then student is linked to same family account
    And family discount is automatically applied
    And consolidated invoice includes both students
    And single payment covers both students
```

### Priority 2: Compliance-Critical Scenarios

#### Scenario 2.1: COPPA Compliance for Under-13
```gherkin
Feature: COPPA Compliance
  Legal requirement for minors

  Scenario: Child under 13 enrollment
    Given student age will be under 13
    When creating student record
    Then parent information is mandatory
    And parent consent checkbox must be checked
    And limited data collection is enforced
    And no marketing communications allowed
    And special deletion rights are available
```

### Priority 3: Operational Efficiency Scenarios

#### Scenario 3.1: Bulk Student Import
```gherkin
Feature: Seasonal Enrollment Rush
  Critical during September enrollment period

  Scenario: Handling concurrent registrations
    Given 5 admin users are logged in
    When all simultaneously try to add different students
    Then all students are created successfully
    And no duplicate IDs are generated
    And all appear in the list
    And system remains responsive
```

## Complex Test Cases Requiring Deep Thinking

### Case 1: The Divorced Parents Dilemma
**Scenario**: Parents are divorced with shared custody. Both want access but separate billing.

**Test Approach**:
1. Create student linked to mother's family
2. Add father as additional contact
3. Verify communication preferences can differ
4. Test billing split scenarios
5. Ensure both can access student portal
6. Verify schedule visibility for both

### Case 2: The International Student
**Scenario**: Student from Japan, name in Kanji, timezone differences

**Test Data**:
- Name: 田中美咲 (Tanaka Misaki)
- Phone: +81 90-1234-5678
- Timezone: JST (UTC+9)

**Verifications**:
- Character encoding preserved
- Phone validation accepts international
- Times display in correct timezone
- Communications sent at appropriate times

### Case 3: The Package Transition
**Scenario**: Student mid-month changes from 30-min to 45-min lessons

**Business Logic**:
- Prorate current month
- Update future bookings
- Adjust teacher schedule
- Recalculate commission
- Update invoicing

### Case 4: The Waitlist Conversion
**Scenario**: Popular teacher has opening, waitlisted student gets spot

**Flow**:
1. Student on waitlist for "Mr. Smith"
2. Active student cancels
3. System should notify waitlisted student
4. 48-hour claim window
5. Auto-advance if not claimed
6. Update all statuses

## Data Validation Matrix

### Input Validation Testing

| Field | Valid Inputs | Invalid Inputs | Edge Cases |
|-------|--------------|----------------|------------|
| First Name | John, Mary-Jane, O'Brien | 123, @#$, empty, 51 chars | José, Müller, 李明 |
| Email | user@domain.com | user@, @domain, user@ | user+tag@domain.com |
| Phone | 555-0123, (555) 012-3456 | 123, abcd | +1-555-0123, ext. 123 |
| Student Type | Adult, Child | null, undefined | Switching after creation |

### Business Rule Validation

| Rule | Condition | Expected Behavior | Test Approach |
|------|-----------|-------------------|---------------|
| Email Unique | Email exists | Warning shown, allow proceed | Create duplicate, verify warning |
| SMS Requires Phone | SMS enabled, no phone | Error, prevent submission | Enable SMS, clear phone, submit |
| Child Needs Parent | Type=Child, no parent | Error, prevent submission | Select child, skip parent, submit |
| Trial Limit | Trial > 30 days | Auto-convert or expire | Create old trial, verify status |

## Performance Testing Targets

### Response Time Requirements

| Action | Target | Maximum | Measurement Point |
|--------|--------|---------|-------------------|
| Form Load | < 1s | 2s | DOMContentLoaded |
| Field Validation | < 100ms | 500ms | OnBlur event |
| Form Submission | < 2s | 5s | Submit to redirect |
| List Update | < 1s | 3s | After creation |

### Concurrent User Testing

```javascript
// Pseudocode for concurrent testing
async function testConcurrentStudentCreation() {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(createStudent({
      firstName: `Student${i}`,
      lastName: `Concurrent${Date.now()}`,
      email: `test${i}@concurrent.com`
    }));
  }

  const results = await Promise.allSettled(promises);

  // All should succeed
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(10);

  // All should have unique IDs
  const ids = results.map(r => r.value.id);
  expect(new Set(ids).size).toBe(10);
}
```

## Anti-Patterns to Avoid in Testing

### ❌ Don't Test These
1. CSS styling and colors
2. Exact pixel positions
3. Font families or sizes
4. Animation timing
5. Marketing copy/text
6. Third-party service internals

### ✅ Do Test These
1. Business logic validation
2. Data persistence
3. State transitions
4. Error handling
5. User journey completion
6. Integration points

## Test Data Management Strategy

### Data Lifecycle

```mermaid
graph LR
    Create[Create Test Student] --> Use[Execute Tests]
    Use --> Verify[Verify Results]
    Verify --> Clean[Cleanup]

    Clean --> Delete[Soft Delete Student]
    Delete --> Archive[Archive Family if Empty]
    Archive --> Purge[Purge after 24h]
```

### Naming Conventions for Test Data

```javascript
const testDataNaming = {
  student: {
    firstName: `Test${Date.now()}`,
    lastName: `Student${testRunId}`,
    email: `test.${Date.now()}@qatest.com`
  },
  family: {
    name: `TestFamily${Date.now()}`,
    parentEmail: `parent.${Date.now()}@qatest.com`
  },
  tags: {
    cleanup: 'qa-test-data',
    timestamp: Date.now(),
    testRun: testRunId
  }
};
```

## Critical Success Factors

Your tests should answer these business questions:

1. **Can a new customer successfully enroll their child?**
2. **Will billing work correctly for family accounts?**
3. **Are minors' data properly protected?**
4. **Can the system handle September enrollment rush?**
5. **Will status transitions work without data loss?**
6. **Do validation rules prevent bad data?**
7. **Can admins efficiently manage hundreds of students?**

---

## Remember

You're not just testing form fields—you're validating a business-critical workflow that directly impacts revenue, compliance, and customer satisfaction. Think beyond the happy path and consider the real complexities of managing a music education business.