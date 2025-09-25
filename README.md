# Automation QA Interview Challenge

Welcome to the PearlThoughts Automation QA Interview Challenge! This challenge is designed to evaluate your ability to write business-focused test automation for a real-world music school management system.

## 📋 Challenge Overview

You will be testing the **student onboarding flow** of a music school management platform, focusing on:
- Form validation and error handling
- Successful student creation (adult and child students)
- Data persistence and verification
- Business rule enforcement

**Time Estimate:** 4-6 hours
**Submission Deadline:** 5 business days from receipt

## 🎯 What We're Looking For

We want to see your ability to:
- Understand and test business-critical workflows
- Write clean, maintainable test automation
- Use Playwright effectively for both API and E2E testing
- Think about edge cases and data validation
- Document your approach clearly

## 🚀 Getting Started

### 1. Choose Your Test Platform

We recommend using one of these music school platforms (all offer free trials):

#### Option A: MyMusicStaff (Recommended)
- URL: https://app.mymusicstaff.com
- Sign up for 30-day free trial
- Full-featured platform similar to our production system

#### Option B: Music Teacher's Helper
- URL: https://www.musicteachershelper.com
- Free trial available
- Good alternative with similar features

#### Option C: SimplyBook.me
- URL: https://simplybook.me
- Choose music school template
- Free trial with booking features

### 2. Set Up Your Environment

```bash
# Clone this repository (fork it privately first)
git clone [your-fork-url]
cd automation-qa-challenge

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your test account credentials
```

### 3. Review the Requirements

Read through the detailed requirements in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) to understand:
- The business context
- Specific test scenarios to implement
- Technical requirements
- Evaluation criteria

## 📝 Your Task

### Required Test Scenarios

You must implement automated tests for the following scenarios:

#### 1. Form Validation Testing
- Empty field validation
- Invalid email/phone format
- Required field enforcement
- SMS capability logic

#### 2. Successful Student Creation
- Adult student with minimal data
- Adult student with complete profile
- Child student with parent information

#### 3. Data Persistence Verification
- Student appears in listing
- All data saved correctly
- Details page shows accurate information

#### 4. Edge Cases (Choose 2)
- Duplicate email handling
- Special characters in names
- Status transitions
- Default settings application

### Technical Requirements

- **Framework:** Playwright (required)
- **Language:** TypeScript
- **Pattern:** Page Object Model
- **Test Independence:** Each test must run independently
- **Data Cleanup:** Implement cleanup for test data

### Project Structure

```
automation-qa-challenge/
├── tests/
│   ├── e2e/                 # End-to-end test files
│   │   └── student-onboarding.spec.ts
│   └── fixtures/            # Test fixtures and helpers
│       ├── pages/          # Page objects
│       └── data/           # Test data factories
├── playwright.config.ts     # Playwright configuration
├── package.json            # Dependencies
├── .env.example           # Environment variables template
├── README.md              # This file
└── docs/
    ├── REQUIREMENTS.md    # Detailed requirements
    └── SUBMISSION.md      # Submission instructions
```

## 💡 Tips for Success

### Do's ✅
- Focus on business value, not UI details
- Write clear, descriptive test names
- Use meaningful assertions
- Handle asynchronous operations properly
- Document your assumptions
- Clean up test data after execution

### Don'ts ❌
- Don't test styling or colors
- Don't create dependencies between tests
- Don't use hard-coded waits
- Don't leave console.logs in final code
- Don't commit credentials

## 🤖 AI Usage Guidelines

You may use AI tools (ChatGPT, Copilot, etc.) to assist you, but:
- You must understand and be able to explain all code
- Add a comment when AI significantly helped: `// AI-assisted: [what it helped with]`
- The overall solution architecture should be your own
- You'll need to explain your code in the interview

## 📊 Evaluation Criteria

Your submission will be evaluated on:

| Criteria | Weight |
|----------|--------|
| Business Logic Understanding | 30% |
| Test Coverage & Scenarios | 25% |
| Technical Implementation | 25% |
| Code Quality | 10% |
| Documentation | 10% |

## 📤 Submission Instructions

1. **Complete Your Implementation**
   - Implement required test scenarios
   - Ensure all tests pass
   - Document your approach

2. **Verify Your Work**
   ```bash
   # Run tests
   npm test

   # Check linting
   npm run lint

   # Verify TypeScript
   npm run typecheck
   ```

3. **Prepare Submission**
   - Push code to your private fork
   - Include a `SOLUTION.md` file describing:
     - Your approach
     - Assumptions made
     - Challenges faced
     - What you'd do with more time

4. **Share Access**
   - Add these GitHub users as collaborators: [will be provided]
   - Send confirmation email to: [hiring email]

## ❓ Questions?

If you have questions about the challenge:
- Technical questions: Create an issue in your fork
- Process questions: Email [hiring contact]
- Platform access issues: Let us know immediately

## 🔍 What Happens Next?

1. We'll review your submission within 2-3 business days
2. If selected, you'll have a 60-minute technical interview where you'll:
   - Walk through your solution
   - Discuss your approach
   - Potentially extend the tests
   - Answer technical questions

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [MyMusicStaff Help Center](https://help.mymusicstaff.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

---

Good luck! We look forward to seeing your approach to testing this real-world business application.

**Note:** This challenge is for evaluation purposes only. Please do not share or distribute the challenge or your solution publicly.