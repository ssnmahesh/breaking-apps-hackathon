import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

/**
 * DevLog — AI Regression Test Suite (v3 — final)
 *
 * Key fixes applied:
 *  1. beforeEach seeds localStorage with exact entry structure before every test
 *     so each test starts with identical, known data (3 entries)
 *  2. Navigation URL directly in description string
 *  3. waitUntil uses text literally visible on screen
 *  4. TC2 assertion updated to match native HTML5 validation behaviour
 *  5. Removed all data: { url: ... } patterns
 */

const APP = "http://localhost:3000/index.html";
const STORAGE_KEY = "devlog_entries";

// Exact structure matching what your app stores in localStorage.
// IDs use timestamps — we use fixed values so assertions are predictable.
const SEED_ENTRIES = [
  {
    id: "1000000000001",
    title: "Added dark mode toggle",
    description: "Created CSS variables system and persisted user preference to localStorage",
    date: "2026-05-07",
    tags: ["React", "CSS"]
  },
  {
    id: "1000000000002",
    title: "Fixed API rate limiting bug",
    description: "Resolved 429 errors by adding exponential backoff and request queuing",
    date: "2026-05-08",
    tags: ["Node.js", "Express"]
  },
  {
    id: "1000000000003",
    title: "Built login page with JWT auth",
    description: "Implemented user authentication using JWT tokens and bcrypt for password hashing",
    date: "2026-05-09",
    tags: ["React", "Node.js"]
  }
];

// ─────────────────────────────────────────────────────────────────
// BEFORE EACH TEST: seed localStorage so every test starts with
// 3 known entries. This replaces manually adding entries in Chrome.
// ─────────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  await page.goto(APP);

  await page.evaluate((data) => {
    localStorage.setItem("devlog_entries", JSON.stringify(data));
  }, SEED_ENTRIES);

  await page.reload();
  await page.waitForTimeout(1500);
});

// ─────────────────────────────────────────────────────────────────
// TEST 1 — Stats panel accuracy
// Short test, minimal API calls — run this first to verify seeding
// ─────────────────────────────────────────────────────────────────
test("stats: total entries, streak and top tag show correct values", async ({ page }) => {
  test.setTimeout(120_000);

  await runSteps({
    page,
    userFlow: "Check the stats panel shows accurate numbers for the seeded entries",
    steps: [
      { description: "Look at the three stat boxes at the top of the page" },
    ],
    assertions: [
      { assertion: "The Total Entries stat box shows the number 3" },
      { assertion: "The Day Streak stat box shows 3 — entries exist on three consecutive days May 7, 8, and 9" },
      { assertion: "The Most Used Tag stat box shows React — React appears on 2 of the 3 entries" },
    ],
    test,
    expect,
  });
});


// ─────────────────────────────────────────────────────────────────
// TEST 2 — Add a new log entry (happy path)
// ─────────────────────────────────────────────────────────────────
test("add entry: new entry appears in feed with correct details", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Add a new developer log entry to DevLog",
    steps: [
      {
        description: "Click the Title input field and type the entry title",
        data: { value: "Deployed app to Vercel with CI pipeline" }
      },
      {
        description: "Click the Description textarea and type a description",
        data: { value: "Set up GitHub Actions workflow to auto-deploy on merge to main" }
      },
      {
        description: "Click the Tags input field and type the tags",
        data: { value: "Vercel, GitHub Actions, DevOps" }
      },
      {
        description: "Click the Save Entry button"
      },
    ],
    assertions: [
      { assertion: "An entry titled 'Deployed app to Vercel with CI pipeline' is visible in the Recent Entries section" },
      { assertion: "The entry shows Vercel, GitHub Actions, and DevOps as tag badges" },
      { assertion: "The Title input field is now empty after saving" },
      { assertion: "The Total Entries stat shows 4" },
    ],
    test,
    expect,
  });
});


