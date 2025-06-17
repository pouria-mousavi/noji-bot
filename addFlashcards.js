const { chromium } = require("playwright");
const fs = require("fs");

async function loginIfNeeded(page) {
  console.log("🧪 Checking login state...");
  await page.goto("https://noji.io/decks", { waitUntil: "load" });

  const currentUrl = page.url();
  console.log("🌐 URL after visiting /decks:", currentUrl);

  // If we got redirected back to home, we're NOT logged in
  if (currentUrl === "https://noji.io/") {
    console.log("🔐 Not logged in — starting login flow...");

    await page.goto("https://noji.io/get-started", { waitUntil: "load" });
    await page.fill('input[type="email"]', process.env.NOJI_EMAIL);
    await page.fill('input[type="password"]', process.env.NOJI_PASSWORD);
    await page.locator('div.css-146c3p1.r-dnmrzs:has-text("Sign in")').click();

    await page.waitForTimeout(5000); // Give login time to process
    const afterLoginUrl = page.url();
    console.log("🔁 After login, URL is:", afterLoginUrl);

    if (afterLoginUrl === "https://noji.io/") {
      throw new Error("❌ Login failed — still on homepage after login.");
    }

    return false; // we had to log in
  }

  console.log("✅ Already logged in");
  return true;
}

async function addFlashcard({ question, answer }) {
  const browser = await chromium.launch({ headless: true }); // set to true after debugging

  const storagePath = "storageState.json";
  const useStorage =
    fs.existsSync(storagePath) && fs.statSync(storagePath).size > 50;

  const context = useStorage
    ? await browser.newContext({ storageState: storagePath })
    : await browser.newContext();

  const page = await context.newPage();
  const wasAlreadyLoggedIn = await loginIfNeeded(page);

  // Save session only if it just logged in successfully
  if (!wasAlreadyLoggedIn) {
    await context.storageState({ path: storagePath });
    console.log("✅ Session saved to storageState.json");
  }

  console.log("✅ Logged in — waiting for deck");
  console.log("🧭 Current page URL:", page.url());

  // If you're not auto-redirected into the deck, click it manually
  if (
    page.url() === "https://noji.io/" ||
    page.url() === "https://noji.io/decks"
  ) {
    const deck = page.getByText("Advanced English Vocabulary", {
      exact: false,
    });
    await deck.waitFor({ timeout: 30000 });
    await deck.click();
    await page.waitForURL("**/deck/**");
  }

  // Click Add Card
  await page.getByText("Add cards", { exact: true }).click();
  await page.waitForURL("**/add-note");

  // Fill in front side (meaning)
  await page.locator('[contenteditable="true"]').nth(0).click();
  await page.keyboard.type(answer);

  // Fill in back side (word)
  await page.locator('[contenteditable="true"]').nth(1).click();
  await page.keyboard.type(question);

  // Submit with Cmd+Enter
  await page.keyboard.press("Meta+Enter");
  await page.waitForTimeout(1000);

  console.log("✅ Flashcard added!");
  await browser.close();
}

module.exports = { addFlashcard };
