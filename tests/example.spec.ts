import { test, expect } from '@playwright/test';
import { runSteps } from 'passmark';

test('Add product to cart flow - Breaking Apps Hackathon', async ({ page }) => {
  // Increased timeout for first run (AI is slow initially)
  test.setTimeout(120_000);   // 2 minutes

  await runSteps({
    page,
    userFlow: "Add a t-shirt to the shopping cart",
    steps: [
      { description: "Navigate to https://demo.vercel.store" },
      { description: "Click on the first product Acme Circles T-Shirt" },
      { description: "Select color White" },
      { description: "Select size S" },
      { description: "Click the Add to cart button" },
      { description: "Click on My Cart to open it" },
    ],
    assertions: [
      { assertion: "The cart shows Acme Circles T-Shirt" },
    ],
    test,
    expect,
  });
});