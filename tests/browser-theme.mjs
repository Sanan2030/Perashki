import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const require = createRequire(new URL('../apps/sloth-ai/package.json', import.meta.url));
const { chromium } = require('playwright');
const { expect: baseExpect } = require('@playwright/test');
const expect = baseExpect.configure({ timeout: 60000 });
const origin = process.env.PERASHKI_TEST_ORIGIN || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /hydration|hydrated|didn't match/i.test(message.text())) errors.push(message.text());
});
const shots = new URL('../.local/screenshots/themes/', import.meta.url);
await mkdir(shots, { recursive: true });
const apps = [['sloth-ai', 'Sloth AI'], ['visio-generator', 'Visio Generator'], ['overtimer', 'Overtimer'], ['level-up', 'Level Up'], ['sprint-pointer', 'SprintPointer'], ['calendar', 'Təqvim']];
try {
  await page.goto(origin);
  await page.evaluate(() => window.PerashkiTheme.set('dark'));
  await expect(page.locator('#workspace-theme')).toHaveAttribute('aria-pressed', 'true');
  for (const [id, name] of apps) {
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    const frame = page.frameLocator(`iframe[title="${name}"]`);
    await expect(frame.locator('html')).toHaveAttribute('data-app', id);
    await expect(frame.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => frame.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(17, 22, 34)');
    if (id === 'sloth-ai') await expect(frame.getByRole('textbox', { name: 'Xam mətn', exact: true })).toBeEnabled();
    if (id === 'visio-generator') await expect(frame.getByRole('button', { name: 'Visio üçün yüklə', exact: true })).toBeEnabled();
    if (id === 'overtimer') await expect(frame.getByRole('button', { name: 'Yeni qeyd', exact: true }).first()).toBeVisible();
    if (id === 'level-up') await expect(frame.locator('main')).toContainText(/business|analysis|Mərhələ/i);
    assert.equal(context.pages().length, 1, 'Tools stay in the workspace');
    await expect(page.getByRole('link', { name: /Ayrıca aç/ })).toHaveCount(0);
    // The same-origin, complete app remains mounted while sections change.
    const native = page.frames().find(item => item !== page.mainFrame() && new URL(item.url()).pathname.startsWith(id === 'calendar' ? '/calendar.html' : `/tools/${id}`));
    assert(native);
    assert.equal(new URL(native.url()).origin, origin);
    await page.locator(`iframe[title="${name}"]`).screenshot({ path: new URL(`${id}-dark.png`, shots).pathname });
  }
  await page.locator('#workspace-theme').click();
  for (const [id, name] of apps) {
    await expect(page.frameLocator(`iframe[title="${name}"]`).locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    const body = page.frameLocator(`iframe[title="${name}"]`).locator('body');
    await expect.poll(() => body.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(250, 251, 249)');
    await page.locator(`iframe[title="${name}"]`).screenshot({ path: new URL(`${id}-light.png`, shots).pathname });
  }
  await page.getByRole('navigation').getByRole('link', { name: 'Overtimer', exact: true }).click();
  await page.frameLocator('iframe[title="Overtimer"]').getByRole('button', { name: 'Tünd rejimə keç', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#workspace-theme')).toHaveAttribute('aria-pressed', 'true');
  for (const [, name] of apps) await expect(page.frameLocator(`iframe[title="${name}"]`).locator('html')).toHaveAttribute('data-theme', 'dark');
  const otherTab = await context.newPage();
  await otherTab.goto(`${origin}/todo`);
  await expect(otherTab.locator('html')).toHaveAttribute('data-theme', 'dark');
  await otherTab.locator('#workspace-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const [, name] of apps) await expect(page.frameLocator(`iframe[title="${name}"]`).locator('html')).toHaveAttribute('data-theme', 'light');
  await otherTab.locator('#workspace-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await otherTab.close();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('perashki:theme:v1')), 'dark');
  await page.goto(`${origin}/todo`);
  await page.getByLabel('Tapşırıq', { exact: true }).fill('Tema dəyişəndə qaralama qalsın');
  await page.locator('#workspace-theme').click();
  await expect(page.getByLabel('Tapşırıq', { exact: true })).toHaveValue('Tema dəyişəndə qaralama qalsın');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: new URL('todo-mobile-light.png', shots).pathname, fullPage: true });
  await page.locator('#workspace-theme').click();
  await page.screenshot({ path: new URL('todo-mobile-dark.png', shots).pathname, fullPage: true });
  const privateContext = await browser.newContext({ colorScheme: 'light' });
  await privateContext.addInitScript(() => {
    for (const method of ['getItem', 'setItem']) Object.defineProperty(Storage.prototype, method, { value() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  const privatePage = await privateContext.newPage();
  await privatePage.goto(origin);
  await privatePage.getByRole('navigation').getByRole('link', { name: 'Təqvim', exact: true }).click();
  await expect(privatePage.frameLocator('iframe[title="Təqvim"]').locator('html')).toHaveAttribute('data-theme', 'light');
  await privatePage.locator('#workspace-theme').click();
  await expect(privatePage.frameLocator('iframe[title="Təqvim"]').locator('html')).toHaveAttribute('data-theme', 'dark');
  await privatePage.getByRole('navigation').getByRole('link', { name: 'Overtimer', exact: true }).click();
  await privatePage.frameLocator('iframe[title="Overtimer"]').getByRole('button', { name: 'Açıq rejimə keç', exact: true }).click();
  await expect(privatePage.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(privatePage.frameLocator('iframe[title="Təqvim"]').locator('html')).toHaveAttribute('data-theme', 'light');
  await privateContext.close();
  assert.deepEqual(errors, []);
  console.log('PASS all native apps share both Overtimer palettes, stay embedded, synchronize theme controls, persist selection and preserve drafts');
} finally { await browser.close(); }
