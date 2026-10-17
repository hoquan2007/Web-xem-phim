import { test, expect } from "@playwright/test";

test("mobile drawer traps focus, closes with Escape, and restores its trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Mở menu", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Khám phá PTQ Film" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((node) => node.contains(document.activeElement)),
    )
    .toBe(true);
  for (let i = 0; i < 18; i++) await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      dialog.evaluate((node) => node.contains(document.activeElement)),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("mobile search is directly available and opens a named search form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Mở tìm kiếm" }).click();
  const dialog = page.getByRole("dialog", { name: "Tìm phim", exact: true });
  await dialog.getByRole("combobox", { name: "Tìm kiếm phim" }).fill("avengers");
  await dialog.getByRole("button", { name: "Tìm", exact: true }).click();
  await expect(page).toHaveURL(/tim-kiem\?keyword=avengers/);
  await expect(dialog).not.toBeVisible();
});

test("hero is manual, has honest metadata, and exposes controls on touch widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const hero = page.getByRole("region", {
    name: "Phim tiêu điểm",
    exact: true,
  });
  const heading = hero.getByRole("heading", { level: 1 });
  const initial = await heading.textContent();
  await expect(hero.getByText("T12", { exact: true })).toHaveCount(0);
  await expect(hero.getByText("TMDB 0.0", { exact: true })).toHaveCount(0);
  await page.waitForTimeout(6200);
  await expect(heading).toHaveText(initial!);
  await hero.getByRole("button", { name: "Phim tiêu điểm tiếp theo", exact: true }).click();
  await expect(heading).not.toHaveText(initial!);
});

test("mobile filters apply a draft together and keep filters during pagination", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/danh-sach");
  await page.getByRole("button", { name: /^Bộ lọc/ }).click();
  const dialog = page.getByRole("form", { name: "Bộ lọc phim" });
  await dialog.getByRole("combobox", { name: /^Loại phim/ }).click();
  await dialog.getByRole("option", { name: "Phim bộ", exact: true }).click();
  await dialog.getByRole("combobox", { name: /^Năm phát hành/ }).click();
  await dialog.getByRole("combobox", { name: "Tìm năm phát hành" }).fill("2024");
  await dialog.getByRole("option", { name: "2024", exact: true }).click();
  expect(new URL(page.url()).searchParams.has("type")).toBe(false);
  await dialog.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page).toHaveURL(/type=series/);
  expect(new URL(page.url()).searchParams.get("year")).toBe("2024");
  await expect(dialog).not.toBeVisible();
  const pagination = page.getByRole("navigation", { name: "Phân trang" });
  const next = pagination.getByRole("link", {
    name: "Trang tiếp",
    exact: true,
  });
  if (await next.count()) {
    const href = await next.getAttribute("href");
    expect(href).toContain("type=series");
    expect(href).toContain("year=2024");
  }
});

test("clipboard failure exposes a selectable link instead of false success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.goto("/xem-phim/iframe-only?source=kkphim");
  await page.getByRole("button", { name: "Chia sẻ", exact: true }).click();
  await expect(page.getByLabel("Đường dẫn phim")).toHaveValue(page.url());
  await expect(page.getByText("Đã chép link", { exact: true })).toHaveCount(0);
});

test("watch width stays stable across viewport heights and report returns focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/xem-phim/iframe-only?source=kkphim");
  const player = page.locator(".watch-player");
  await expect(player).toBeVisible();
  const before = (await player.boundingBox())!;
  const columns = page.locator(".watch-main-column, .watch-recommendations");
  const columnWidths = await columns.evaluateAll(items => items.map(item => item.getBoundingClientRect().width));
  await page.setViewportSize({ width: 1920, height: 600 });
  const after = (await player.boundingBox())!;
  expect(after.width).toBeCloseTo(before.width, 0);
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.width).toBeLessThanOrEqual(1440);
  expect(await columns.evaluateAll(items => items.map(item => item.getBoundingClientRect().width))).toEqual(columnWidths);
  const options = page.getByRole("button", { name: "Tùy chọn xem phim", exact: true });
  await options.click();
  await expect(page.getByRole("menuitem", { name: "Mở rộng", exact: true })).toHaveCount(0);
  await page.getByRole("menuitem", { name: /^Tạo báo cáo sự cố/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Tạo báo cáo sự cố" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(options).toBeFocused();
});

