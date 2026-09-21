import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const password = "DevSyncTest123!";
async function signup(page, name, email) {
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill(name);
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: `Hello, ${name.split(" ")[0]}.` }),
  ).toBeVisible();
}
async function login(page, email, pass = password) {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(pass);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Live updates", { exact: true })).toBeVisible();
}
async function closeDialog(page) {
  await page.getByRole("button", { name: "Close dialog" }).click();
}

test("complete owner/member collaboration, live updates, profile and session security", async ({
  page,
  browser,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const suffix = Date.now();
  const ownerEmail = `owner.${suffix}@example.com`,
    memberEmail = `member.${suffix}@example.com`;
  await signup(page, "Shahzaib Khan", ownerEmail);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project name").fill("Website redesign");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A thoughtful new home for our brand.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Website redesign", exact: true }),
  ).toBeVisible();
  const projectId = new URL(page.url()).pathname.split("/").pop();
  const reg = await request.post("http://127.0.0.1:5001/api/auth/register", {
    data: { name: "Bilal Ahmed", email: memberEmail, password },
  });
  expect(reg.status()).toBe(201);
  await page.getByRole("tab", { name: "Members", exact: true }).click();
  await page.getByLabel("Member email").fill(memberEmail);
  await page.getByRole("button", { name: "Add member", exact: true }).click();
  await expect(page.getByText(memberEmail, { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Board", exact: true }).click();
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page.getByLabel("Task title").fill("Design the new homepage");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Explore a cleaner layout and a warmer visual direction.");
  await page.getByLabel("Priority", { exact: true }).selectOption("high");
  await page
    .getByLabel("Assignee", { exact: true })
    .selectOption({ label: "Bilal Ahmed" });
  await page.getByLabel("Due date", { exact: true }).fill("2026-12-15");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Design the new homepage", exact: true }),
  ).toBeVisible();
  const context = await browser.newContext();
  const member = await context.newPage();
  await login(member, memberEmail);
  await member.goto(`/projects/${projectId}`);
  await expect(
    member.getByRole("heading", {
      name: "Design the new homepage",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    member.getByRole("button", { name: "Edit project", exact: true }),
  ).toHaveCount(0);
  // A drag in one browser must update the other browser without a manual refresh.
  const handle = page.getByRole("button", {
    name: "Move Design the new homepage",
  });
  const target = page.locator(".column-in-progress");
  const a = await handle.boundingBox(),
    b = await target.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + 15, a.y + 8, { steps: 5 });
  await page.mouse.move(b.x + b.width / 2, b.y + 100, { steps: 15 });
  await page.mouse.up();
  await expect(
    member
      .locator(".column-in-progress")
      .getByRole("heading", { name: "Design the new homepage" }),
  ).toBeVisible();
  await member
    .getByRole("button", { name: "Design the new homepage", exact: false })
    .filter({ has: member.locator("h4") })
    .click();
  await member
    .getByLabel("Write a comment")
    .fill("First draft is ready for your review.");
  await member.getByRole("button", { name: "Post comment" }).click();
  await expect(
    member.getByText("First draft is ready for your review.", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".kanban-open")
    .filter({ hasText: "Design the new homepage" })
    .click();
  await expect(
    page.getByText("First draft is ready for your review.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Move to", { exact: true }).selectOption("completed");
  await expect(member.getByLabel("Move to", { exact: true })).toHaveValue(
    "completed",
  );
  await closeDialog(page);
  await closeDialog(member);
  await page.goto("/profile");
  await page.getByLabel("Full name", { exact: true }).fill("Shahzaib Dev");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".profile-summary h2")).toHaveText("Shahzaib Dev");
  // A real PNG passes browser file input, multipart validation and Sharp processing.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAJ0lEQVQ4jWMotI6kCmIYNahwNIwKR9OR9WgWsR4tRiJHS8jIgaxFADGeS1+HeCgSAAAAAElFTkSuQmCC",
    "base64",
  );
  await page
    .getByLabel("Choose profile picture", { exact: true })
    .setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Save photo", exact: true }).click();
  await expect(page.locator(".profile-summary img")).toHaveAttribute(
    "src",
    /^data:image\/webp/,
  );
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".profile-summary img")).toHaveCount(0);
  await page.goto(`/projects/${projectId}`);
  await page.getByRole("tab", { name: "Members", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove Bilal Ahmed", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    member.getByText("We couldn’t load this.", { exact: true }),
  ).toBeVisible();
  await page.goto("/profile");
  await page.getByLabel("Current password", { exact: true }).fill(password);
  await page
    .getByLabel("New password", { exact: true })
    .fill("UpdatedPassword456!");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("UpdatedPassword456!");
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, ownerEmail, "UpdatedPassword456!");
  await page.goto("/notifications");
  await expect(
    page.getByRole("heading", { name: "Notifications", exact: true }),
  ).toBeVisible();
  if (await page.getByRole("button", { name: "Mark as read" }).count())
    await page.getByRole("button", { name: "Mark as read" }).first().click();
  expect(errors).toEqual([]);
  await context.close();
});