// ─────────────────────────────────────────────────────────────────
// TEST 3 — Validation: empty title shows error
// NOTE: Claude used native HTML5 required attribute instead of a
// custom error message. This test documents that finding.
// ─────────────────────────────────────────────────────────────────
test("validation: submitting with empty title shows validation message", async ({ page }) => {
  test.setTimeout(120_000);

  await runSteps({
    page,
    userFlow: "Try to save a DevLog entry without filling in the Title field",
    steps: [
      { description: "Click the Save Entry button without typing anything in the Title field" },
    ],
    assertions: [
      {
        // Native HTML5 validation fires — browser shows "Please fill out this field"
        // Claude built validation using the required attribute, not a custom error message
        assertion: "A browser validation tooltip or message appears on the Title field saying it is required"
      },
      { assertion: "No new entry has been added to the feed — the entry count has not increased above 3" },
    ],
    test,
    expect,
  });
});


// ─────────────────────────────────────────────────────────────────
// TEST 4 — Filter entries by tag
// ─────────────────────────────────────────────────────────────────
test("filter: clicking React tag shows only React entries", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Filter the DevLog feed by clicking the React tag badge on an entry",
    steps: [
      {
        description: "Click the React tag badge on any entry in the feed",
        waitUntil: "Filtering by"
      },
    ],
    assertions: [
      { assertion: "A filter indicator showing React is visible near the top of the feed" },
      { assertion: "The entry 'Fixed API rate limiting bug' which only has Node.js and Express tags is NOT visible" },
      { assertion: "The entry 'Built login page with JWT auth' which has the React tag IS visible" },
      { assertion: "The entry 'Added dark mode toggle' which has the React tag IS visible" },
    ],
    test,
    expect,
  });
});


// ─────────────────────────────────────────────────────────────────
// TEST 5 — Clear filter restores all entries
// ─────────────────────────────────────────────────────────────────
test("filter: clearing the filter restores all 3 entries", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Apply a tag filter then clear it to restore the full feed",
  steps: [
  {
    description: "Click the React tag badge on any entry to apply the filter",
    waitUntil: "React"
  },
  {
    description: "Click the X button or clear button next to the active filter to clear it",
    waitUntil: "Fixed API rate limiting bug"
  },
  ],
    assertions: [
      { assertion: "The filter indicator is no longer visible — the active filter has been cleared" },
      { assertion: "All 3 entries are visible: Added dark mode toggle, Fixed API rate limiting bug, and Built login page with JWT auth" },
    ],
    test,
    expect,
  });
});


// ─────────────────────────────────────────────────────────────────
// TEST 6 — Edit an existing entry
// THE LAST ASSERTION IS INTENTIONALLY DESIGNED TO FAIL.
// This exposes a real bug: Claude never changes the form heading
// from "Add New Entry" to "Edit Entry" during edit mode.
// This is the bug your article will highlight.
// ─────────────────────────────────────────────────────────────────
test("edit: clicking Edit loads entry into form and saves changes", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Edit the Added dark mode toggle entry to update its description",
    steps: [
      {
        description: "Click the blue Edit button on the entry titled 'Added dark mode toggle'",
        waitUntil: "Update Entry"
      },
    ],
    assertions: [
      {
        assertion: "The form heading reads 'Edit Entry' indicating edit mode is active"
      },
      {
        assertion: "The save button reads 'Update Entry' not 'Save Entry'"
      },
      {
        assertion: "The Title field is pre-filled with 'Added dark mode toggle'"
      },
    ],
    test,
    expect,
  });
});

test("edit: saving changes updates entry without duplication", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Edit an entry and save the changes",
    steps: [
      {
        description: "Click the blue Edit button on the entry titled 'Added dark mode toggle'",
        waitUntil: "Update Entry"
      },
      {
        description: "Clear the Description field and type a new description",
        data: { value: "Implemented CSS custom properties for theming and saved preference to localStorage" }
      },
      {
        description: "Click the Update Entry button to save"
      },
    ],
    assertions: [
      { assertion: "The entry 'Added dark mode toggle' shows the updated description" },
      { assertion: "There is only one entry titled 'Added dark mode toggle' — no duplication" },
      { assertion: "The Total Entries count remains 3" },
    ],
    test,
    expect,
  });
});

// ─────────────────────────────────────────────────────────────────
// TEST 7 — Delete: cancel keeps the entry
// ─────────────────────────────────────────────────────────────────
test("delete: cancelling the confirmation keeps entry intact", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Click delete on an entry but cancel the confirmation dialog",
    steps: [
      {
        description: "Click the red Delete button on the entry titled 'Fixed API rate limiting bug'",
        waitUntil: "Delete"
      },
      {
        description: "Click the Cancel button in the confirmation dialog"
      },
    ],
    assertions: [
      { assertion: "The confirmation modal is no longer visible" },
      { assertion: "The entry 'Fixed API rate limiting bug' is still present in the feed" },
      { assertion: "The total entry count in the stats panel has not changed from 3" },
    ],
    test,
    expect,
  });
});


