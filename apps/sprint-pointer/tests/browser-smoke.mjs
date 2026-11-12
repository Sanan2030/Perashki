import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const portProbe = net.createServer().listen(0, '127.0.0.1');
await once(portProbe, 'listening');
const port = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], {
  env: { ...process.env, PORT: String(port), OPENAI_API_KEY: '' },
  stdio: ['ignore', 'ignore', 'inherit'],
});
const stopped = once(server, 'exit');
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    const response = await fetch(base + '/api/health').catch(() => null);
    if (response?.ok) {
      ready = true;
      break;
    }
    await delay(125);
  }
  assert.ok(ready, 'Production server did not become ready');
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(base);
  const navigation = name => page.getByRole('navigation').getByRole('button', { name });
  const result = page.getByRole('region', { name: 'Qiymətləndirmə nəticəsi' });
  await result.getByText('İlk qiymətləndirmənizi hazırlayın').waitFor();
  if (process.env.SMOKE_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.SMOKE_SCREENSHOTS}/desktop.png`, fullPage: true });
  }

  const title = 'Müştərilər siyahısına axtarış filtri əlavə et';
  const submit = page.getByRole('button', { name: 'İşi qiymətləndir' });
  await page.getByLabel('Tapşırığın başlığı').fill(title);
  await page.getByLabel('İşin əhatəsi').selectOption('frontend');
  await submit.click();
  await result.getByText('Yerli təxmin', { exact: true }).waitFor();
  await result.getByText('6 saat × 0.1 = 0.6', { exact: true }).waitFor();

  const pointButton = page.getByRole('button', { name: 'Story Point-i kopyala' });
  const readClipboard = () => page.evaluate(() => navigator.clipboard.readText());
  await pointButton.click();
  await page.getByText('Kopyalandı.', { exact: true }).waitFor();
  assert.equal(await readClipboard(), '0.6');

  const edited = 'Redaktə edilmiş iş izahı.';
  await page.getByLabel('İşin izahı').fill(edited);
  await page.getByLabel(/Qəbul meyarları/).fill('Yeni meyar\nİkinci meyar');
  const copied = await page.evaluate(() => {
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    window.lastClipboardWrite = null;
    navigator.clipboard.writeText = async value => {
      await original(value);
      window.lastClipboardWrite = value;
    };
    return typeof navigator.clipboard.writeText;
  });
  assert.equal(copied, 'function');
  await page.getByRole('button', { name: 'İzahı və meyarları kopyala' }).click();
  await page.waitForFunction(() => window.lastClipboardWrite?.includes('Yeni meyar'));
  assert.match(await readClipboard(), /Redaktə edilmiş iş izahı\.[\s\S]*• Yeni meyar/);
  await page.getByRole('button', { name: 'Bütün nəticəni kopyala' }).click();
  await page.waitForFunction(() => window.lastClipboardWrite?.includes('Story Point — 0.6'));
  assert.match(await readClipboard(), /Story Point — 0\.6[\s\S]*Mənbə — Yerli təxmin/);

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
  await pointButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  const copyField = dialog.getByRole('textbox', { name: 'Kopyalanacaq mətn' });
  assert.equal(await copyField.inputValue(), '0.6');
  assert.deepEqual(await copyField.evaluate(node => [node.selectionStart, node.selectionEnd]), [0, 3]);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });

  await page.getByLabel('Tapşırığın başlığı').fill('Satış dashboard səhifəsi');
  await result.getByText(/Forma dəyişib/).waitFor();
  await page.reload();
  await navigation('Tarixçə').click();
  await page.getByRole('button', { name: new RegExp(title) }).click();
  assert.equal(await page.getByLabel('Tapşırığın başlığı').inputValue(), title);
  assert.equal(await page.getByLabel('İşin əhatəsi').inputValue(), 'frontend');
  assert.equal(await page.getByLabel('İşin izahı').inputValue(), edited);
  assert.equal(await page.getByLabel(/Qəbul meyarları/).inputValue(), 'Yeni meyar\nİkinci meyar');

  let requests = 0;
  const endpoint = '**/api/estimate';
  await page.route(endpoint, route => {
    requests++;
    return requests === 1
      ? route.fulfill({ status: 502, json: { error: 'Qiymətləndirmə xidməti əlçatan deyil.' } })
      : route.continue();
  });
  await submit.click();
  await page.getByRole('alert').getByText('Qiymətləndirmə xidməti əlçatan deyil.').waitFor();
  await submit.click();
  await page.getByRole('alert').waitFor({ state: 'hidden' });
  await result.getByText('Yerli təxmin', { exact: true }).waitFor();
  assert.equal(requests, 2);
  await page.unroute(endpoint);

  const assertNoOverflow = async () => assert.ok(await page.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  ), `Horizontal overflow at ${page.viewportSize().width}px`);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await assertNoOverflow();
    const formBox = await page.getByRole('region', { name: 'Tapşırıq məlumatları' }).boundingBox();
    const resultBox = await result.boundingBox();
    if (width <= 390) assert.ok(resultBox.y >= formBox.y + formBox.height);
    if (width >= 1024) assert.ok(resultBox.x >= formBox.x + formBox.width);
    if (width === 390 && process.env.SMOKE_SCREENSHOTS) {
      await page.screenshot({ path: `${process.env.SMOKE_SCREENSHOTS}/mobile-result.png`, fullPage: true });
    }
    await navigation('Tarixçə').click();
    await assertNoOverflow();
    await navigation('Necə işləyir?').click();
    await page.getByRole('table').waitFor();
    await assertNoOverflow();
    await navigation('Qiymətləndirici').click();
  }

  await navigation('Tarixçə').click();
  page.once('dialog', prompt => prompt.dismiss());
  await page.getByRole('button', { name: 'Tarixçəni təmizlə' }).click();
  assert.equal(await page.getByRole('button', { name: new RegExp(title) }).count(), 2);
  page.once('dialog', prompt => prompt.accept());
  await page.getByRole('button', { name: 'Tarixçəni təmizlə' }).click();
  await page.getByText('Qiymətləndirmə tarixçəsi boşdur.').waitFor();

  await navigation('Qiymətləndirici').click();
  await page.getByRole('button', { name: 'Yeni iş' }).click();
  assert.equal(await page.getByLabel('Tapşırığın başlığı').inputValue(), '');
  await result.getByText('İlk qiymətləndirmənizi hazırlayın').waitFor();
  await page.getByRole('button', { name: 'Form validasiyası', exact: true }).click();
  assert.match(await page.getByLabel('Tapşırığın başlığı').inputValue(), /validasiya/);
  await page.evaluate(() => localStorage.setItem('sprintpointer.history.v1', '[{"broken":true}]'));
  await page.reload();
  await navigation('Tarixçə').click();
  await page.getByText('Qiymətləndirmə tarixçəsi boşdur.').waitFor();
  assert.deepEqual(pageErrors, []);
  console.log('Browser smoke passed: estimate, clipboard, editing, history, retry, and responsive widths 320–1440px.');
} finally {
  await browser?.close();
  server.kill();
  await stopped;
}
