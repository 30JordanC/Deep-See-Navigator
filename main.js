// js/main.js
//
// Loads world data, initializes renderer, handles movement,
// HUD updates, AI assistant, biome facts, and mission logic.
// No scanning mechanic: missions complete based purely on movement & environment.

import { loadWorld } from "./worldLoader.js";
import { getCell, computeWorldStats } from "./worldApi.js";
import { initRenderer } from "./renderer.js";

// HUD elements
const depthEl = document.getElementById("hud-depth");
const pressureEl = document.getElementById("hud-pressure");
const tempEl = document.getElementById("hud-temp");
const healthEl = document.getElementById("hud-health");
const hungerEl = document.getElementById("hud-hunger");

// Debug log
const logEl = document.getElementById("log");
function log(msg) {
  if (logEl) logEl.textContent += msg + "\n";
  else console.log(msg);
}

// Globals from non-module scripts
const AI = window.AI;
const MISSIONS = window.MISSIONS || [];
const UI_init = window.UI_init;
const UI_missionSuccess = window.UI_missionSuccess;
const UI_missionFail = window.UI_missionFail;
const checkBiomeFacts = window.checkBiomeFacts;

// Game state
let world = null;
let metadata = null;
let stats = null;
let renderer = null;

const playerState = {
  row: 0,
  col: 0,
  health: 100,
  hunger: 100,
};

// Mission runtime state
let activeMission = null;
let missionTimerId = null;
let missionTimeRemaining = 0;

/*-------------------------------------------
  Helper: format nicely for HUD
-------------------------------------------*/
function fmt(value, decimals = 2, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return `N/A${suffix}`;
  }
  return `${Number(value).toFixed(decimals)}${suffix}`;
}

/*-------------------------------------------
  HUD update based on current cell
-------------------------------------------*/
function updateHUDFromCell(cell) {
  depthEl.textContent = fmt(cell.depth_m, 1, " m");
  pressureEl.textContent = fmt(cell.pressure_atm, 1, " atm");
  tempEl.textContent = fmt(cell.temperature_c, 2, " °C");

  healthEl.textContent = `${playerState.health}%`;
  hungerEl.textContent = `${playerState.hunger}%`;
}

/*-------------------------------------------
  Hazards: warn via AI
-------------------------------------------*/
function handleHazards(cell) {
  if (!cell.hazards || cell.hazards.length === 0) return;

  cell.hazards.forEach(h => {
    const type = h.type || h.hazard_type || h;
    AI.hazardWarning(type);
  });
}

/*-------------------------------------------
  MISSION ENGINE
-------------------------------------------*/
function startMissionLogic(mission) {
  // Clone mission into activeMission and add runtime data
  activeMission = {
    ...mission,
    visitedPOIs: new Set(),      // for multi_poi
    visitedHazards: new Set(),   // for visit_hazards
    startTime: performance.now()
  };

  // Reset timer
  if (missionTimerId) {
    clearInterval(missionTimerId);
    missionTimerId = null;
  }

  missionTimeRemaining = mission.timeLimit || 0;

  if (mission.timeLimit) {
    missionTimerId = setInterval(() => {
      missionTimeRemaining -= 1;
      if (missionTimeRemaining <= 0) {
        completeMission(false);
      }
    }, 1000);
  }

  log(`Mission started: ${mission.title}`);
}

/**
 * Called when a mission completes or fails.
 */
function completeMission(success) {
  if (!activeMission) return;

  if (missionTimerId) {
    clearInterval(missionTimerId);
    missionTimerId = null;
  }

  if (success) {
    UI_missionSuccess && UI_missionSuccess();
  } else {
    UI_missionFail && UI_missionFail();
  }

  log(`Mission ${success ? "success" : "failed"}: ${activeMission.title}`);
  activeMission = null;
}

/**
 * Returns a simple key for position-based tracking.
 */
function posKey(row, col) {
  return `${row},${col}`;
}

/**
 * Called EVERY TIME the player moves into a new cell.
 * All mission logic is based on the data in that cell.
 */
function checkMissionProgress(cell) {
  if (!activeMission) return;

  switch (activeMission.type) {
    // Mission 1: reach any POI once
    case "reach_poi": {
      if (cell.poi && cell.poi.length > 0) {
        completeMission(true);
      }
      break;
    }

    // Mission 2: visit N distinct POI tiles
    case "multi_poi": {
      const required = activeMission.targetCount || 3;
      if (cell.poi && cell.poi.length > 0) {
        const key = posKey(playerState.row, playerState.col);
        if (!activeMission.visitedPOIs.has(key)) {
          activeMission.visitedPOIs.add(key);
          log(`Visited POIs: ${activeMission.visitedPOIs.size}/${required}`);
          if (activeMission.visitedPOIs.size >= required) {
            completeMission(true);
          }
        }
      }
      break;
    }

    // Mission 3: reach a depth threshold
    case "reach_depth": {
      const targetDepth = activeMission.targetDepth || 6000;
      if (cell.depth_m >= targetDepth) {
        completeMission(true);
      }
      break;
    }

    // Mission 4: reach a pressure threshold
    case "reach_pressure": {
      const targetPressure = activeMission.targetPressure || 500;
      if (cell.pressure_atm >= targetPressure) {
        completeMission(true);
      }
      break;
    }

    // Mission 5: step into N distinct hazard tiles
    case "visit_hazards": {
      const requiredHazards = activeMission.targetCount || 3;
      if (cell.hazards && cell.hazards.length > 0) {
        const key = posKey(playerState.row, playerState.col);
        if (!activeMission.visitedHazards.has(key)) {
          activeMission.visitedHazards.add(key);
          log(`Visited hazards: ${activeMission.visitedHazards.size}/${requiredHazards}`);
          if (activeMission.visitedHazards.size >= requiredHazards) {
            completeMission(true);
          }
        }
      }
      break;
    }

    default:
      break;
  }
}

