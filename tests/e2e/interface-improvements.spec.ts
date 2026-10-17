import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fixtureMovie } from "../../src/lib/__fixtures__/provider-fixtures";

const result = (name: string, slug: string) => ({ ...fixtureMovie({ name, slug }), source: "kkphim" });

test("search aligns both edges, keeps focus after clear, and opens the keyboard-selected movie", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/search?**", (route) => route.fulfill({ json: { status: true, items: [result("Tên phim rất dài để kiểm tra bố cục tìm kiếm PTQ", "avengers-endgame"), result("Phim thứ hai", "iframe-only")] } }));
  await page.goto("/danh-sach");
  const input = page.getByRole("combobox", { name: "Tìm kiếm phim", exact: true });
  await input.fill("conan");
  await expect(page.getByRole("option", { name: /Tên phim rất dài/ })).toBeVisible();
  const field = (await input.boundingBox())!, popup = (await page.locator(".search-suggestions").boundingBox())!;
  expect(Math.abs(field.x - popup.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(field.width - popup.width)).toBeLessThanOrEqual(1);
  const outline = await input.evaluate((node) => ({ color: getComputedStyle(node).outlineColor, offset: getComputedStyle(node).outlineOffset }));
  expect(outline.color).toBe("rgb(154, 168, 189)");
  expect(outline.offset).toBe("-2px");
  await page.getByRole("button", { name: "Xóa từ khóa" }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await input.fill("conan");
  await expect(page.getByRole("option")).toHaveCount(2);
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await expect(page.getByRole("option", { name: /Phim thứ hai/ })).toHaveAttribute("aria-selected", "true");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/phim\/iframe-only\?source=kkphim/);
});

