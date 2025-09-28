import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { StudentFormPage } from '@pages/StudentFormPage';
import { StudentListPage } from '@pages/StudentListPage';
import { StudentDetailsPage } from '@pages/StudentDetailsPage';
import { StudentFactory } from '@data/StudentFactory';
import { BasePage } from '@pages/BasePage';

test.describe('Student Onboarding Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let studentFormPage: StudentFormPage;
  let studentListPage: StudentListPage;
  let studentDetailsPage: StudentDetailsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    studentFormPage = new StudentFormPage(page);
    studentListPage = new StudentListPage(page);
    studentDetailsPage = new StudentDetailsPage(page);

    await loginPage.navigate('/login');
    await loginPage.login(process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
    expect(await dashboardPage.isDashboardVisible()).toBeTruthy();
  });

  test('Add, verify, and delete a new adult student', async ({ page }) => {
    const student = StudentFactory.generateAdultStudent();

    // Add adult student
    await studentFormPage.navigate('/Teacher/v2/en/students/add');
    await studentFormPage.addAdultStudent(student.fullName, student.email, student.phone);

    const success = await studentFormPage.getSuccessMessage();
    expect(success).toContain('Student added successfully');

    // Verify in list
    await studentListPage.navigateToList();
    await studentListPage.searchStudent(student.fullName);
    expect(await studentListPage.isStudentPresent(student.fullName)).toBeTruthy();

    // Verify details
    await studentListPage.openStudentDetails(student.fullName);
    const details = await studentDetailsPage.getStudentDetails();
    expect(details.name).toBe(student.fullName);
    expect(details.email).toBe(student.email);
    expect(details.phone).toBe(student.phone);
    expect(details.type).toBe('Adult');

    // Cleanup: delete student
    await studentListPage.navigateToList();
    await studentListPage.deleteStudent(student.fullName);
    expect(await studentListPage.isStudentPresent(student.fullName)).toBeFalsy();
  });

  test('Add, verify, and delete a new child student with parent', async ({ page }) => {
    const student = StudentFactory.generateChildStudent();

    // Add child student
    await studentFormPage.navigate('/Teacher/v2/en/students/add');
    await studentFormPage.addChildStudent(student.fullName, student.email, student.parent);

    const success = await studentFormPage.getSuccessMessage();
    expect(success).toContain('Student added successfully');

    // Verify in list
    await studentListPage.navigateToList();
    await studentListPage.searchStudent(student.fullName);
    expect(await studentListPage.isStudentPresent(student.fullName)).toBeTruthy();

    // Verify details
    await studentListPage.openStudentDetails(student.fullName);
    const details = await studentDetailsPage.getStudentDetails();
    expect(details.name).toBe(student.fullName);
    expect(details.email).toBe(student.email);
    expect(details.type).toBe('Child');
    expect(details.parent).toBe(student.parent);

    // Cleanup: delete student
    await studentListPage.navigateToList();
    await studentListPage.deleteStudent(student.fullName);
    expect(await studentListPage.isStudentPresent(student.fullName)).toBeFalsy();
  });
});
