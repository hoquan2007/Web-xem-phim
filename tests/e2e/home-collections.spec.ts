import { test, expect } from '@playwright/test';

for (const width of [375, 1440]) {
  test(`ranked collections and featured pickers work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/phimhay');
    for (const kind of ['series', 'single']) {
      const rail = page.locator(`#home-ranked-${kind}`);
      const section = page.getByRole('region', { name: `30 Phim ${kind === 'series' ? 'Bộ' : 'Lẻ'} Nổi Bật`, exact: true });
      await expect(rail.locator('li')).toHaveCount(30);
      const links = await rail.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
      expect(new Set(links).size).toBe(30);
      await rail.scrollIntoViewIfNeeded();
      const previous = section.getByRole('button', { name: /^Phim trước/ });
      const next = section.getByRole('button', { name: /^Phim tiếp/ });
      await expect(previous).toBeDisabled();
      await next.click();
      await expect.poll(() => rail.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
      await expect(previous).toBeEnabled();
      await rail.focus();
      await rail.press('End');
      await expect(next).toBeDisabled();
      await rail.press('Home');
      await expect(previous).toBeDisabled();
    }
    for (const kind of ['anime', 'tv']) {
      const feature = page.locator(`#home-featured-${kind}`);
      const choices = feature.getByRole('button', { name: /^Chọn phim / });
      await expect(choices).toHaveCount(8);
      await choices.nth(1).scrollIntoViewIfNeeded();
      const scrollBeforeSelection = await page.evaluate(() => scrollY);
      await choices.nth(1).click();
      expect(Math.abs(await page.evaluate(() => scrollY) - scrollBeforeSelection)).toBeLessThan(2);
      await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true');
      const title = (await choices.nth(1).getAttribute('aria-label'))!.replace('Chọn phim ', '');
      await expect(feature.getByRole('heading', { level: 3 })).toHaveText(title);
      const href = await feature.getByRole('heading', { level: 3 }).getByRole('link').getAttribute('href');
      await expect(feature.locator('.featured-collection-play')).toHaveAttribute('href', href!);
      await expect(feature.locator('.featured-collection-action-group a')).toHaveAttribute('href', href!);
      await expect(feature.locator('video')).toHaveCount(0);
      await choices.nth(1).press('End');
      await expect(choices.last()).toBeFocused();
      await expect(choices.last()).toHaveAttribute('aria-pressed', 'true');
      await choices.last().press('Home');
      await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
      if (width === 375) {
        const panel = feature.locator('.featured-collection-panel');
        await panel.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 280, clientY: 100 });
        await panel.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 80, clientY: 105 });
        await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true');
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('feature bookmark survives reload and storage failure is visible', async ({ page }) => {
  await page.goto('/phimhay');
  const feature = page.locator('#home-featured-tv');
  const save = feature.getByRole('button', { name: /^Lưu phim / });
  await save.click();
  await expect(feature.getByRole('button', { name: /^Bỏ lưu / })).toHaveAttribute('aria-pressed', 'true');
  const href = await feature.getByRole('heading', { level: 3 }).getByRole('link').getAttribute('href');
  const slug = new URL(href!, page.url()).pathname.split('/').pop();
  expect(await page.evaluate(slug => JSON.parse(localStorage.getItem('hnq_bookmarks') || '[]').some((item: { slug: string }) => item.slug === slug), slug)).toBe(true);
  await page.reload();
  await expect(feature.getByRole('button', { name: /^Bỏ lưu / })).toHaveAttribute('aria-pressed', 'true');
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
  await page.reload();
  await feature.getByRole('button', { name: /^Bỏ lưu / }).click();
  await expect(feature.getByRole('alert')).toContainText('Không thể cập nhật tủ phim');
  await expect(feature.getByRole('button', { name: /^Bỏ lưu / })).toHaveAttribute('aria-pressed', 'true');
});

test('view-all links open the actual anime, TV and cinema collections', async ({ page }) => {
  for (const [label, heading, route] of [
    ['Hoạt Hình Anime Hay', 'Phim Hoạt Hình', 'phim-hoat-hinh-anime'],
    ['TV Shows Truyền Hình', 'TV Show Thực Tế', 'tv-shows-chuong-trinh-truyen-hinh'],
    ['Phim Chiếu Rạp Mới', 'Phim Chiếu Rạp', 'phim-chieu-rap-moi'],
  ]) {
    await page.goto('/phimhay');
    await page.getByRole('link', { name: `Xem tất cả ${label}`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/c/${route}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('.catalogue-grid .movie-card').first()).toBeVisible();
  }
});

test('only the selected backdrop is mounted; initial hero does not load collection backdrops', async ({ page }) => {
  const backgrounds = new Set<string>();
  page.on('request', request => {
    const url = new URL(request.url());
    const image = url.searchParams.get('url') || url.pathname;
    if (image.includes('/sites/rophim/collections/')) backgrounds.add(image);
  });
  await page.goto('/phimhay');
  await expect(page.locator('#home-featured-anime')).toBeAttached();
  expect(backgrounds.size).toBe(0);
  const feature = page.locator('#home-featured-anime');
  await feature.scrollIntoViewIfNeeded();
  const image = feature.locator('.featured-collection-art img');
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  const animeRequests = () => [...backgrounds].filter(url => url.includes('/collections/anime-')).length;
  // Native lazy loading may also fetch the selected TV image when it is nearby.
  expect(animeRequests()).toBe(1);
  await feature.getByRole('button', { name: /^Chọn phim / }).nth(1).click();
  await expect(feature.locator('.featured-collection-art img')).toHaveCount(1);
  await expect.poll(animeRequests).toBe(2);
});

test('new sections keep the document inside narrow and wide viewports', async ({ page }) => {
  await page.goto('/phimhay');
  for (const width of [320, 414, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ['home-ranked-series', 'home-ranked-single', 'home-featured-anime', 'home-featured-tv']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id} at ${width}`).toBe(true);
    }
  }
});
