// js/renderer.js
//
// Renders the world as a grid of <div> tiles (no canvas).
// - Colors each tile by biome
// - Adds hazard border if the cell has hazards
// - Shows a POI icon if the cell has a POI
// - Shows a submarine emoji at the player's position
// - Lets main.js know which cell was clicked

let worldRef = null;
let metadataRef = null;
let statsRef = null;
let playerRef = null;       // reference to player state { row, col, health, hunger }

let gameContainerEl = null;
let onCellSelectedHook = null;

/**
 * Initialize the DOM renderer.
 *
 * @param {Array<Array<Object>>} world
 * @param {Object} metadata
 * @param {Object} stats
 * @param {Object} options   e.g. { playerState, onCellSelected }
 */
export function initRenderer(world, metadata, stats, options = {}) {
  worldRef = world;
  metadataRef = metadata;
  statsRef = stats;
  playerRef = options.playerState || { row: 0, col: 0, health: 100, hunger: 100 };
  onCellSelectedHook = options.onCellSelected || null;

  gameContainerEl = document.getElementById("game-container");

  renderGrid();

  // Return small API so main.js can move player and re-render
  return {
    rerender: renderGrid,
    setPlayerPosition(row, col) {
      playerRef.row = row;
      playerRef.col = col;
      renderGrid();
    },
  };
}

/**
 * Render the full 50x50 grid as rows of .map-row and .map-tile DIVs.
 * Right now we show the entire world; later you could implement a viewport.
 */
function renderGrid() {
  const rows = metadataRef.grid.rows;
  const cols = metadataRef.grid.cols;

  // Clear old contents
  gameContainerEl.innerHTML = "";

  for (let r = 0; r < rows; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "map-row";

    for (let c = 0; c < cols; c++) {
      const cell = worldRef[r][c];

      const tileEl = document.createElement("div");
      tileEl.classList.add("map-tile");

      // Add biome class, e.g. biome-plain, biome-slope, etc.
      const biomeClass = biomeToClass(cell.biome);
      if (biomeClass) {
        tileEl.classList.add(biomeClass);
      }

      // If the tile contains any hazards, add a hazard class for red border
      if (cell.hazards && cell.hazards.length > 0) {
        tileEl.classList.add("hazard");
      }

      // If the tile has any POI entries, show a 📍 icon
      if (cell.poi && cell.poi.length > 0) {
        const poiIcon = document.createElement("span");
        poiIcon.className = "icon";
        poiIcon.textContent = "📍";
        tileEl.appendChild(poiIcon);
      }

      // If this tile is where the player currently is, show a submarine icon
      if (r === playerRef.row && c === playerRef.col) {
        const sub = document.createElement("div");
        sub.className = "submarine";
        sub.textContent = "🚢";
        tileEl.appendChild(sub);
      }

      // When the user clicks this tile, notify main.js so it can update HUD
      tileEl.addEventListener("click", () => {
        if (onCellSelectedHook) {
          onCellSelectedHook(cell, r, c);
        }
      });

      rowEl.appendChild(tileEl);
    }

    gameContainerEl.appendChild(rowEl);
  }
}

/**
 * Map biome string from CSV to a CSS class we defined in index.html.
 */
function biomeToClass(biome) {
  if (!biome) return null;
  switch (biome) {
    case "plain":
      return "biome-plain";
    case "slope":
      return "biome-slope";
    case "seamount":
      return "biome-seamount";
    case "trench":
      return "biome-trench";
    case "hydrothermal":
      return "biome-hydrothermal";
    default:
      return null;
  }
}
