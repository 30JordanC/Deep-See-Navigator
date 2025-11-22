// --- simple CSV parser (no quotes support) ---
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(",");
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx] !== undefined ? cols[idx].trim() : "";
    });
    rows.push(obj);
  }
  return rows;
}

// --- load a text file ---
async function loadText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.text();
}

// --- load metadata.json ---
async function loadMetadata() {
  const res = await fetch("data/metadata.json");
  if (!res.ok) throw new Error("Failed to load metadata.json");
  return await res.json();
}

// --- main entry ---
export async function loadWorld() {
  const metadata = await loadMetadata();
  const rows = metadata.grid.rows;  // should be 50
  const cols = metadata.grid.cols;  // should be 50

  // initialize world array
  const world = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      depth_m: null,
      pressure_atm: null,
      biome: null,
      temperature_c: null,
      light_intensity: null,
      terrain_roughness: null,
      x_km: null,
      y_km: null,
      lat: null,
      lon: null,

      current: null,
      hazards: [],
      corals: null,
      resources: [],
      life: [],
      poi: []
    }))
  );

  // ---- CELLS CSV ----
  {
    const text = await loadText("data/cells.csv");
    const rowsArr = parseCSV(text);

    for (const row of rowsArr) {
      const r = parseInt(row.row);
      const c = parseInt(row.col);
      const cell = world[r][c];

      cell.x_km = parseFloat(row.x_km);
      cell.y_km = parseFloat(row.y_km);
      cell.lat = parseFloat(row.lat);
      cell.lon = parseFloat(row.lon);
      cell.depth_m = parseFloat(row.depth_m);
      cell.pressure_atm = parseFloat(row.pressure_atm);
      cell.biome = row.biome;
      cell.temperature_c = parseFloat(row.temperature_c);
      cell.light_intensity = parseFloat(row.light_intensity);
      cell.terrain_roughness = parseFloat(row.terrain_roughness);
    }
  }

  // ---- CURRENTS CSV ----
  {
    const text = await loadText("data/currents.csv");
    const rowsArr = parseCSV(text);

    for (const row of rowsArr) {
      const r = parseInt(row.row);
      const c = parseInt(row.col);
      const cell = world[r][c];

      cell.current = {
        u_mps: parseFloat(row.u_mps),
        v_mps: parseFloat(row.v_mps),
        speed_mps: parseFloat(row.speed_mps),
        stability: row.stability
      };
    }
  }

  // ---- HAZARDS CSV ----
  {
    const text = await loadText("data/hazards.csv");
    const rowsArr = parseCSV(text);

    for (const row of rowsArr) {
      const r = parseInt(row.row);
      const c = parseInt(row.col);
      const cell = world[r][c];

      cell.hazards.push({
        type: row.type,
        severity: parseInt(row.severity),
        notes: row.notes
      });
    }
  }

  // ---- CORALS CSV ----
  {
    const text = await loadText("data/corals.csv");
    const rowsArr = parseCSV(text);

    for (const row of rowsArr) {
      const r = parseInt(row.row);
      const c = parseInt(row.col);
      const cell = world[r][c];

      cell.corals = {
        coral_cover_pct: parseFloat(row.coral_cover_pct),
        health_index: parseFloat(row.health_index),
        bleaching_risk: parseFloat(row.bleaching_risk),
        biodiversity_index: parseFloat(row.biodiversity_index)
      };
    }
  }

  // ---- RESOURCES CSV ----
  {
    const text = await loadText("data/resources.csv");
    const rowsArr = parseCSV(text);

    for (const row of rowsArr) {
      const r = parseInt(row.row);
      const c = parseInt(row.col);
      const cell = world[r][c];

      cell.resources.push({
        family: row.family,
        type: row.type,
        abundance: parseFloat(row.abundance),
        purity: parseFloat(row.purity),
        extraction_difficulty: parseFloat(row.extraction_difficulty),
        environmental_impact: parseFloat(row.environmental_impact),
        economic_value: parseFloat(row.economic_value),
        description: row.description
      });
    }
  }

  // ---- LIFE CSV ----
  {
    const text = await loadText("data/life.csv");
    const rowsArr = parseCSV(text);

    for (const row of rowsArr) {
      const r = parseInt(row.row);
      const c = parseInt(row.col);
      const cell = world[r][c];

      cell.life.push({
        species: row.species,
        avg_depth_m: parseFloat(row.avg_depth_m),
        density: parseFloat(row.density),
        threat_level: parseInt(row.threat_level),
        behavior: row.behavior,
        trophic_level: parseInt(row.trophic_level),
        prey_species: row.prey_species ? row.prey_species.split(";") : []
      });
    }
  }

  // ---- POI CSV ----
  {
    const text = await loadText("data/poi.csv");
    const rowsArr = parseCSV(text);

    for (const row of rowsArr) {
      const r = parseInt(row.row);
      const c = parseInt(row.col);
      const cell = world[r][c];

      cell.poi.push({
        id: row.id,
        category: row.category,
        label: row.label,
        description: row.description,
        research_value: parseFloat(row.research_value)
      });
    }
  }

  return { world, metadata };
}
