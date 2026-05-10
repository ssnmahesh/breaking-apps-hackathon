# AI Regression Testing with Passmark — Breaking Things Hackathon

> **I vibe-coded a dev tracker with Claude, then used Passmark to break it.**  
> One AI wrote the app. A different AI tested it. The tester found bugs the builder never knew it made.  
> Then I fixed them — and the tester confirmed the fixes.

📖 **Read the full article:** [Hashnode — I Vibe-Coded a Dev Tracker with Claude, Then Used Passmark to Break It](https://corelogic.hashnode.dev/i-vibe-coded-a-dev-tracker-with-claude-then-used-passmark-to-break-it-here-s-every-assumption-that-failed)

---

## The Complete Loop

```
Claude Code → Builds App → Passmark Tests → Bugs Found → Claude Fixes → Passmark Verifies
```

| Step | Tool | What happened |
|------|------|---------------|
| Build | Claude Code | 200-word prompt → complete `index.html` in 45 seconds |
| Test | Passmark 1.0.13 | 11 plain-English tests across 5 user flows |
| Break | Passmark AI | 2 real bugs found, each with a verbatim AI-written bug report |
| Fix | Claude Code | Bug report pasted directly as fix prompt — 3 lines changed |
| Verify | Passmark | Fix confirmed — failing test turned green in 1.7 minutes |

---

## The App — DevLog

**DevLog** is a personal developer activity tracker built entirely with Claude Code in one VS Code session.

- Log what you built each day with title, description, date, and tags
- Filter entries by technology tag
- Edit and delete entries with confirmation
- Stats panel showing total entries, day streak, and most-used tag
- Runs as a single `index.html` — no backend, no build step, no dependencies
- Data stored in `localStorage`

**Try it:** Serve `index.html` with any static file server:

```bash
npx http-server . -p 3000
# then open http://localhost:3000/index.html
```

---

## The Test Suite — 11 Tests, 5 User Flows

Written with [Passmark](https://github.com/bug0inc/passmark) — plain English instead of CSS selectors. The AI reads screenshots of the page and evaluates each step and assertion like a human would.

| # | Test | Result | Finding |
|---|------|--------|---------|
| TC1 | stats: total entries, streak, top tag | ✅ PASS | Stats panel accurate |
| TC2 | add entry: appears in feed with correct details | ✅ PASS | Happy path confirmed |
| TC3 | validation: empty title shows validation message | ✅ PASS | Revealed: native HTML5 validation, not custom error |
| TC4 | filter: React tag shows only React entries | ✅ PASS | Filter logic correct |
| TC5 | filter: clearing filter restores all 3 entries | ✅ PASS | State management correct |
| TC6 | edit: Edit mode shows correct heading and button | ✅ PASS | **After fix** — heading now reads "Edit Entry" |
| TC7 | edit: saving changes updates without duplication | ✅ PASS | Edit saves correctly, no duplicate entries |
| TC8 | delete: cancel keeps entry intact | ✅ PASS | Defensive UI confirmed |
| TC9 | delete: confirming removes entry from feed | ✅ PASS | Destructive action works |
| TC10 | form: Clear Form allows new entry to be saved | ✅ PASS | **Bug 0 fix proven** — date reset works correctly |
| TC11 | streak: broken streak shows 0 not 1 | ❌ FAIL | **Bug 2 — intentional** — off-by-one in streak logic |

**Final results:** 9 passed · 1 intentional failure (streak bug) · 1 rate limit casualty in full suite (passes in isolation) · Total runtime: 7.9 minutes

---

## Bugs Found by Passmark

### Bug 1 — Edit Mode Heading (Found and Fixed)

Passmark's AI wrote this verbatim when it evaluated the assertion:

> *"The current state of the application is in 'Add' mode, not 'Edit' mode. The heading explicitly reads 'Add New Entry' in both the screenshot and the accessibility snapshot. Since the assertion implies that the heading should change when editing is active, and the current view shows the default 'Add New Entry' state, the condition is not met."*

**The fix:** That AI Summary was pasted directly into Claude Code as the bug report. 3 lines changed in `index.html`. Passmark confirmed the fix in 1.7 minutes.

### Bug 2 — Streak Off-by-One (Found, Left Unfixed Intentionally)

> *"The assertion states that the Day Streak stat box shows 0, but both the screenshot and the accessibility snapshot clearly show that the Day Streak is currently 1."*

Entries seeded on May 6 and May 9 — a 3-day gap. A broken streak should show 0. Claude's code returns 1. Left unfixed deliberately as evidence that plain-English AI assertions catch business logic errors that structural tests cannot.

### Bug 0 — Date Reset (Found Manually, Fixed Before Testing)

The `readonly` date field was cleared by `form.reset()` and could not be repopulated programmatically — saves silently failed after clicking Clear Form. Changed to `type="date"`, removed two brittle conversion functions. TC10 passes in every run as proof.

---

## Project Structure

```
breaking-apps-hackathon/
├── index.html                  ← The DevLog app (built by Claude Code)
├── tests/
│   └── devlog.spec.ts          ← All 11 Passmark tests
├── playwright.config.ts        ← Passmark + Playwright configuration
├── package.json
├── .env                        ← Your OpenRouter API key (not committed)
├── .gitignore                  ← .env excluded
└── README.md
```

---

## Setup & Running

### Prerequisites

- Node.js 18+ 
- An OpenRouter API key (free — [register here](https://openrouter.ai))

### Installation

```bash
# Clone the repo
git clone https://github.com/ssnmahesh/breaking-apps-hackathon.git
cd breaking-apps-hackathon

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Configure API key

Create a `.env` file in the project root:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Serve the app

Open **Terminal 1** and keep it running:

```bash
npm run serve
# App available at http://localhost:3000/index.html
```

### Run the tests

Open **Terminal 2** and run:

```bash
# Run the full suite
npx playwright test tests/devlog.spec.ts --project chromium

# Run a single test (saves API credits while debugging)
npx playwright test tests/devlog.spec.ts --project chromium -g "stats"

# View the HTML report
npx playwright show-report
```

---

## Key Patterns Learned

### 1. Seed localStorage before every test

Playwright gives each test a fresh browser with empty localStorage. Use `beforeEach` to inject seed data matching your app's exact JSON structure:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto(APP);
  await page.evaluate((data) => {
    localStorage.setItem("devlog_entries", JSON.stringify(data));
  }, SEED_ENTRIES);
  await page.reload();
  await page.waitForTimeout(1500);
});
```

> ⚠️ The seed data structure must match exactly — check Chrome DevTools → Application → Local Storage for the real field types before writing your seed.

### 2. Navigate in the description string

```typescript
// ✅ Correct — Passmark navigates the browser
{ description: "Navigate to http://localhost:3000/index.html" }

// ❌ Wrong — Passmark tries to type the URL into a field
{ description: "Go to the app", data: { url: "http://..." } }
```

### 3. waitUntil must match text literally visible on screen

```typescript
// ✅ Correct — text that actually appears on screen
waitUntil: "Filtering by"

// ❌ Wrong — describes what should happen, not what's visible
waitUntil: "The filter has been applied and the feed has updated"
```

### 4. One test per behaviour

Don't check UI state and verify a side effect in the same test. The UI state may have already changed by the time assertions run. Split them — TC6 checks edit mode UI, TC7 verifies the save result.

### 5. Rate limit vs real failure

| Error message | Meaning | Action |
|---|---|---|
| `Provider returned error` on step 1 | Rate limit — app untouched | Wait 3 min, retry |
| `Test timeout` with correct page snapshot | Rate limit during `waitUntil` | Run in isolation |
| `Assertion failed` with AI Summary describing screen | **Real bug** | Fix the app |

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Passmark](https://github.com/bug0inc/passmark) | 1.0.13 | AI testing framework |
| [Playwright](https://playwright.dev) | 1.59.1 | Browser automation |
| [OpenRouter](https://openrouter.ai) | — | AI gateway (Gemini Flash) |
| TypeScript | — | Test language |
| Vanilla JS + localStorage | — | App runtime (no framework) |

---

## Submission

**Hackathon:** [Breaking Things Hackathon](https://hashnode.com/tag/breakingappshackathon) by Bug0 & Hashnode  
**Article:** [Read on Hashnode](https://corelogic.hashnode.dev/i-vibe-coded-a-dev-tracker-with-claude-then-used-passmark-to-break-it-here-s-every-assumption-that-failed)  
**Passmark repo:** [bug0inc/passmark](https://github.com/bug0inc/passmark)  

---

## License

MIT
