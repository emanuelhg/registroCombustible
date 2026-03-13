import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const JSON_OUTPUT = path.join(REPO_ROOT, "stations-catalog.json");
const JS_OUTPUT = path.join(REPO_ROOT, "stations-catalog.js");

const DEFAULT_OFFICIAL_CSV_URL =
  "http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/f8dda0d5-2a9f-4d34-b79b-4e63de3995df/download/precios-historicos.csv";
const DEFAULT_VIGENTES_CSV_URL =
  "http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv";

const DEFAULT_STATIONS = [
  { brand: "YPF", name: "YPF - Av. Alem 123", city: "Rosario", province: "Santa Fe", fuels: ["Nafta Super", "Nafta Premium", "Diesel", "Diesel Premium"] },
  { brand: "YPF", name: "YPF - Circunvalacion Sur", city: "Rosario", province: "Santa Fe", fuels: ["Nafta Super", "Nafta Premium", "Diesel"] },
  { brand: "Shell", name: "Shell - Bv. Orono 950", city: "Rosario", province: "Santa Fe", fuels: ["Nafta Super", "Nafta Premium", "Diesel Premium"] },
  { brand: "Axion Energy", name: "Axion - Pellegrini 3100", city: "Rosario", province: "Santa Fe", fuels: ["Nafta Super", "Nafta Premium", "Diesel"] },
  { brand: "Puma Energy", name: "Puma - San Martin 1800", city: "Rosario", province: "Santa Fe", fuels: ["Nafta Super", "Diesel"] },
  { brand: "YPF", name: "YPF - Costanera Norte", city: "Santa Fe", province: "Santa Fe", fuels: ["Nafta Super", "Nafta Premium", "Diesel", "GNC"] },
  { brand: "Shell", name: "Shell - General Paz 2400", city: "Santa Fe", province: "Santa Fe", fuels: ["Nafta Super", "Nafta Premium", "Diesel"] },
  { brand: "Axion Energy", name: "Axion - Ruta 11 Km 470", city: "Santo Tome", province: "Santa Fe", fuels: ["Nafta Super", "Diesel", "Diesel Premium"] },
  { brand: "YPF", name: "YPF - Colon 220", city: "Cordoba", province: "Cordoba", fuels: ["Nafta Super", "Nafta Premium", "Diesel", "GNC"] },
  { brand: "Shell", name: "Shell - Duarte Quiros 1500", city: "Cordoba", province: "Cordoba", fuels: ["Nafta Super", "Nafta Premium", "Diesel Premium"] },
  { brand: "Puma Energy", name: "Puma - Av. Sabattini 4900", city: "Cordoba", province: "Cordoba", fuels: ["Nafta Super", "Diesel"] },
  { brand: "YPF", name: "YPF - Acceso Norte", city: "Mendoza", province: "Mendoza", fuels: ["Nafta Super", "Nafta Premium", "Diesel"] },
  { brand: "Shell", name: "Shell - San Martin Sur 980", city: "Mendoza", province: "Mendoza", fuels: ["Nafta Super", "Nafta Premium", "Diesel Premium"] },
  { brand: "Axion Energy", name: "Axion - Ruta 40 Lujan", city: "Mendoza", province: "Mendoza", fuels: ["Nafta Super", "Diesel", "Diesel Premium"] },
  { brand: "YPF", name: "YPF - Libertador 6100", city: "CABA", province: "Buenos Aires", fuels: ["Nafta Super", "Nafta Premium", "Diesel"] },
  { brand: "Shell", name: "Shell - 9 de Julio y Corrientes", city: "CABA", province: "Buenos Aires", fuels: ["Nafta Super", "Nafta Premium", "Diesel Premium"] },
  { brand: "Axion Energy", name: "Axion - Juan B Justo 5400", city: "CABA", province: "Buenos Aires", fuels: ["Nafta Super", "Nafta Premium", "Diesel"] },
  { brand: "Puma Energy", name: "Puma - Avellaneda Centro", city: "Avellaneda", province: "Buenos Aires", fuels: ["Nafta Super", "Diesel"] },
  { brand: "YPF", name: "YPF - Camino Centenario", city: "La Plata", province: "Buenos Aires", fuels: ["Nafta Super", "Nafta Premium", "Diesel", "GNC"] },
  { brand: "Shell", name: "Shell - Belgrano y 7", city: "La Plata", province: "Buenos Aires", fuels: ["Nafta Super", "Nafta Premium", "Diesel Premium"] }
];

