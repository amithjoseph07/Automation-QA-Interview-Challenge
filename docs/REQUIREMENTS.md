# Detailed Requirements - Student Onboarding Test Automation

## Business Context

You're testing a music school management system that handles student enrollment, teacher scheduling, and lesson management. The system serves music schools with 50-500 students and needs to handle complex scheduling, billing, and communication requirements.

The **student onboarding flow** is critical because:
- It's the first impression for new customers
- Incorrect data entry causes downstream issues
- Parent/child relationships must be properly established
- Billing and communication preferences affect all future interactions

## System Under Test

### Key Business Rules

1. **Student Types**
   - **Adult Students**: Can manage their own account, receive direct communications
   - **Child Students**: Require parent/guardian information, communications go to parents

2. **Required Information Hierarchy**
   - Every student MUST have: First name, Last name, and either Email OR Phone (if SMS capable)
   - Child students MUST have parent contact information
   - Email becomes mandatory when SMS is disabled

3. **Status Types & Implications**
   - **Active**: Currently taking lessons, full access
   - **Trial**: Limited lessons, evaluation period
   - **Waiting**: On waitlist, cannot book lessons
   - **Lead**: Prospect, no lessons yet
   - **Inactive**: No longer attending

4. **Default Settings**
   - New students inherit school's default lesson duration and pricing
   - These can be overridden per student
   - Billing defaults to "pay per lesson taken"

## Test Scenarios - Detailed Requirements

### Scenario 1: Form Validation Testing

#### 1.1 Required Field Validation

**Test Cases Required:**

```gherkin
Feature: Required Field Validation

Scenario: Empty form submission prevention
  Given I am on the Add Student form
  When I click Next without filling any fields
  Then I should see validation errors for First Name
  And I should see validation errors for Last Name
  And I should see validation errors for Email or Phone
  And the form should not proceed to step 2

Scenario: Partial data submission
  Given I am on the Add Student form
  When I enter only First Name "John"
  And I click Next
  Then I should see validation error for Last Name
  And I should see validation error for contact method
```

#### 1.2 Email and Phone Validation

**Validation Rules to Test:**

| Field | Valid Examples | Invalid Examples | Expected Error |
|-------|---------------|------------------|----------------|
| Email | test@example.com<br>user.name@domain.co.uk | test@<br>@example.com<br>test..test@mail.com | "Please enter a valid email address" |
| Phone | 555-0123<br>(555) 012-3456<br>+1-555-0123 | 123<br>abcdefg<br>555-01 | "Please enter a valid phone number" |

#### 1.3 SMS Capability Logic

**Business Rule:**
- When SMS is enabled → Phone number is required
- When SMS is disabled → Email is required
- At least one communication method must be available

**Test This Flow:**
1. Start with SMS enabled (default)
2. Leave email empty → Should be valid if phone provided
3. Disable SMS with no email → Should show email required error
4. Enable SMS with no phone → Should show phone required error

### Scenario 2: Successful Student Creation

#### 2.1 Adult Student - Minimal Data

**Test Data:**
```javascript
{
  firstName: "TestAdult[timestamp]",
  lastName: "Student",
  email: "test[timestamp]@example.com",
  studentType: "Adult",
  status: "Active"
}
```

**Verification Points:**
- ✅ Student created successfully (success message)
- ✅ Redirected to student detail page
- ✅ Student ID generated (format: sdt_XXXXX)
- ✅ Student appears in listing
- ✅ All entered data displays correctly

#### 2.2 Child Student with Parent

**Test Data:**
```javascript
{
  student: {
    firstName: "TestChild[timestamp]",
    lastName: "Student",
    studentType: "Child",
    status: "Active"
  },
  parent: {
    firstName: "TestParent",
    lastName: "Guardian",
    email: "parent[timestamp]@example.com",
    phone: "555-0100"
  }
}
```

**Special Requirements:**
- Parent fields should only appear when "Child" is selected
- Both parent email and phone can be provided
- Family account should be created
- "View Family Account" button should appear in student details

### Scenario 3: Data Persistence Verification

#### 3.1 Listing Verification