test("mobile search focuses the input, shows the same suggestions, and restores its trigger", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/search?**", (route) => route.fulfill({ json: { status: true, items: [result("Phim gợi ý trên điện thoại", "iframe-only")] } }));
  await page.goto("/danh-sach");
  const trigger = page.getByRole("button", { name: "Mở tìm kiếm", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Tìm phim", exact: true });
  const input = dialog.getByRole("combobox", { name: "Tìm kiếm phim", exact: true });
  await expect(input).toBeFocused();
  await input.fill("phim");
  await expect(dialog.getByRole("option", { name: /Phim gợi ý trên điện thoại/ })).toBeVisible();
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await expect(dialog).toBeVisible();
  await input.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("keyboard selection scrolls the search results and filter options inside their own lists", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.route("**/api/search?**", (route) => route.fulfill({ json: { status: true, items: Array.from({ length: 6 }, (_, index) => result(`Phim gợi ý ${index + 1}`, `movie-${index}`)) } }));
  await page.goto("/danh-sach");
  const input = page.getByRole("combobox", { name: "Tìm kiếm phim", exact: true });
  await input.fill("phim");
  await expect(page.getByRole("option")).toHaveCount(6);
  await input.press("ArrowUp");
  const option = page.getByRole("option", { name: /^Phim gợi ý 6/ });
  await expect(option).toHaveAttribute("aria-selected", "true");
  const row = (await option.boundingBox())!, body = (await page.locator(".search-result-list").boundingBox())!;
  expect(row.y).toBeGreaterThanOrEqual(body.y - 1);
  expect(row.y + row.height).toBeLessThanOrEqual(body.y + body.height + 1);
  await input.press("Escape");
  await page.getByRole("button", { name: /^Bộ lọc/ }).click();
  await page.getByRole("combobox", { name: /^Năm phát hành/ }).click();
  const year = page.getByRole("combobox", { name: "Tìm năm phát hành", exact: true });
  for (let index = 0; index < 9; index++) await year.press("ArrowDown");
  const active = page.locator('.filter-select-option[data-active="true"]');
  const choice = (await active.boundingBox())!, options = (await page.locator(".filter-select-options").boundingBox())!;
  expect(choice.y).toBeGreaterThanOrEqual(options.y - 1);
  expect(choice.y + choice.height).toBeLessThanOrEqual(options.y + options.height + 1);
});

test("search handles errors, retries, and never lets an old query replace the new one", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/search?**", async (route) => {
    const keyword = new URL(route.request().url()).searchParams.get("keyword");
    if (keyword === "error" && ++attempts === 1) { await route.fulfill({ status: 503, json: { items: [] } }); return; }
    if (keyword === "old") await new Promise((resolve) => setTimeout(resolve, 650));
    await route.fulfill({ json: { status: true, items: keyword === "empty" ? [] : [result(`Kết quả ${keyword}`, "iframe-only")] } });
  });
  await page.goto("/danh-sach");
  const input = page.getByRole("combobox", { name: "Tìm kiếm phim", exact: true });
  await input.fill("error");
  await expect(page.getByText("Chưa tải được gợi ý.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByRole("option", { name: /Kết quả error/ })).toBeVisible();
  await input.fill("empty");
  await expect(page.getByText(/Không tìm thấy phim phù hợp/)).toBeVisible();
  const oldRequest = page.waitForRequest("**/api/search?keyword=old&limit=6");
  await input.fill("old");
  await oldRequest;
  await input.fill("new");
  await expect(page.getByRole("option", { name: /Kết quả new/ })).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(page.getByRole("option")).toContainText("Kết quả new");
});

test("filter popup keyboard, draft reset/cancel, pending feedback, applied chips and history work together", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/danh-sach");
  const trigger = page.getByRole("button", { name: /^Bộ lọc/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Bộ lọc phim", exact: true });
  const type = dialog.getByRole("combobox", { name: /^Loại phim/ });
  await type.click();
  const choices = dialog.getByRole("listbox", { name: "Loại phim", exact: true });
  await choices.press("ArrowDown");
  await choices.press("ArrowDown");
  await choices.press("Enter");
  await expect(type).toContainText("Phim bộ");
  await expect(type).toBeFocused();
  await dialog.getByRole("combobox", { name: /^Quốc gia/ }).click();
  const countrySearch = dialog.getByRole("combobox", { name: "Tìm quốc gia", exact: true });
  await countrySearch.fill("han quoc");
  await countrySearch.press("Enter");
  expect(new URL(page.url()).search).toBe("");
  await dialog.getByRole("button", { name: "Đặt lại", exact: true }).click();
  await expect(type).toContainText("Tất cả loại");
  await type.click();
  await dialog.getByRole("option", { name: "Phim bộ", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(new URL(page.url()).search).toBe("");
  await trigger.click();
  await expect(type).toContainText("Tất cả loại");
  await type.click();
  await dialog.getByRole("option", { name: "Phim bộ", exact: true }).click();
  await page.route("**/danh-sach?**", async (route) => { await new Promise((resolve) => setTimeout(resolve, 900)); await route.continue(); });
  await dialog.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.getByText("Đang cập nhật danh sách phim…", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/type=series/);
  await expect(page.getByRole("button", { name: "Bỏ lọc loại phim", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Bỏ lọc loại phim", exact: true }).click();
  await expect(page).toHaveURL(/\/danh-sach$/);
  await page.goBack();
  await expect(page.getByRole("button", { name: "Bỏ lọc loại phim", exact: true })).toBeVisible();
});

test("reset keeps a type-specific route's default, while all-types can leave it", async ({ page }) => {
  await page.goto("/phim-bo?year=2024");
  await page.getByRole("button", { name: "Xóa tất cả", exact: true }).click();
  await expect(page).toHaveURL(/\/phim-bo$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Phim Bộ");
  await page.getByRole("button", { name: /^Bộ lọc/ }).click();
  await page.getByRole("combobox", { name: /^Loại phim/ }).click();
  await page.getByRole("option", { name: "Tất cả loại", exact: true }).click();
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page).toHaveURL(/\/danh-sach$/);
});

test("responsive fields, menus and primary actions remain usable at all target widths", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  for (const width of [320, 375, 414, 768, 800, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/danh-sach");
    await page.getByRole("button", { name: /^Bộ lọc/ }).click();
    const form = page.getByRole("form", { name: "Bộ lọc phim", exact: true });
    const fields = form.locator(".filter-select-trigger");
    await expect(fields).toHaveCount(5);
    for (const field of await fields.all()) {
      const box = (await field.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(170);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await form.getByRole("combobox", { name: /^Quốc gia/ }).click();
    const menu = page.locator(".filter-select-popover");
    await expect(menu).toBeVisible();
    const bounds = (await menu.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
    await page.keyboard.press("Escape");
    if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`filters-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("mobile hero keeps its CTA and touch controls, detail actions do not wrap, selected date is visible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/phimhay");
  const hero = page.getByRole("region", { name: "Phim tiêu điểm", exact: true });
  await expect(hero.getByRole("link", { name: /^Xem phim/ })).toBeVisible();
  const heading = await hero.getByRole("heading", { level: 1 }).textContent();
  const next = hero.getByRole("button", { name: "Phim tiêu điểm tiếp theo", exact: true });
  expect((await next.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await next.click();
  await expect(hero.getByRole("heading", { level: 1 })).not.toHaveText(heading!);
  const second = await hero.getByRole("heading", { level: 1 }).textContent();
  await hero.locator(".hero-frame").dispatchEvent("pointerdown", { pointerType: "touch", clientX: 280, clientY: 160 });
  await hero.locator(".hero-frame").dispatchEvent("pointerup", { pointerType: "touch", clientX: 100, clientY: 165 });
  await expect(hero.getByRole("heading", { level: 1 })).not.toHaveText(second!);
  await page.goto("/phim/iframe-only?source=kkphim");
  const action = page.getByRole("link", { name: "Xem Ngay", exact: true });
  await expect(action).toBeVisible();
  expect(await action.locator("span").evaluate((node) => node.getBoundingClientRect().height <= parseFloat(getComputedStyle(node).lineHeight) + 1)).toBe(true);
  await page.goto("/lich-chieu");
  const dates = page.locator(".schedule-date-strip button");
  await dates.first().click();
  await expect(dates.first()).toHaveAttribute("aria-pressed", "true");
  // Mock films have no updated timestamp; activate a date without Playwright's
  // automatic scroll so the component itself must reveal the selected date.
  await dates.last().dispatchEvent("click");
  const selected = page.locator('.schedule-date-strip [aria-pressed="true"]');
  await expect(selected).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("the eight-state component preview stays readable at the four Hallmark widths", async ({ page }, testInfo) => {
  const html = await readFile("docs/frontend-audit-2026-10-17/controls.preview.html", "utf8");
  const tokens = await readFile("tokens.css", "utf8");
  await page.route("**/controls-preview", (route) => route.fulfill({ contentType: "text/html", body: html }));
  await page.route("**/tokens.css", (route) => route.fulfill({ contentType: "text/css", body: tokens }));
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/controls-preview");
    await expect(page.locator("section")).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const field of await page.locator(".field").all()) {
      const box = (await field.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    if (width === 320 || width === 768) await page.screenshot({ path: testInfo.outputPath(`states-${width}.png`), fullPage: true });
  }
});