const DEFAULT_TIMELINE = {
  YPF: [
    { date: "2025-11-01", prices: { "Nafta Super": 1189, "Nafta Premium": 1438, Diesel: 1250, "Diesel Premium": 1465, GNC: 639 } },
    { date: "2026-01-15", prices: { "Nafta Super": 1258, "Nafta Premium": 1506, Diesel: 1326, "Diesel Premium": 1549, GNC: 684 } },
    { date: "2026-03-01", prices: { "Nafta Super": 1315, "Nafta Premium": 1569, Diesel: 1398, "Diesel Premium": 1628, GNC: 722 } }
  ],
  Shell: [
    { date: "2025-11-01", prices: { "Nafta Super": 1214, "Nafta Premium": 1485, Diesel: 1287, "Diesel Premium": 1512 } },
    { date: "2026-01-15", prices: { "Nafta Super": 1288, "Nafta Premium": 1559, Diesel: 1361, "Diesel Premium": 1598 } },
    { date: "2026-03-01", prices: { "Nafta Super": 1345, "Nafta Premium": 1625, Diesel: 1436, "Diesel Premium": 1678 } }
  ],
  "Axion Energy": [
    { date: "2025-11-01", prices: { "Nafta Super": 1202, "Nafta Premium": 1466, Diesel: 1271, "Diesel Premium": 1498 } },
    { date: "2026-01-15", prices: { "Nafta Super": 1273, "Nafta Premium": 1538, Diesel: 1342, "Diesel Premium": 1582 } },
    { date: "2026-03-01", prices: { "Nafta Super": 1331, "Nafta Premium": 1603, Diesel: 1417, "Diesel Premium": 1660 } }
  ],
  "Puma Energy": [
    { date: "2025-11-01", prices: { "Nafta Super": 1175, "Nafta Premium": 1429, Diesel: 1245, "Diesel Premium": 1452 } },
    { date: "2026-01-15", prices: { "Nafta Super": 1245, "Nafta Premium": 1498, Diesel: 1317, "Diesel Premium": 1533 } },
    { date: "2026-03-01", prices: { "Nafta Super": 1302, "Nafta Premium": 1564, Diesel: 1391, "Diesel Premium": 1613 } }
  ]
};