// Expose to UI.js
window.startMissionLogic = startMissionLogic;

/**
 * Compute the extra tile movement caused by currents in the cell we are leaving.
 * Uses currents.csv fields: u_mps (east/west) and v_mps (north/south).
 *
 * Convention:
 *  - row increases as you go DOWN
 *  - col increases as you go RIGHT
 *
 *  u_mps > 0 → push east  (right, col+1)
 *  u_mps < 0 → push west  (left, col-1)
 *  v_mps > 0 → push south (down, row+1)
 *  v_mps < 0 → push north (up, row-1)
 */
function getCurrentDelta(cell) {
  if (!cell) return { dRowExtra: 0, dColExtra: 0 };

  const u = Number(cell.u_mps) || 0;
  const v = Number(cell.v_mps) || 0;

  // Threshold so tiny currents don't move the sub
  const threshold = 0.2;

  let dRowExtra = 0;
  let dColExtra = 0;

  if (v > threshold) dRowExtra = 1;      // push down (south)
  if (v < -threshold) dRowExtra = -1;    // push up (north)

  if (u > threshold) dColExtra = 1;      // push right (east)
  if (u < -threshold) dColExtra = -1;    // push left (west)

  return { dRowExtra, dColExtra };
}


/*-------------------------------------------
  MOVEMENT
-------------------------------------------*/

function movePlayer(dRowInput, dColInput) {
  const currentCell = getCell(world, playerState.row, playerState.col);

  // base movement (player input)
  let dRow = dRowInput;
  let dCol = dColInput;

  // current from the tile you are leaving
  const { dRowExtra, dColExtra } = getCurrentDelta(currentCell);
  dRow += dRowExtra;
  dCol += dColExtra;

  const newRow = playerState.row + dRow;
  const newCol = playerState.col + dCol;

  // bounds check
  if (
    newRow < 0 ||
    newCol < 0 ||
    newRow >= metadata.grid.rows ||
    newCol >= metadata.grid.cols
  ) return;

  // commit movement
  playerState.row = newRow;
  playerState.col = newCol;

  const cell = getCell(world, newRow, newCol);
  updateHUDFromCell(cell);
  renderer.setPlayerPosition(newRow, newCol);

  handleHazards(cell);
  if (checkBiomeFacts) checkBiomeFacts(world, newRow, newCol);
  checkMissionProgress(cell);
}


/*-------------------------------------------
  MAIN STARTUP
-------------------------------------------*/
(async () => {
  try {
    // Init AI + UI
    AI.init();
    UI_init && UI_init();

    log("Loading Abyssal World...");
    const loaded = await loadWorld();
    world = loaded.world;
    metadata = loaded.metadata;

    stats = computeWorldStats(world);
    log("World loaded!");
    log(`Grid size: ${metadata.grid.rows} × ${metadata.grid.cols}`);
    log(`Biomes: ${metadata.biomes.join(", ")}`);
    log("\nWorld stats:");
    log(JSON.stringify(stats, null, 2));

    // Start player in center
    const mid = Math.floor(metadata.grid.rows / 2);
    playerState.row = mid;
    playerState.col = mid;

    // Init renderer
    renderer = initRenderer(world, metadata, stats, {
      playerState,
      onCellSelected: (cell, row, col) => {
        playerState.row = row;
        playerState.col = col;
        updateHUDFromCell(cell);
        renderer.setPlayerPosition(row, col);
        handleHazards(cell);
        if (checkBiomeFacts) checkBiomeFacts(world, row, col);
        checkMissionProgress(cell);
      },
    });

    const startCell = getCell(world, playerState.row, playerState.col);
    updateHUDFromCell(startCell);

    // Movement controls
    document.getElementById("btn-up").addEventListener("click", () => {
      movePlayer(-1, 0);
    });
    document.getElementById("btn-down").addEventListener("click", () => {
      movePlayer(1, 0);
    });
    document.getElementById("btn-left").addEventListener("click", () => {
      movePlayer(0, -1);
    });
    document.getElementById("btn-right").addEventListener("click", () => {
      movePlayer(0, 1);
    });

    // Keyboard controls: arrows + WASD
    window.addEventListener("keydown", (e) => {
      let moved = false;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        movePlayer(-1, 0);
        moved = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        movePlayer(1, 0);
        moved = true;
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        movePlayer(0, -1);
        moved = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        movePlayer(0, 1);
        moved = true;
      }

      if (moved) {
        e.preventDefault();
      }
    });

    // UI_init already shows mission select overlay with 5 missions.
    // Player will choose one; UI_startMission -> startMissionLogic.

  } catch (err) {
    console.error(err);
    log("ERROR: " + err.message);
  }
})();
