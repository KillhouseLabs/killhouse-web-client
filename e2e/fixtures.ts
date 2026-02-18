import { test as base } from "playwright-bdd";
import { Page } from "@playwright/test";

// Page Object imports
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectPage } from "./pages/ProjectPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

// Fixture types
type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  projectPage: ProjectPage;
  subscriptionPage: SubscriptionPage;
  forgotPasswordPage: ForgotPasswordPage;
  resetPasswordPage: ResetPasswordPage;
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  // Page Objects
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  projectPage: async ({ page }, use) => {
    await use(new ProjectPage(page));
  },

  subscriptionPage: async ({ page }, use) => {
    await use(new SubscriptionPage(page));
  },

  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },

  resetPasswordPage: async ({ page }, use) => {
    await use(new ResetPasswordPage(page));
  },

  // Pre-authenticated page using stored state
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
