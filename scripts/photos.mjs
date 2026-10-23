// Готовит данные для игры из data/komi_flat.csv:
//   npm run photos — скачивает недостающие фото в public/photos (WebP) и пересобирает src/data/flats.json
//   npm run data   — только пересобирает src/data/flats.json по уже скачанным фото (без сети)
// В игру попадают только квартиры, у которых есть хотя бы одно фото.
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = path.join(root, "data", "komi_flat.csv");
const PHOTOS_DIR = path.join(root, "public", "photos");
const OUT_PATH = path.join(root, "src", "data", "flats.json");
const OFFLINE = process.argv.includes("--offline");

const CITIES = {
  inta: "Инта",
  vorkuta: "Воркута",
  syktyvkar: "Сыктывкар",
  ukhta: "Ухта",
  pechora: "Печора",
  usinsk: "Усинск",
  sosnogorsk: "Сосногорск",
};

// CSV по RFC 4180: запятые, кавычки, переносы строк внутри кавычек.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function toFlat(record, index) {
  const url = (record.url || "").trim();
  const price = Number((record.price || "").replace(/\D/g, ""));
  const title = (record.title || "").trim();
  const area = Number((title.match(/(\d+(?:[.,]\d+)?)\s*м²/) || [])[1]?.replace(",", "."));
  if (!url || !price || !area) return null;

  const roomsMatch = title.match(/^(\d+)-к/);
  const floorMatch = title.match(/(\d+)\/(\d+)\s*эт/);
  const id = (url.match(/_(\d+)(?:[?#]|$)/) || [])[1] || `row${index + 1}`;
  let city = "Республика Коми";
  try {
    const slug = new URL(url).pathname.split("/")[1];
    city = CITIES[slug] || city;
  } catch {}

  return {
    id,
    url: url.split("?")[0],
    city,
    street: (record.street || "").trim(),
    title,
    rooms: roomsMatch ? Number(roomsMatch[1]) : /студи/i.test(title) ? 0 : null,
    area,
    floor: floorMatch ? Number(floorMatch[1]) : null,
    floors: floorMatch ? Number(floorMatch[2]) : null,
    price,
    sources: record.photos.map((src, i) => ({ src, file: `${id}-${i + 1}.webp` })),
  };
}

function readRecords(text) {
  const [header, ...rows] = parseCsv(text);
  const keys = header.map((h) => h.trim().toLowerCase());
  return rows.map((cells) => {
    const record = { photos: [] };
    keys.forEach((key, i) => {
      const value = (cells[i] || "").trim();
      if (key === "ссылка") record.url = value;
      else if (key.startsWith("фото")) value && record.photos.push(value);
      else if (key === "цена") record.price = value;
      else if (key === "описание") record.title = value;
      else if (key === "улица" || key === "цлица") record.street = value;
    });
    return record;
  });
}

const exists = (p) => access(p).then(() => true, () => false);

async function download(src, dest, sharp) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(src, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          Referer: "https://www.avito.ru/",
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      await sharp(buffer)
        .rotate()
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(dest);
      return true;
    } catch (error) {
      if (attempt === 3) {
        console.warn(`  ✗ ${path.basename(dest)}: ${error.message}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

async function main() {
  const records = readRecords(await readFile(CSV_PATH, "utf8"));
  const flats = records.map(toFlat).filter(Boolean);
  await mkdir(PHOTOS_DIR, { recursive: true });

  if (!OFFLINE) {
    const { default: sharp } = await import("sharp");
    const queue = [];
    for (const flat of flats)
      for (const { src, file } of flat.sources) {
        const dest = path.join(PHOTOS_DIR, file);
        if (!(await exists(dest))) queue.push({ src, dest });
      }
    console.log(`Скачиваю фото: ${queue.length}`);
    let done = 0;
    const worker = async () => {
      while (queue.length) {
        const job = queue.shift();
        await download(job.src, job.dest, sharp);
        if (++done % 20 === 0) console.log(`  ${done}…`);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  const result = [];
  let photoCount = 0;
  for (const { sources, ...flat } of flats) {
    const photos = [];
    for (const { file } of sources)
      if (await exists(path.join(PHOTOS_DIR, file))) photos.push(`/photos/${file}`);
    if (!photos.length) continue;
    photoCount += photos.length;
    result.push({ ...flat, photos });
  }

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(result, null, 2) + "\n");
  console.log(
    `Готово: ${result.length} из ${flats.length} квартир с фото, ${photoCount} фото → src/data/flats.json`,
  );
  if (result.length < 10) {
    console.error("В игре должно быть минимум 10 квартир с фото — проверьте загрузку.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