function log(message) {
  console.log(`[update-stations] ${message}`);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function brandAlias(raw) {
  const v = normalizeText(raw);
  if (!v) return "Sin bandera";
  if (v.includes("ypf")) return "YPF";
  if (v.includes("shell")) return "Shell";
  if (v.includes("axion")) return "Axion Energy";
  if (v.includes("puma")) return "Puma Energy";
  return titleCase(raw);
}

function fuelAlias(raw) {
  const v = normalizeText(raw);
  if (!v) return null;
  if (v.includes("gnc")) return "GNC";
  if ((v.includes("nafta") || v.includes("nft")) && (v.includes("ultra") || v.includes("v-power") || v.includes("premium"))) return "Nafta Premium";
  if (v.includes("nafta") && v.includes("premium")) return "Nafta Premium";
  if (v.includes("nafta") && v.includes("super")) return "Nafta Super";
  if (
    v.includes("gasoil grado 3") ||
    v.includes("gas oil grado 3") ||
    v.includes("grado iii") ||
    v.includes("diesel premium") ||
    v.includes("infinia diesel") ||
    v.includes("v-power diesel")
  ) return "Diesel Premium";
  if (
    v.includes("gasoil grado 2") ||
    v.includes("gas oil grado 2") ||
    v.includes("grado ii")
  ) return "Diesel";
  if ((v.includes("diesel") || v.includes("gasoil") || v.includes("gas oil")) && (v.includes("premium") || v.includes("euro"))) return "Diesel Premium";
  if (v.includes("diesel") || v.includes("gasoil") || v.includes("gas oil")) return "Diesel";
  return titleCase(raw);
}

function parseDateIso(raw) {
  const value = String(raw ?? "").trim().replace("T", " ");
  if (!value) return null;

  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${month}-${day}`;
  }

  const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }

  return null;
}

function detectDelimiter(headerLine) {
  const counts = {
    ";": (headerLine.match(/;/g) || []).length,
    ",": (headerLine.match(/,/g) || []).length,
    "\t": (headerLine.match(/\t/g) || []).length
  };

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ",";
}

function parseCsv(text) {
  const firstLine = String(text).split(/\r?\n/)[0] || "";
  const delimiter = detectDelimiter(firstLine);
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length || row.length) {
    row.push(value);
    if (row.some((cell) => String(cell).trim() !== "")) {
      rows.push(row);
    }
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h).trim());
  return rows.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = cols[idx] ?? "";
    });
    return obj;
  });
}

function mapKeys(record) {
  const out = {};
  Object.entries(record).forEach(([k, v]) => {
    out[normalizeText(k)] = v;
  });
  return out;
}

function pick(record, candidates) {
  for (const key of candidates) {
    const value = record[key];
    if (value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function pickByPattern(record, patterns) {
  const entries = Object.entries(record);
  for (const pattern of patterns) {
    const found = entries.find(([key, value]) => key.includes(pattern) && String(value).trim() !== "");
    if (found) return String(found[1]).trim();
  }
  return "";
}

function pickSmart(record, exactCandidates, fuzzyPatterns) {
  return pick(record, exactCandidates) || pickByPattern(record, fuzzyPatterns);
}

function buildFromHistoricalCsv(records, timelineMonths = 18, recencyDays = 45) {
  const stationsMap = new Map();
  const monthlyAgg = new Map();
  const stationDayAgg = new Map();

  const parsedRows = records.map(mapKeys);
  const latestDate = parsedRows.reduce((max, row) => {
    const iso = parseDateIso(
      pickSmart(
        row,
        ["fecha", "fecha vigencia", "fechavigencia", "fecha_vigencia", "fecha_registro", "date"],
        ["fecha"]
      )
    );
    if (!iso) return max;
    return !max || iso > max ? iso : max;
  }, null);

  if (!latestDate) {
    return null;
  }

  const [y, m] = latestDate.split("-").map(Number);
  const timelineCutoff = new Date(Date.UTC(y, m - 1, 1));
  timelineCutoff.setUTCMonth(timelineCutoff.getUTCMonth() - Math.max(1, timelineMonths));

  const recencyCutoff = new Date(`${latestDate}T00:00:00Z`);
  recencyCutoff.setUTCDate(recencyCutoff.getUTCDate() - Math.max(1, recencyDays));
  const recencyCutoffIso = recencyCutoff.toISOString().slice(0, 10);

  for (const row of parsedRows) {
    const dateIso = parseDateIso(
      pickSmart(
        row,
        ["fecha", "fecha vigencia", "fechavigencia", "fecha_vigencia", "fecha_registro", "date"],
        ["fecha"]
      )
    );
    if (!dateIso) continue;

    const dateObj = new Date(`${dateIso}T00:00:00Z`);
    if (Number.isNaN(dateObj.getTime())) continue;

    const brand = brandAlias(
      pickSmart(
        row,
        ["empresabandera", "empresa bandera", "bandera", "bandera nombre", "bandera_nombre", "empresa", "operador"],
        ["empresabandera", "bandera", "empresa", "operador", "marca"]
      )
    );
    const fuel = fuelAlias(
      pickSmart(
        row,
        ["producto", "producto nombre", "producto_nombre", "tipo combustible", "tipo_combustible", "combustible"],
        ["producto", "combustible", "carburante"]
      )
    );
    if (!fuel) continue;

    const address = pickSmart(
      row,
      ["direccion", "domicilio", "domicilio estacion", "domicilio_estacion"],
      ["direccion", "domicilio", "calle"]
    );
    const stationNameRaw = pickSmart(
      row,
      ["razon social", "razon_social", "estacion", "estacion servicio", "estacion_servicio", "nombre"],
      ["razon", "estacion", "nombre", "sucursal"]
    );
    const name = address || stationNameRaw;
    if (!name) continue;

    const city =
      pickSmart(
        row,
        ["localidad", "municipio", "municipio_nombre", "partido", "departamento"],
        ["localidad", "municipio", "partido", "departamento", "ciudad"]
      ) || "Sin ciudad";
    const province =
      pickSmart(
        row,
        ["provincia", "provincia_nombre", "region"],
        ["provincia", "region"]
      ) || "Sin provincia";

    const cityLabel = titleCase(city);
    const provinceLabel = titleCase(province);
    const stationKey = `${normalizeText(brand)}|${normalizeText(name)}|${normalizeText(cityLabel)}|${normalizeText(provinceLabel)}`;

    if (!stationsMap.has(stationKey)) {
      stationsMap.set(stationKey, {
        brand,
        name,
        city: cityLabel,
        province: provinceLabel,
        fuels: new Set([fuel])
      });
    } else {
      stationsMap.get(stationKey).fuels.add(fuel);
    }

    const priceRaw = pickSmart(
      row,
      ["precio", "precio surtidor", "precio_surtidor", "valor", "importe"],
      ["precio", "valor", "importe"]
    );
    const price = Number(String(priceRaw).replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) continue;

    if (dateObj >= timelineCutoff) {
      const month = `${dateIso.slice(0, 7)}-01`;
      const monthKey = `${brand}|${month}|${fuel}`;
      const prevMonth = monthlyAgg.get(monthKey) || { total: 0, count: 0 };
      prevMonth.total += price;
      prevMonth.count += 1;
      monthlyAgg.set(monthKey, prevMonth);
    }

    if (dateObj >= recencyCutoff) {
      const dayKey = `${stationKey}|${fuel}|${dateIso}`;
      const prevDay = stationDayAgg.get(dayKey) || {
        total: 0,
        count: 0,
        stationKey,
        brand,
        fuel,
        city: cityLabel,
        province: provinceLabel,
        date: dateIso
      };
      prevDay.total += price;
      prevDay.count += 1;
      stationDayAgg.set(dayKey, prevDay);
    }
  }

  const stations = Array.from(stationsMap.values())
    .map((station) => ({ ...station, fuels: Array.from(station.fuels).sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const timeline = {};
  for (const [key, agg] of monthlyAgg.entries()) {
    const [brand, date, fuel] = key.split("|");
    const avg = Math.round((agg.total / agg.count) * 100) / 100;
    if (!timeline[brand]) timeline[brand] = new Map();
    if (!timeline[brand].has(date)) timeline[brand].set(date, {});
    timeline[brand].get(date)[fuel] = avg;
  }

  const normalizedTimeline = {};
  for (const [brand, datesMap] of Object.entries(timeline)) {
    normalizedTimeline[brand] = Array.from(datesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, prices]) => ({ date, prices }));
  }

  // Keep one latest value per station+fuel (averaging day duplicates before picking latest day).
  const latestStationFuel = new Map();
  for (const agg of stationDayAgg.values()) {
    const avg = Math.round((agg.total / agg.count) * 100) / 100;
    const stationFuelKey = `${agg.stationKey}|${agg.fuel}`;
    const prev = latestStationFuel.get(stationFuelKey);
    const candidate = {
      brand: agg.brand,
      fuel: agg.fuel,
      city: agg.city,
      province: agg.province,
      date: agg.date,
      price: avg
    };
    if (!prev || candidate.date > prev.date) {
      latestStationFuel.set(stationFuelKey, candidate);
    }
  }

  const localAgg = new Map();
  const brandAgg = new Map();

  for (const entry of latestStationFuel.values()) {
    const localKey = `${normalizeText(entry.province)}|${normalizeText(entry.city)}|${normalizeText(entry.brand)}|${normalizeText(entry.fuel)}`;
    const prevLocal = localAgg.get(localKey) || {
      province: entry.province,
      city: entry.city,
      brand: entry.brand,
      fuel: entry.fuel,
      total: 0,
      count: 0,
      latestDate: entry.date
    };
    prevLocal.total += entry.price;
    prevLocal.count += 1;
    if (entry.date > prevLocal.latestDate) prevLocal.latestDate = entry.date;
    localAgg.set(localKey, prevLocal);

    const brandKey = `${normalizeText(entry.brand)}|${normalizeText(entry.fuel)}`;
    const prevBrand = brandAgg.get(brandKey) || {
      brand: entry.brand,
      fuel: entry.fuel,
      total: 0,
      count: 0,
      latestDate: entry.date
    };
    prevBrand.total += entry.price;
    prevBrand.count += 1;
    if (entry.date > prevBrand.latestDate) prevBrand.latestDate = entry.date;
    brandAgg.set(brandKey, prevBrand);
  }

  const local = Array.from(localAgg.values())
    .map((item) => ({
      province: item.province,
      city: item.city,
      brand: item.brand,
      fuel: item.fuel,
      price: Math.round((item.total / item.count) * 100) / 100,
      date: item.latestDate,
      count: item.count
    }))
    .sort((a, b) => {
      const p = a.province.localeCompare(b.province);
      if (p !== 0) return p;
      const c = a.city.localeCompare(b.city);
      if (c !== 0) return c;
      const br = a.brand.localeCompare(b.brand);
      if (br !== 0) return br;
      return a.fuel.localeCompare(b.fuel);
    });

  const brand = Array.from(brandAgg.values())
    .map((item) => ({
      brand: item.brand,
      fuel: item.fuel,
      price: Math.round((item.total / item.count) * 100) / 100,
      date: item.latestDate,
      count: item.count
    }))
    .sort((a, b) => {
      const br = a.brand.localeCompare(b.brand);
      if (br !== 0) return br;
      return a.fuel.localeCompare(b.fuel);
    });

  return {
    stations,
    priceTimeline: normalizedTimeline,
    priceReference: {
      meta: {
        latestDate,
        cutoffDate: recencyCutoffIso,
        recencyDays: Math.max(1, recencyDays)
      },
      local,
      brand
    }
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "registroCombustible-catalog-updater" } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al descargar ${url}`);
  }
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "registroCombustible-catalog-updater" } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al descargar ${url}`);
  }
  return response.json();
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.stations)) return data.stations;
  return null;
}

function asTimeline(data) {
  if (!data || typeof data !== "object") return null;
  if (data.priceTimeline && typeof data.priceTimeline === "object") return data.priceTimeline;
  return data;
}

function asPriceReference(data) {
  if (!data || typeof data !== "object") return null;
  if (data.priceReference && typeof data.priceReference === "object") return data.priceReference;
  return null;
}

function normalizeStation(raw) {
  const brand = String(raw.brand ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const city = String(raw.city ?? "").trim();
  const province = String(raw.province ?? "").trim();
  const fuels = Array.isArray(raw.fuels) ? raw.fuels.map((f) => String(f).trim()).filter(Boolean) : [];
  if (!brand || !name || fuels.length === 0) return null;
  return { brand, name, city, province, fuels };
}

function normalizeStations(list) {
  const dedupe = new Set();
  const result = [];
  for (const item of list) {
    const normalized = normalizeStation(item);
    if (!normalized) continue;
    const key = `${normalizeText(normalized.brand)}|${normalizeText(normalized.name)}|${normalizeText(normalized.city)}|${normalizeText(normalized.province)}`;
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    result.push(normalized);
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeTimeline(rawTimeline) {
  const timeline = {};
  for (const [brand, points] of Object.entries(rawTimeline || {})) {
    if (!Array.isArray(points)) continue;
    const normalizedPoints = points
      .map((point) => {
        const date = String(point.date ?? "").trim();
        const prices = {};
        for (const [fuel, value] of Object.entries(point.prices || {})) {
          const num = Number(value);
          if (Number.isFinite(num) && num > 0) prices[String(fuel).trim()] = num;
        }
        if (!date || Object.keys(prices).length === 0) return null;
        return { date, prices };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (normalizedPoints.length) timeline[brand] = normalizedPoints;
  }
  return timeline;
}

function normalizePriceReference(raw) {
  const local = Array.isArray(raw?.local)
    ? raw.local
      .map((item) => {
        const province = String(item?.province ?? "").trim();
        const city = String(item?.city ?? "").trim();
        const brand = String(item?.brand ?? "").trim();
        const fuel = String(item?.fuel ?? "").trim();
        const date = parseDateIso(item?.date);
        const price = Number(item?.price);
        const count = Number(item?.count);
        if (!province || !city || !brand || !fuel || !date || !Number.isFinite(price) || price <= 0) return null;
        return { province, city, brand, fuel, date, price, count: Number.isFinite(count) && count > 0 ? Math.round(count) : 1 };
      })
      .filter(Boolean)
    : [];

  const brand = Array.isArray(raw?.brand)
    ? raw.brand
      .map((item) => {
        const brandLabel = String(item?.brand ?? "").trim();
        const fuel = String(item?.fuel ?? "").trim();
        const date = parseDateIso(item?.date);
        const price = Number(item?.price);
        const count = Number(item?.count);
        if (!brandLabel || !fuel || !date || !Number.isFinite(price) || price <= 0) return null;
        return { brand: brandLabel, fuel, date, price, count: Number.isFinite(count) && count > 0 ? Math.round(count) : 1 };
      })
      .filter(Boolean)
    : [];

  const latestDate = parseDateIso(raw?.meta?.latestDate) || null;
  const cutoffDate = parseDateIso(raw?.meta?.cutoffDate) || null;
  const recencyDays = Number(raw?.meta?.recencyDays);

  return {
    meta: {
      latestDate,
      cutoffDate,
      recencyDays: Number.isFinite(recencyDays) && recencyDays > 0 ? Math.round(recencyDays) : null
    },
    local,
    brand
  };
}

function buildReferenceFromTimeline(timeline) {
  const latestByBrandFuel = new Map();

  Object.entries(timeline || {}).forEach(([brand, points]) => {
    if (!Array.isArray(points)) return;
    points.forEach((point) => {
      const date = parseDateIso(point?.date);
      if (!date) return;
      Object.entries(point?.prices || {}).forEach(([fuel, rawValue]) => {
        const price = Number(rawValue);
        if (!Number.isFinite(price) || price <= 0) return;
        const key = `${normalizeText(brand)}|${normalizeText(fuel)}`;
        const prev = latestByBrandFuel.get(key);
        if (!prev || date > prev.date) {
          latestByBrandFuel.set(key, { brand, fuel, price, date, count: 1 });
        }
      });
    });
  });

  const brand = Array.from(latestByBrandFuel.values()).sort((a, b) => {
    const br = a.brand.localeCompare(b.brand);
    if (br !== 0) return br;
    return a.fuel.localeCompare(b.fuel);
  });

  return {
    meta: { latestDate: null, cutoffDate: null, recencyDays: null },
    local: [],
    brand
  };
}

async function resolveCatalog() {
  const stationsUrl = process.env.STATIONS_SOURCE_URL?.trim();
  const timelineUrl = process.env.PRICES_SOURCE_URL?.trim();
  const officialCsvUrl =
    process.env.OFFICIAL_CSV_URL?.trim() ||
    process.env.VIGENTES_CSV_URL?.trim() ||
    process.env.HISTORICAL_CSV_URL?.trim() ||
    DEFAULT_VIGENTES_CSV_URL ||
    DEFAULT_OFFICIAL_CSV_URL;
  const timelineMonths = Number(process.env.TIMELINE_MONTHS || 18);
  const recencyDays = Number(process.env.RECENCY_DAYS || 45);

  if (officialCsvUrl) {
    try {
      log(`Descargando CSV oficial: ${officialCsvUrl}`);
      const csvText = await fetchText(officialCsvUrl);
      const csvRows = parseCsv(csvText);
      const official = buildFromHistoricalCsv(csvRows, timelineMonths, recencyDays);
      if (official && official.stations.length > 100) {
        log(`Catalogo oficial generado desde CSV. Estaciones: ${official.stations.length}.`);
        return {
          updatedAt: new Date().toISOString(),
          source: officialCsvUrl,
          stations: normalizeStations(official.stations),
          priceTimeline: normalizeTimeline(official.priceTimeline),
          priceReference: normalizePriceReference(official.priceReference)
        };
      }
      log(`CSV oficial procesado pero con pocos registros validos. Se usara fallback.`);
    } catch (error) {
      log(`No se pudo usar CSV oficial: ${error.message}. Se intentan fuentes alternativas.`);
    }
  }

  let stations = DEFAULT_STATIONS;
  let timeline = DEFAULT_TIMELINE;
  let priceReference = null;
  let source = "default-seed";

  if (stationsUrl) {
    try {
      const stationsPayload = await fetchJson(stationsUrl);
      const parsedStations = asArray(stationsPayload);
      if (parsedStations) {
        stations = parsedStations;
        source = stationsUrl;
      }
    } catch (error) {
      log(`No se pudo descargar estaciones JSON: ${error.message}.`);
    }
  }

  if (timelineUrl) {
    try {
      const timelinePayload = await fetchJson(timelineUrl);
      const parsedTimeline = asTimeline(timelinePayload);
      if (parsedTimeline) {
        timeline = parsedTimeline;
        source = source === "default-seed" ? timelineUrl : `${source} + ${timelineUrl}`;
      }
      const parsedReference = asPriceReference(timelinePayload);
      if (parsedReference) {
        priceReference = parsedReference;
      }
    } catch (error) {
      log(`No se pudo descargar timeline JSON: ${error.message}.`);
    }
  }

  const normalizedTimeline = normalizeTimeline(timeline);
  const normalizedReference = normalizePriceReference(priceReference || buildReferenceFromTimeline(normalizedTimeline));

  return {
    updatedAt: new Date().toISOString(),
    source,
    stations: normalizeStations(stations),
    priceTimeline: normalizedTimeline,
    priceReference: normalizedReference
  };
}

async function writeOutputs(payload) {
  await mkdir(REPO_ROOT, { recursive: true });
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(JSON_OUTPUT, json, "utf8");

  const js = [
    `window.STATIONS_CATALOG = ${JSON.stringify(payload.stations, null, 2)};`,
    "",
    `window.STATION_PRICE_TIMELINE = ${JSON.stringify(payload.priceTimeline, null, 2)};`,
    "",
    `window.STATION_PRICE_REFERENCE = ${JSON.stringify(payload.priceReference, null, 2)};`,
    ""
  ].join("\n");
  await writeFile(JS_OUTPUT, js, "utf8");
}

async function main() {
  const payload = await resolveCatalog();
  await writeOutputs(payload);
  log(
    `Catalogo generado. Estaciones: ${payload.stations.length}. Marcas con timeline: ${Object.keys(payload.priceTimeline).length}.` +
    ` Referencias locales recientes: ${payload.priceReference.local.length}.`
  );
}

main().catch((error) => {
  console.error(`[update-stations] Error fatal: ${error.stack || error.message}`);
  process.exit(1);
});