test("private notes use a real saved timestamp and survive a reload", async ({
  page,
}) => {
  await page.goto("/xem-phim/iframe-only?source=kkphim");
  await page.locator(".watch-notes-disclosure > summary").click();
  await page
    .getByRole("textbox", { name: /^Ghi chú về/ })
    .fill("Ghi chú kiểm thử riêng tư");
  await page.getByRole("button", { name: "Lưu ghi chú", exact: true }).click();
  const createdAt = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("hnq_comments_iframe-only") || "[]")[0]
        ?.createdAt,
  );
  expect(Number.isNaN(Date.parse(createdAt))).toBe(false);
  await page.reload();
  await page.locator(".watch-notes-disclosure > summary").click();
  await expect(
    page.getByText("Ghi chú kiểm thử riêng tư", { exact: true }),
  ).toBeVisible();
});

test("text tokens have AA contrast across the shared surfaces", async ({
  page,
}) => {
  await page.goto("/tu-phim");
  const ratios = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    const style = getComputedStyle(document.documentElement);
    const luminance = (token: string) => {
      context.fillStyle = style.getPropertyValue(token).trim();
      context.fillRect(0, 0, 1, 1);
      const channels = [...context.getImageData(0, 0, 1, 1).data]
        .slice(0, 3)
        .map((value) => {
          const s = value / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const combinations = [
      "--color-paper",
      "--color-paper-2",
      "--color-paper-3",
    ].flatMap((background) =>
      ["--color-ink", "--color-ink-2", "--color-muted"].map((foreground) => [
        foreground,
        background,
      ]),
    );
    combinations.push(["--color-accent-ink", "--color-accent"]);
    return combinations.map(([foreground, background]) => {
      const a = luminance(foreground),
        b = luminance(background);
      return {
        foreground,
        background,
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
  });
  for (const sample of ratios)
    expect(
      sample.ratio,
      `${sample.foreground} on ${sample.background}`,
    ).toBeGreaterThanOrEqual(4.5);
});

test("reduced motion keeps the brand and hero stationary", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Phim tiêu điểm", exact: true }),
  ).toBeVisible();
  const animations = await page
    .locator("header:visible")
    .evaluate((node) => node.getAnimations({ subtree: true }).length);
  expect(animations).toBe(0);
});

test("selected episode and next action remain readable after visual changes", async ({
  page,
}) => {
  await page.goto("/xem-phim/iframe-only?source=kkphim");
  for (const locator of [
    page.locator('.watch-episodes button[aria-pressed="true"]').first(),
    page.getByRole("button", { name: "Tập tiếp", exact: true }),
  ]) {
    const ratio = await locator.evaluate((node) => {
      const style = getComputedStyle(node),
        canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      const light = (color: string) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const channels = [...context.getImageData(0, 0, 1, 1).data]
          .slice(0, 3)
          .map((v) => {
            const s = v / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const a = light(style.color),
        b = light(style.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
});

test("responsive routes have one main, named controls, and no document overflow", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  for (const width of [320, 375, 414, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/danh-sach",
      "/phimhay",
      "/phim-le",
      "/phim-bo",
      "/c/phim-han-quoc-moi",
      "/phim/iframe-only?source=kkphim",
      "/tim-kiem?keyword=avengers",
      "/tu-phim",
      "/chu-de",
      "/lich-chieu",
      "/the-loai/hanh-dong",
      "/quoc-gia/han-quoc",
      "/this-page-does-not-exist",
      "/xem-phim/iframe-only?source=kkphim",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("main h1")).toBeVisible();
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflows, `${route} at ${width}px`).toBe(false);
      const nameless = await page
        .locator("button:visible")
        .evaluateAll(
          (buttons) =>
            buttons.filter(
              (button) =>
                !(
                  button.getAttribute("aria-label") ||
                  button.textContent?.trim() ||
                  button.getAttribute("title")
                ),
            ).length,
        );
      expect(nameless, `${route}: unnamed visible buttons`).toBe(0);
      if (route === "/") {
        expect(
          (await page.locator(".movie-rail .movie-card").first().boundingBox())!
            .width,
        ).toBeGreaterThanOrEqual(120);
      }
      if (route === "/tu-phim") {
        for (const tab of await page.getByRole("tab").all())
          expect((await tab.boundingBox())!.height).toBeLessThan(60);
      }
      if (
        [375, 1440].includes(width) &&
        [
          "/",
          "/danh-sach",
          "/tu-phim",
          "/phim/iframe-only?source=kkphim",
          "/xem-phim/iframe-only?source=kkphim",
        ].includes(route)
      ) {
        const name =
          route === "/"
            ? "home"
            : route.startsWith("/xem-phim/")
              ? "watch"
              : route.startsWith("/phim/")
                ? "detail"
                : route.slice(1);
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${width}.png`),
        });
      }
    }
  }
});
