import { test, expect } from "@playwright/test";

test("a parsed HLS playlist stays loading until playable media arrives", async ({ page }) => {
  let release!: () => void;
  const pendingSegment = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/mock/media/unavailable", route => route.fulfill({
    contentType: "application/vnd.apple.mpegurl",
    body: "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:10,\nbuffering.ts\n#EXT-X-ENDLIST\n",
  }));
  await page.route("**/api/mock/media/buffering.ts", async route => {
    await pendingSegment;
    await route.abort();
  });
  try {
    const segment = page.waitForRequest("**/api/mock/media/buffering.ts");
    await page.goto("/xem-phim/avengers-endgame?source=kkphim");
    await segment;
    await expect(page.getByText("Đang tải phim…", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tải lại", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Chọn tập", exact: true })).toBeEnabled();
  } finally {
    release();
  }
});

test("duplicate source names stay distinguishable and menu keyboard exits predictably", async ({ page }) => {
  await page.goto("/xem-phim/watch-series?source=kkphim");
  const source = page.getByRole("combobox", { name: /^Nguồn phát/ });
  await source.click();
  const labels = await page.getByRole("option").allTextContents();
  expect(new Set(labels).size).toBe(labels.length);
  await page.getByRole("option", { name: "Vietsub · KKPhim · 2", exact: true }).click();
  await expect(page).toHaveURL(/sv=3&ep=0/);
  const options = page.getByRole("button", { name: "Tùy chọn xem phim", exact: true });
  await options.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Tắt đèn", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: /^Tạo báo cáo sự cố/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitem", { name: "Tắt đèn", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(options).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "Tải lại", exact: true })).toBeFocused();
  await options.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(options).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".watch-summary-copy .rp-detail-action").first()).toBeFocused();
});

test("mobile recommendations expand and a single episode has no redundant counter", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/xem-phim/iframe-only?source=kkphim");
  await expect(page.locator(".watch-episode-position")).toHaveText("Bản đầy đủ");
  const related = page.locator(".watch-related-list");
  await expect(related.locator(".watch-related-item:visible")).toHaveCount(3);
  await related.getByRole("button", { name: "Xem thêm", exact: true }).click();
  await expect(related.locator(".watch-related-item:visible")).toHaveCount(6);
  await related.getByRole("button", { name: "Thu gọn", exact: true }).click();
  await expect(related.locator(".watch-related-item:visible")).toHaveCount(3);
  await expect(page.locator(".watch-info-disclosure")).not.toHaveAttribute("open", "");
});

test("switching source preserves the named episode despite different ordering and keeps URL context", async ({ page }) => {
  await page.goto("/xem-phim/watch-series?source=kkphim&title=Episode%20test&sv=0&ep=79");
  const source = page.getByRole("combobox", { name: /^Nguồn phát/ });
  await expect(source).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Tập 80", exact: true })).toHaveAttribute("aria-pressed", "true");
  await source.click();
  await page.getByRole("option", { name: "Thuyết minh", exact: true }).click();
  await expect(page).toHaveURL(/sv=1&ep=40/);
  expect(new URL(page.url()).searchParams.get("title")).toBe("Episode test");
  expect(new URL(page.url()).searchParams.get("source")).toBe("kkphim");
  await expect(page.getByRole("button", { name: "Tập 80", exact: true })).toHaveAttribute("aria-pressed", "true");
  await source.click();
  await page.getByRole("option", { name: /^Nguồn dự phòng/ }).click();
  await expect(page).toHaveURL(/sv=2&ep=0/);
  await expect(page.getByRole("status").filter({ hasText: "Nguồn này không có tập đang xem" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tập 201", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("long series starts in the current range and selecting filtered episodes saves the correct intent", async ({ page }) => {
  await page.goto("/xem-phim/watch-series?source=kkphim&ep=79");
  await expect(page.getByRole("button", { name: "51–100", exact: true })).toHaveAttribute("aria-pressed", "true");
  const active = page.getByRole("button", { name: "Tập 80", exact: true });
  const list = page.locator(".watch-episode-list");
  const row = (await active.boundingBox())!, box = (await list.boundingBox())!;
  expect(row.y).toBeGreaterThanOrEqual(box.y - 1);
  expect(row.y + row.height).toBeLessThanOrEqual(box.y + box.height + 1);
  await page.getByRole("searchbox", { name: "Tìm tập phim", exact: true }).fill("120");
  await page.getByRole("button", { name: "Tập 120", exact: true }).click();
  await expect(page).toHaveURL(/ep=119/);
  await expect(page.getByRole("button", { name: "Tập tiếp", exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("hnq_watch_history") || "[]")[0]?.active_episode_index)).toBe(119);
});

test("toolbar menus, light-off and playback recovery remain reachable at all target widths", async ({ page }) => {
  test.setTimeout(90000);
  for (const width of [320, 375, 414, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/xem-phim/watch-series?source=kkphim");
    await expect(page.getByRole("button", { name: "Xem Ngay", exact: true })).toHaveCount(0);
    const toolbar = page.getByRole("group", { name: "Điều khiển xem phim", exact: true });
    const frame = (await page.locator(".rp-player-frame").boundingBox())!;
    for (const button of await toolbar.getByRole("button").all()) {
      const rect = (await button.boundingBox())!;
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.x).toBeGreaterThanOrEqual(frame.x - 1);
      expect(rect.x + rect.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
    }
    const options = page.getByRole("button", { name: "Tùy chọn xem phim", exact: true });
    const reload = page.getByRole("button", { name: "Tải lại", exact: true });
    await expect(reload).toBeVisible();
    await page.getByRole("button", { name: "Chọn tập", exact: true }).click();
    await expect(page.getByRole("combobox", { name: /^Nguồn phát/ })).toBeFocused();
    await options.click();
    const lights = page.getByRole("menuitem", { name: "Tắt đèn", exact: true });
    const rect = (await lights.boundingBox())!;
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(width);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.y + rect.height).toBeLessThanOrEqual(900);
    await page.keyboard.press("Escape");
    await expect(options).toBeFocused();
    await options.click();
    await lights.click();
    await expect(page.getByRole("button", { name: "Bật lại đèn", exact: true })).toBeVisible();
    await reload.click();
    await expect(reload).toBeFocused();
    await options.click();
    await page.getByRole("menuitem", { name: "Bật đèn", exact: true }).click();
    await expect(page.getByRole("button", { name: "Bật lại đèn", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (width === 375 || width === 1440) {
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await expect.poll(async () => Math.round((await page.locator("header").boundingBox())!.y)).toBe(0);
      await page.screenshot({ path: `docs/watch-audit-2026-10-17/evidence/implemented-mock-${width}.png`, fullPage: true, animations: "disabled" });
    }
  }
});

test("empty episodes offer a way to reach the episode section without a loading dead end", async ({ page }) => {
  await page.goto("/xem-phim/watch-empty?source=kkphim");
  await expect(page.getByRole("heading", { name: "Chưa có tập phim để phát", exact: true })).toBeVisible();
  await expect(page.getByText("Đang tải phim…", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tập trước", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tập tiếp", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Xem danh sách tập", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Danh sách tập/ })).toBeFocused();
});