test("empty workspace, validation, responsive navigation and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signup(page, "Mobile User", `mobile.${Date.now()}@example.com`);
  await expect(
    page.getByRole("heading", { name: "Your first project starts here" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "My tasks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My tasks", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No matching assignments" }),
  ).toBeVisible();
  await page.goto("/profile");
  await page
    .getByLabel("Choose profile picture", { exact: true })
    .setInputFiles({
      name: "not-an-image.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
  await expect(
    page.getByText("Choose a JPEG, PNG or WebP image.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Current password", { exact: true }).fill(password);
  await page.getByLabel("New password", { exact: true }).fill("Different123!");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("Mismatch123!");
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(
    page.getByText("New passwords do not match.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("visual review: populated desktop screens and mobile board", async ({
  page,
  request,
}) => {
  await signup(page, "Shahzaib Ahmed", `visual.${Date.now()}@example.com`);
  const auth = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("devsync.session")),
  );
  const headers = { Authorization: `Bearer ${auth.token}` };
  const projects = [];
  for (const [name, description] of [
    [
      "Website redesign",
      "A fresh digital experience. Thoughtful design, from the first click to the final detail.",
    ],
    [
      "DevSync launch",
      "Everything we need to bring our new workspace to life.",
    ],
    [
      "Brand foundations",
      "A shared visual language for the next chapter of our brand.",
    ],
  ]) {
    const response = await request.post("http://127.0.0.1:5001/api/projects", {
      headers,
      data: { name, description },
    });
    expect(response.ok()).toBeTruthy();
    projects.push((await response.json()).data);
  }
  const tasks = [
    [
      "Define the visual direction",
      "Explore references, typography and the Pearl & Mulberry palette.",
      "pending",
      "high",
    ],
    [
      "Map the customer journey",
      "Outline the key moments from discovery to conversion.",
      "pending",
      "medium",
    ],
    [
      "Design the homepage",
      "Bring the new visual direction into the first screen.",
      "in-progress",
      "high",
    ],
    [
      "Build the component library",
      "Create reusable buttons, inputs and navigation patterns.",
      "in-progress",
      "medium",
    ],
    [
      "Review accessibility",
      "Check contrast, focus states and keyboard navigation.",
      "pending",
      "low",
    ],
    [
      "Audit the current website",
      "Document what works and where we can improve.",
      "completed",
      "medium",
    ],
    [
      "Gather team feedback",
      "Collect ideas and align on the project goals.",
      "completed",
      "low",
    ],
  ];
  for (const [title, description, status, priority] of tasks) {
    const r = await request.post(
      `http://127.0.0.1:5001/api/projects/${projects[0]._id}/tasks`,
      {
        headers,
        data: {
          title,
          description,
          status,
          priority,
          assignee: auth.user._id,
          dueDate: "2026-12-18T12:00:00Z",
        },
      },
    );
    expect(r.ok()).toBeTruthy();
  }
  await mkdir("../docs/screenshots", { recursive: true });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Website redesign", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/01-overview.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto(`/projects/${projects[0]._id}`);
  await expect(
    page.getByRole("heading", { name: "Design the homepage", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/02-project-board.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .locator(".kanban-open")
    .filter({ hasText: "Design the homepage" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/03-task-details.png",
    animations: "disabled",
  });
  await closeDialog(page);
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Personal information" }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/04-profile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/projects/${projects[0]._id}`);
  await expect(
    page.getByRole("heading", { name: "Design the homepage", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../docs/screenshots/05-mobile-board.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.evaluate(() => sessionStorage.clear());
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/06-sign-in.png",
    fullPage: true,
    animations: "disabled",
  });
});
