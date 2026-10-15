import { mkdir, open, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const assetDirectory = path.join(root, "public/sites/rophim");
const dataDirectory = path.join(root, "src/data");
await mkdir(assetDirectory, { recursive: true });
await mkdir(dataDirectory, { recursive: true });
const origin = "https://rophim1.vip";
const endpoint = `${origin}/baseapi/api/v1/movies/hot`;
const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Hero API: ${response.status}`);
const { result } = await response.json();
if (!Array.isArray(result) || !result.length)
  throw new Error("Empty hero source");
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
const allowedImages = new Set([
  "image.tmdb.org",
  "vsmov.com",
  "img.nguonc.com",
  "rophim1.vip",
  "i.ibb.co",
]);
const download = async (url, destination, kind) => {
  const headers = await fetch(url, {
    method: "HEAD",
    signal: AbortSignal.timeout(20000),
  });
  if (!headers.ok) throw new Error(`${url}: ${headers.status}`);
  const type = headers.headers.get("content-type") || "";
  if (
    !(kind === "video" ? type.startsWith("video/") : type.startsWith("image/"))
  )
    throw new Error(`Unexpected media type: ${url}: ${type}`);
  const size = Number(headers.headers.get("content-length"));
  let existing;
  try {
    existing = await open(destination);
    const stat = await existing.stat();
    const header = Buffer.alloc(24);
    await existing.read(header, 0, header.length, 0);
    if (
      stat.size === size &&
      (kind !== "video" || header.toString("ascii", 4, 8) === "ftyp")
    )
      return { bytes: stat.size, contentType: type, reused: true };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  } finally {
    await existing?.close();
  }
  const media = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!media.ok) throw new Error(`${url}: ${media.status}`);
  const bytes = Buffer.from(await media.arrayBuffer());
  if (kind === "video" && bytes.toString("ascii", 4, 8) !== "ftyp")
    throw new Error(`Invalid MP4: ${url}`);
  const receivedSize = Number(media.headers.get("content-length"));
  if (
    receivedSize > 0 &&
    !media.headers.get("content-encoding") &&
    bytes.length !== receivedSize
  )
    throw new Error(`Incomplete media: ${url}`);
  await writeFile(destination, bytes);
  return { bytes: bytes.length, contentType: type, reused: false };
};
const records = new Array(result.length);
let cursor = 0;
async function worker() {
  while (cursor < result.length) {
    const index = cursor++;
    const item = result[index];
    if (!/^[a-z0-9-]+$/.test(item.slug))
      throw new Error("Invalid reference slug");
    const video = new URL(item.trailer_url, origin);
    if (
      video.origin !== origin ||
      !/^\/media\/[a-z0-9-]+\.mp4$/.test(video.pathname)
    )
      throw new Error("Unexpected trailer URL");
    const videoName =
      item.slug === "yeu-mot-nguoi-khac"
        ? "love-other-than-yours.mp4"
        : path.posix.basename(video.pathname);
    const videoAsset = await download(
      video.href,
      path.join(assetDirectory, videoName),
      "video",
    );
    const poster = new URL(item.poster);
    if (poster.protocol !== "https:" || !allowedImages.has(poster.hostname))
      throw new Error("Unexpected poster origin");
    const posterName = `${item.slug}-backdrop${path.posix.extname(poster.pathname) || ".jpg"}`;
    const imageAsset = await download(
      poster.href,
      path.join(assetDirectory, posterName),
      "image",
    );
    const search = await fetch(
      `http://localhost:3000/api/search?${new URLSearchParams({ keyword: item.name, limit: "12" })}`,
      { signal: AbortSignal.timeout(20000) },
    );
    const matches = search.ok ? (await search.json()).items || [] : [];
    const providerMovie = matches.find(
      (movie) =>
        normalize(movie.origin_name) === normalize(item.origin_name) ||
        normalize(movie.name) === normalize(item.name),
    );
    records[index] = {
      id: String(item.id),
      title: item.name,
      originalTitle: item.origin_name,
      slug: item.slug,
      description: item.description || "",
      year: item.publish_year,
      country: item.regions?.[0]?.name || "",
      episode: item.episode_current ? `Tập ${item.episode_current}` : "",
      videoSrc: `/sites/rophim/${videoName}`,
      posterSrc: `/sites/rophim/${posterName}`,
      providerMovie: providerMovie || null,
      provenance: {
        video: video.href,
        poster: poster.href,
        videoAsset,
        imageAsset,
      },
    };
    console.log(
      JSON.stringify({
        slide: index + 1,
        title: item.name,
        file: videoName,
        bytes: videoAsset.bytes,
        provider: providerMovie?.source || "search",
      }),
    );
  }
}
await Promise.all([worker(), worker(), worker()]);
await writeFile(
  path.join(dataDirectory, "hero-slides.json"),
  JSON.stringify(
    { source: endpoint, capturedAt: new Date().toISOString(), slides: records },
    null,
    2,
  ) + "\n",
);
console.log(`Saved ${records.length} hero videos and matching backdrops.`);
