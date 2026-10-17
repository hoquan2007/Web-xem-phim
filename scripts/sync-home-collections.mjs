import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Manual editorial import. The application never calls the reference API.
const referenceOrigin = "https://rophim1.vip";
const apiOrigin = "https://phimapi.com";
const assetDirectory = path.join(
  process.cwd(),
  "public/sites/rophim/collections",
);
await mkdir(assetDirectory, { recursive: true });
const json = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response.json();
};
const pages = await Promise.all(
  [2, 3, 4].map((page) =>
    json(
      `${referenceOrigin}/baseapi/api/v1/lists/homepageLists?page=${page}&limit=4`,
    ),
  ),
);
const collections = pages.flatMap((page) => page.result.collections);
const configurations = [
  ["series", "top-phim-bo-hom-nay", 30, "series"],
  ["movies", "top-phim-le-hom-nay", 30, "single"],
  ["recommendations", "phim-hay-nhat", 15, null],
  ["anime", "phim-hoat-hinh-anime", 10, "hoathinh"],
  ["tv", "tv-shows-chuong-trinh-truyen-hinh", 10, "tvshows"],
];
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
const season = (movie) => {
  const explicit = `${movie.origin_name} ${movie.name}`.match(
    /(?:season|phần|phan)[\s(\-]*(\d+)/i,
  );
  return explicit ? Number(explicit[1]) : Number(movie.tmdb?.season || 1);
};
const baseTitle = (value) =>
  normalize(
    String(value || "").replace(
      /\s*[-(]?\s*(?:season|phần|phan)\s*\d+\)?/gi,
      "",
    ),
  );
const matches = (item, movie) => {
  if (Math.abs(Number(item.publish_year) - Number(movie.year)) > 1)
    return false;
  if (season(item) !== season(movie)) return false;
  return (
    baseTitle(item.origin_name) === baseTitle(movie.origin_name) ||
    normalize(item.name) === normalize(movie.name)
  );
};
const makeMovie = (item) => ({
  source: "kkphim",
  _id: item._id,
  slug: item.slug,
  name: item.name,
  origin_name: item.origin_name,
  poster_url: item.poster_url,
  thumb_url: item.thumb_url,
  year: item.year,
  type: item.type,
  quality: item.quality,
  lang: item.lang,
  episode_current: item.episode_current,
  tmdb:
    item.tmdb?.id && item.tmdb?.type
      ? {
          id: String(item.tmdb.id),
          type: String(item.tmdb.type),
          season: item.tmdb.season ?? null,
          vote_average: String(item.tmdb.vote_average ?? "0"),
          vote_count: Number(item.tmdb.vote_count || 0),
        }
      : undefined,
  imdb: item.imdb?.id ? { id: String(item.imdb.id) } : undefined,
  modified: item.modified,
  ...(typeof item.chieurap === "boolean" ? { chieurap: item.chieurap } : {}),
});
const pools = (
  await Promise.all(
    ["phim-bo", "phim-le", "hoat-hinh", "tv-shows"].map((type) =>
      json(`${apiOrigin}/v1/api/danh-sach/${type}?limit=64`),
    ),
  )
).flatMap((data) => data.data.items);
const searches = new Map();
const resolveMovie = async (item) => {
  let movie = pools.find((candidate) => matches(item, candidate));
  if (movie) return movie;
  for (const key of [
    item.name,
    String(item.origin_name || "")
      .replace(/\s*[-(]?\s*(?:season|phần|phan)\s*\d+\)?/gi, "")
      .trim(),
  ]) {
    if (!key) continue;
    if (!searches.has(key))
      searches.set(
        key,
        json(
          `${apiOrigin}/v1/api/tim-kiem?${new URLSearchParams({ keyword: key, limit: "32" })}`,
        )
          .then((data) => data.data?.items || [])
          .catch(() => []),
      );
    movie = (await searches.get(key)).find((candidate) =>
      matches(item, candidate),
    );
    if (movie) return movie;
  }
  return undefined;
};
const allowedImages = new Set([
  "image.tmdb.org",
  "phimimg.com",
  "img.nguonc.com",
  "vsmov.com",
  "img.ophim.live",
  "i.ibb.co",
]);
async function backdrop(item, movie, key) {
  for (const origin of [item.poster, movie.thumb_url]) {
    try {
      const url = new URL(origin);
      if (url.protocol !== "https:" || !allowedImages.has(url.hostname))
        continue;
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/")
      )
        continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(bytes).metadata();
      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width / metadata.height < 1.25
      )
        continue;
      const extension =
        metadata.format === "webp"
          ? "webp"
          : metadata.format === "png"
            ? "png"
            : "jpg";
      const file = `${key}-${item.id}.${extension}`;
      await writeFile(path.join(assetDirectory, file), bytes);
      return {
        local: `/sites/rophim/collections/${file}`,
        origin: url.href,
        width: metadata.width,
        height: metadata.height,
        bytes: bytes.length,
      };
    } catch {
      /* A provider thumb remains a usable fallback if the source is unavailable. */
    }
  }
  return null;
}
const output = {
  capturedAt: new Date().toISOString(),
  source: `${referenceOrigin}/phimhay`,
  collections: {},
};
for (const [key, slug, limit, expectedType] of configurations) {
  const collection = collections.find((row) => row.slug === slug);
  if (!collection) throw new Error(`Missing reference collection: ${slug}`);
  const result = [];
  let cursor = 0;
  const rows = collection.movies.slice(0, limit);
  const resolved = new Array(rows.length);
  async function worker() {
    while (cursor < rows.length) {
      const index = cursor++,
        item = rows[index];
      const found = await resolveMovie(item);
      if (!found || (expectedType && found.type !== expectedType)) continue;
      const image = ["anime", "tv"].includes(key)
        ? await backdrop(item, found, key)
        : null;
      resolved[index] = {
        movie: {
          ...makeMovie(found),
          content: item.description || "",
          ...(image ? { backdrop_url: image.local } : {}),
        },
        reference: {
          id: item.id,
          slug: item.slug,
          title: item.name,
          originalTitle: item.origin_name,
          year: item.publish_year,
        },
        ...(image ? { backdrop: image } : {}),
      };
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  const seen = new Set();
  for (const record of resolved.filter(Boolean)) {
    if (!seen.has(record.movie.slug)) {
      seen.add(record.movie.slug);
      result.push(record);
    }
  }
  output.collections[key] = {
    sourceSlug: slug,
    sourceTitle: collection.name,
    movies: result,
  };
  console.log(`${key}: matched ${result.length}/${rows.length}`);
}
await writeFile(
  "src/data/home-collections.json",
  JSON.stringify(output, null, 2) + "\n",
);