After creating a student, navigate to `/students` and verify:
- New student appears in the list
- Status badge displays correctly
- Name is formatted as "FirstName LastName"
- Can click through to details page

#### 3.2 Details Page Verification

Navigate to `/students/details?id={student_id}` and verify:

**All tabs should be present:**
- Student Details (contains core information)
- Family Contacts (parent info for children)
- Practice Log (empty for new students)
- Attendance & Notes
- Repertoire
- Message History
- Student Portal

**Data should persist after:**
- Page refresh
- Navigating away and returning
- Logging out and back in

### Scenario 4: Edge Cases

Choose and implement at least 2 of these:

#### 4.1 Duplicate Email Handling
- Create student with email X
- Try to create another student with same email X
- Document system behavior (allows/prevents/warns)

#### 4.2 Special Characters in Names
Test these in name fields:
- Apostrophes: O'Brien
- Hyphens: Smith-Jones
- Accents: José, François
- Spaces: Van Der Berg

#### 4.3 Status Transitions
- Create student as "Trial"
- Verify trial-specific restrictions
- Change to "Active"
- Verify full access granted

#### 4.4 Default Settings Application
- Note the default lesson duration and price
- Create student without specifying these
- Verify defaults were applied
- Create another with custom values
- Verify custom values override defaults

## Technical Implementation Requirements

### Page Object Model Structure

Create clean page objects:

```typescript
// pages/StudentPage.ts
class StudentPage {
  // Element locators as private properties
  private firstNameInput = 'input[name="firstName"]';

  // Public methods for actions
  async enterFirstName(name: string) { }
  async enterLastName(name: string) { }
  async selectStudentType(type: 'Adult' | 'Child') { }
  async submitForm() { }

  // Verification methods
  async getValidationErrors() { }
  async isOnStep(step: number) { }
}

// pages/StudentListPage.ts
class StudentListPage {
  async searchStudent(name: string) { }
  async isStudentInList(name: string): Promise<boolean> { }
  async getStudentCount(): Promise<number> { }
}
```

### Test Data Management

```typescript
// fixtures/StudentFactory.ts
export class StudentFactory {
  static createAdultStudent(): StudentData {
    const timestamp = Date.now();
    return {
      firstName: `Adult${timestamp}`,
      lastName: 'Test',
      email: `adult${timestamp}@test.com`,
      // ... other fields
    };
  }

  static createChildWithParent(): ChildStudentData {
    // Similar structure with parent data
  }
}
```

### Test Structure

```typescript
test.describe('Student Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to add student
  });

  test.afterEach(async ({ page }) => {
    // Clean up created test data
  });

  test('should validate required fields', async ({ page }) => {
    // Given - When - Then structure
  });
});
```

## Assertions to Include

### Must Have Assertions
- Form validation messages appear
- Success notifications display
- URL changes after successful creation
- Data appears in listing
- Data persists in detail view

### Nice to Have Assertions
- Response time (form submission < 3 seconds)
- Loading states display during submission
- Form retains data after validation error
- Accessibility (ARIA labels, keyboard navigation)

## What NOT to Test

❌ **Don't test these:**
- Visual styling (colors, fonts, spacing)
- Browser compatibility (unless specified)
- Performance metrics
- Security vulnerabilities
- Payment processing
- Email delivery

✅ **Focus on these:**
- Business logic
- Data validation
- User journey completion
- Error handling
- Data persistence

## Deliverables Checklist

- [ ] Minimum 5 test scenarios implemented
- [ ] At least 2 edge cases covered
- [ ] Page Object Model used
- [ ] Test data factory created
- [ ] Tests run independently
- [ ] Cleanup implemented
- [ ] README updated with setup instructions
- [ ] SOLUTION.md with your approach

## Evaluation Hints

We'll be looking for:
1. **Business Understanding**: Do you test what matters to the business?
2. **Test Quality**: Are your tests reliable and maintainable?
3. **Code Organization**: Is your code well-structured and reusable?
4. **Error Handling**: Do you handle async operations and errors properly?
5. **Documentation**: Can someone else understand and run your tests?

---

Remember: We're not looking for perfection. We want to see how you think about testing, how you prioritize, and how you implement practical solutions.