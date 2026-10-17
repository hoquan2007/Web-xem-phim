import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import reference from "../../src/data/hero-slides.json";

for (const width of [375, 1440]) {
  test(`all 15 hero videos autoplay on selection at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const requests = new Set<string>();
    page.on("request", (request) => {
      if (request.url().endsWith(".mp4"))
        requests.add(new URL(request.url()).pathname);
    });
    await page.goto("/phimhay");
    const hero = page.getByRole("region", {
      name: "Phim tiêu điểm",
      exact: true,
    });
    const choices = hero.locator(".hero-dots button");
    await expect(choices).toHaveCount(15);
    const video = hero.locator("video");
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement) => !node.paused && node.currentTime > 0.1,
        ),
      )
      .toBe(true);
    expect([...requests]).toEqual([reference.slides[0].videoSrc]);
    const samples = [];
    for (const [index, slide] of reference.slides.entries()) {
      if (index) {
        if (width < 1200) await hero.getByRole("button", { name: "Phim tiêu điểm tiếp theo", exact: true }).click();
        else await choices.nth(index).click();
      }
      await expect(video).toHaveCount(1);
      await expect(video).toHaveAttribute("src", slide.videoSrc);
      await expect
        .poll(
          () =>
            video.evaluate(
              (node: HTMLVideoElement) =>
                !node.paused &&
                node.readyState >= 2 &&
                node.currentTime > 0.1 &&
                node.videoWidth > 0,
            ),
          { timeout: 20000 },
        )
        .toBe(true);
      await expect(hero.getByRole("heading", { level: 1 })).toHaveText(
        slide.title,
      );
      expect(
        await video.evaluate((node: HTMLVideoElement) => node.error),
      ).toBeNull();
      samples.push({
        title: slide.title,
        ...(await video.evaluate((node: HTMLVideoElement) => ({
          source: node.getAttribute("src"),
          time: node.currentTime,
          width: node.videoWidth,
          height: node.videoHeight,
          duration: node.duration,
          paused: node.paused,
        }))),
      });
      if ((width === 1440 && index === 1) || (width === 375 && index === 14))
        await page.screenshot({
          path: testInfo.outputPath(`hero-video-${width}.png`),
        });
    }
    expect(errors).toEqual([]);
    await writeFile(
      testInfo.outputPath(`hero-playback-${width}.json`),
      JSON.stringify(samples, null, 2),
    );
    await testInfo.attach(`hero-playback-${width}`, {
      body: JSON.stringify(samples, null, 2),
      contentType: "application/json",
    });
  });
}

test("pause applies to the current clip; switching and rapid navigation restart playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/phimhay");
  const hero = page.getByRole("region", {
    name: "Phim tiêu điểm",
    exact: true,
  });
  const video = hero.locator("video");
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) => !node.paused && node.currentTime > 0,
      ),
    )
    .toBe(true);
  await hero.getByRole("button", { name: "Bật âm thanh trailer" }).click();
  await expect
    .poll(() =>
      video.evaluate((node: HTMLVideoElement) => !node.muted && !node.paused),
    )
    .toBe(true);
  await hero.getByRole("button", { name: "Tạm dừng trailer" }).click();
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.paused))
    .toBe(true);
  const choices = hero.getByRole("button", { name: /^Phim tiêu điểm \d+:/ });
  await choices.nth(1).click();
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) =>
          !node.paused && !node.muted && node.currentTime > 0.1,
      ),
    )
    .toBe(true);
  for (const index of [4, 7, 1]) await choices.nth(index).click();
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute("src", reference.slides[1].videoSrc);
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) => !node.paused && node.currentTime > 0.1,
      ),
    )
    .toBe(true);
});

test("reduced motion waits for play on each clip", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/phimhay");
  const hero = page.getByRole("region", {
    name: "Phim tiêu điểm",
    exact: true,
  });
  const video = hero.locator("video");
  await expect(
    hero.getByRole("button", { name: "Phát trailer", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.paused))
    .toBe(true);
  await hero.getByRole("button", { name: "Phát trailer", exact: true }).click();
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) => !node.paused && node.currentTime > 0.1,
      ),
    )
    .toBe(true);
  await hero.getByRole("button", { name: /^Phim tiêu điểm 2:/ }).click();
  await expect(video).toHaveAttribute("src", reference.slides[1].videoSrc);
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.paused))
    .toBe(true);
});

test("audible autoplay rejection falls back to muted playback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      return this.muted
        ? play.call(this)
        : Promise.reject(
            new DOMException("Audible autoplay denied", "NotAllowedError"),
          );
    };
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/phimhay");
  const hero = page.getByRole("region", {
    name: "Phim tiêu điểm",
    exact: true,
  });
  const video = hero.locator("video");
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) => !node.paused && node.currentTime > 0,
      ),
    )
    .toBe(true);
  await hero.getByRole("button", { name: "Bật âm thanh trailer" }).click();
  await expect
    .poll(() =>
      video.evaluate((node: HTMLVideoElement) => node.muted && !node.paused),
    )
    .toBe(true);
  await expect(
    hero.getByRole("button", { name: "Bật âm thanh trailer" }),
  ).toBeVisible();
});

test("an unavailable video leaves the actual movie backdrop visible", async ({
  page,
}) => {
  await page.route("**/sites/rophim/thejackpot.mp4", (route) => route.abort());
  await page.goto("/phimhay");
  const hero = page.getByRole("region", {
    name: "Phim tiêu điểm",
    exact: true,
  });
  await hero.getByRole("button", { name: /^Phim tiêu điểm 2:/ }).click();
  await expect(hero.locator("video")).toHaveCount(0);
  const backdrop = hero.locator(".hero-image img");
  await expect(backdrop).toBeVisible();
  await expect
    .poll(() =>
      backdrop.evaluate(
        (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText(
    reference.slides[1].title,
  );
});