// ─────────────────────────────────────────────────────────────────
// TEST 8 — Delete: confirming removes the entry permanently
// ─────────────────────────────────────────────────────────────────
test("delete: confirming deletion removes entry from feed", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Delete an entry by confirming the delete dialog",
    steps: [
      {
        description: "Click the red Delete button on the entry titled 'Fixed API rate limiting bug'",
        waitUntil: "Are you sure"
      },
      {
        description: "Click the red Delete or Confirm button inside the confirmation dialog",
        waitUntil: "Built login page with JWT auth"
      },
    ],
    assertions: [
      { assertion: "The entry 'Fixed API rate limiting bug' is no longer visible in the feed" },
      { assertion: "The entries 'Built login page with JWT auth' and 'Added dark mode toggle' are still visible" },
      { assertion: "The Total Entries stat now shows 2" },
    ],
    test,
    expect,
  });
});


// ─────────────────────────────────────────────────────────────────
// TEST 9 — Clear Form then save (verifies the original date bug fix)
// This is the test that PASSED before — proving the date bug is fixed
// ─────────────────────────────────────────────────────────────────
test("form: Clear Form button allows a new entry to be saved afterwards", async ({ page }) => {
  test.setTimeout(150_000);

  await runSteps({
    page,
    userFlow: "Fill in the DevLog form, clear it, then successfully save a new entry",
    steps: [
      {
        description: "Click the Title field and type a title",
        data: { value: "This entry will be cleared" }
      },
      {
        description: "Click the Clear Form button",
        waitUntil: "Add New Entry"
      },
      {
        description: "Click the Title field and type a new title",
        data: { value: "Entry saved after form was cleared" }
      },
      {
        description: "Click the Save Entry button"
      },
    ],
    assertions: [
      { assertion: "The entry 'Entry saved after form was cleared' is visible in the Recent Entries feed" },
      { assertion: "There is no entry titled 'This entry will be cleared' in the feed" },
      { assertion: "The form fields are empty and ready for another entry" },
    ],
    test,
    expect,
  });
});

// ─────────────────────────────────────────────────────────────────
// TEST 10 — Streak bug exposure
// Seeds entries with a GAP (May 6 and May 9, skipping May 7 & 8).
// A broken streak should show 0. Claude's code returns 1 instead.
// This is the off-by-one bug in the streak calculation logic.
// EXPECTED: This assertion WILL FAIL — intentional bug exposure.
// ─────────────────────────────────────────────────────────────────
test("streak: broken streak shows 0 not 1 (streak logic bug)", async ({ page }) => {
  test.setTimeout(120_000);

  // Override the beforeEach seed with broken-streak data
  // Entries on May 6 and May 9 — a 2-day gap means streak is broken
  await page.evaluate(() => {
    const brokenStreakEntries = [
      {
        id: "2000000000001",
        title: "Entry from four days ago",
        description: "This entry is from May 6 — four days before May 9",
        date: "2026-05-06",
        tags: ["React"]
      },
      {
        id: "2000000000002",
        title: "Entry from today",
        description: "This entry is from May 9 — there is a gap of 3 days",
        date: "2026-05-09",
        tags: ["Node.js"]
      }
    ];
    localStorage.setItem("devlog_entries", JSON.stringify(brokenStreakEntries));
  });

  // Reload so the app reads the broken-streak data
  await page.reload();
  await page.waitForTimeout(1500);

  await runSteps({
    page,
    userFlow: "Check that a broken day streak correctly shows 0 in the stats panel",
    steps: [
      { description: "Look at the Day Streak stat box at the top of the page" },
    ],
    assertions: [
      {
        // THIS ASSERTION WILL FAIL — intentional bug exposure
        // The entries span May 6 and May 9 with a 3-day gap.
        // A broken streak should display 0.
        // Claude's streak logic returns 1 instead of 0 for broken streaks.
        assertion: "The Day Streak stat box shows 0 — the entries on May 6 and May 9 have a gap so the streak is broken and should not count"
      },
    ],
    test,
    expect,
  });
});