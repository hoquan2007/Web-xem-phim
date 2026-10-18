// Regenerate icons and sharing images from the approved transparent logo.
// To import a new master: node scripts/sync-brand-assets.mjs path/to/logo.png
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const asset = (relative) => path.join(root, relative);
const master = asset("public/images/ptq-film-logo.png");

if (process.argv[2]) {
  const source = path.resolve(process.argv[2]);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] <= 16) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error("The source logo is fully transparent.");
  const symbol = await sharp(source)
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize(480, 480, { fit: "contain", background: "#00000000" })
    .png().toBuffer();
  await sharp(symbol)
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: "#00000000" })
    .png().toFile(master);
}

const icon = await sharp(master).resize(256, 256).png().toBuffer();
await sharp(master).resize(128, 128).png().toFile(asset("public/images/ptq-icon.png"));
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><image width="256" height="256" href="data:image/png;base64,${icon.toString("base64")}"/></svg>\n`;
await writeFile(asset("src/app/icon.svg"), iconSvg);
await sharp(master).resize(180, 180).flatten({ background: "#191b24" }).png()
  .toFile(asset("src/app/apple-icon.png"));

// ICO supports embedded PNG frames; include common tab and high-DPI sizes.
const sizes = [16, 32, 48, 64, 128, 256];
const frames = await Promise.all(sizes.map((size) => sharp(master).resize(size, size).png().toBuffer()));
const directory = Buffer.alloc(6 + frames.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
for (let i = 0; i < frames.length; i++) {
  const entry = 6 + i * 16;
  directory[entry] = directory[entry + 1] = sizes[i] % 256;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frames[i].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frames[i].length;
}
await writeFile(asset("src/app/favicon.ico"), Buffer.concat([directory, ...frames]));

// Preserve the existing social card typography and layout, replacing its symbol.
const bannerPath = asset("public/images/og-banner.svg");
const banner = (await readFile(bannerPath, "utf8")).replace(
  /<g\b[^>]*>[\s\S]*?<\/g>|<image\b[^>]*\/>/,
  `<image x="80" y="170" width="168" height="168" href="data:image/png;base64,${icon.toString("base64")}"/>`,
);
await writeFile(bannerPath, banner);
await sharp(Buffer.from(banner)).png().toFile(asset("public/images/og-banner.png"));
console.log("Updated PTQ Film logo, browser/touch icons, and social cards.");
