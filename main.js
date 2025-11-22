// js/main.js
//
// Loads world data, computes stats, initializes the DOM renderer
// and updates the HUD (depth, pressure, temp, etc.) based on the
// player's current position or clicked cell.

import { loadWorld } from "./worldLoader.js";
import {
  getCell,
  computeWorldStats,
} from "./worldApi.js";
import { initRenderer } from "./renderer.js";

// HUD elements
const depthEl = document.getElementById("hud-depth");
const pressureEl = document.getElementById("hud-pressure");
const tempEl = document.getElementById("hud-temp");
const healthEl = document.getElementById("hud-health");
const hungerEl = document.getElementById("hud-hunger");
const missionTextEl = document.getElementById("mission-text");

// Debug log
const logEl = document.getElementById("log");
function log(msg) {
  if (logEl) logEl.textContent += msg + "\n";
  else console.log(msg);
}

/**
 * Nicely format a number or show "N/A".
 */
function fmt(value, decimals = 2, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `N/A${suffix}`;
  }
  return `${Number(value).toFixed(decimals)}${suffix}`;
}

/**
 * Update HUD based on the cell the player is currently in.
 */
function updateHUDFromCell(cell, playerState) {
  depthEl.textContent = fmt(cell.depth_m, 1, "m");
  pressureEl.textContent = fmt(cell.pressure_atm, 1, " atm");
  tempEl.textContent = fmt(cell.temperature_c, 2, "°C");

  // For now, keep health/hunger static. Later, gameplay can modify these.
  healthEl.textContent = `${playerState.health}%`;
  hungerEl.textContent = `${playerState.hunger}%`;
}

// Main async setup
(async () => {
  try {
    log("Loading Abyssal World...");
    const { world, metadata } = await loadWorld();
    const stats = computeWorldStats(world);
    log("World loaded!");

    log(`Grid size: ${metadata.grid.rows} × ${metadata.grid.cols}`);
    log(`Biomes from metadata: ${metadata.biomes.join(", ")}`);
    log("\nWorld stats:");
    log(JSON.stringify(stats, null, 2));

    // Initial player state (center of the map)
    const mid = Math.floor(metadata.grid.rows / 2);
    const playerState = {
      row: mid,
      col: mid,
      health: 100,
      hunger: 100,
    };

    // Renderer draws the grid and shows submarine + hazards + POIs
    const renderer = initRenderer(world, metadata, stats, {
      playerState,
      onCellSelected: (cell, row, col) => {
        // When user clicks a tile, move player there and update HUD
        playerState.row = row;
        playerState.col = col;
        updateHUDFromCell(cell, playerState);
        renderer.setPlayerPosition(row, col);
      },
    });

    // On startup, initialize HUD using the center cell
    const startCell = getCell(world, playerState.row, playerState.col);
    updateHUDFromCell(startCell, playerState);

    // Simple movement controls (we'll keep it basic for now)
    document.getElementById("btn-up").addEventListener("click", () => {
      if (playerState.row > 0) {
        playerState.row -= 1;
        const cell = getCell(world, playerState.row, playerState.col);
        updateHUDFromCell(cell, playerState);
        renderer.setPlayerPosition(playerState.row, playerState.col);
      }
    });

    document.getElementById("btn-down").addEventListener("click", () => {
      if (playerState.row < metadata.grid.rows - 1) {
        playerState.row += 1;
        const cell = getCell(world, playerState.row, playerState.col);
        updateHUDFromCell(cell, playerState);
        renderer.setPlayerPosition(playerState.row, playerState.col);
      }
    });

    document.getElementById("btn-left").addEventListener("click", () => {
      if (playerState.col > 0) {
        playerState.col -= 1;
        const cell = getCell(world, playerState.row, playerState.col);
        updateHUDFromCell(cell, playerState);
        renderer.setPlayerPosition(playerState.row, playerState.col);
      }
    });

    document.getElementById("btn-right").addEventListener("click", () => {
      if (playerState.col < metadata.grid.cols - 1) {
        playerState.col += 1;
        const cell = getCell(world, playerState.row, playerState.col);
        updateHUDFromCell(cell, playerState);
        renderer.setPlayerPosition(playerState.row, playerState.col);
      }
    });

    // BONUS: also let arrow keys move the sub
    window.addEventListener("keydown", (e) => {
      let moved = false;
      if (e.key === "ArrowUp" && playerState.row > 0) {
        playerState.row -= 1;
        moved = true;
      } else if (e.key === "ArrowDown" && playerState.row < metadata.grid.rows - 1) {
        playerState.row += 1;
        moved = true;
      } else if (e.key === "ArrowLeft" && playerState.col > 0) {
        playerState.col -= 1;
        moved = true;
      } else if (e.key === "ArrowRight" && playerState.col < metadata.grid.cols - 1) {
        playerState.col += 1;
        moved = true;
      }

      if (moved) {
        const cell = getCell(world, playerState.row, playerState.col);
        updateHUDFromCell(cell, playerState);
        renderer.setPlayerPosition(playerState.row, playerState.col);
        e.preventDefault();
      }
    });

  } catch (err) {
    console.error(err);
    log("ERROR: " + err.message);
  }
})();
