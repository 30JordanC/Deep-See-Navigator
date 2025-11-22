// missions.js

export const missions = [
	{
		id: 1,
		description: "Find 3 hydrothermal vents",
		timeLimit: 120,
		ventsFound: 0,
		condition(world, sub) {
			const cell = world.getCell(sub.row, sub.col);
			if (cell.poi === "vent") {
				this.ventsFound++;
			}
			return this.ventsFound >= 3;
		}
	},

	{
		id: 2,
		description: "Reach the deep trench biome",
		timeLimit: 90,
		condition(world, sub) {
			return world.getBiome(sub.row, sub.col) === "trench";
		}
	}
];

/**
// missions.js

const MISSIONS = [

  {
    id: 1,
    title: "First Descent",
    description: "Navigate to the marked Point of Interest and scan it within 60 seconds.",
    type: "reach_and_scan",
    targetType: "poi",
    count: 1,
    timeLimit: 60,

    // What the mini AI assistant says based on games events.
    introAI: "Mission 1 active. We've detected an anomaly in this sector — possibly a shipwreck or mineral field. Move to the marker and perform a scan.",
    successAI: "Scan received. Excellent work on your first descent.",
    failureAI: "Mission failed. The scan was not completed in time.",
    hintAI: "POIs usually stand out on your sensors — try checking calmer regions with stable currents."
  },

  {
    id: 2,
    title: "Sea Ride",
    description: "Ride the strong current corridor and reach the exit safely.",
    type: "navigate_corridor",
    targetType: "exit",
    timeLimit: 90,

    introAI: "Mission 2 online. A strong current flows through this region — stay in control and let it carry you, but avoid being pushed into danger.",
    successAI: "Great navigation! Your trajectory through the current will assist future missions.",
    failureAI: "You were swept off course. Try adjusting your angle as the current shifts.",
    hintAI: "The current pushes hardest near its center — stick to the edges to maintain control."
  },

  {
    id: 3,
    title: "Vive Les Vents",
    description: "Locate and scan 3 hydrothermal vents.",
    type: "scan_hazard",
    targetType: "thermal_vent",
    count: 3,
    timeLimit: 150,

    introAI: "Mission 3 active. Hydrothermal vents detected. Be cautious — temperatures may exceed 400°C. Approach slowly and scan each vent.",
    successAI: "Vent data captured. These readings are incredibly valuable for deep-sea research.",
    failureAI: "Hull integrity compromised. Vent regions are extremely dangerous — keep your distance.",
    hintAI: "Vent clusters often appear near ridges or canyon edges — watch for pressure spikes."
  },

  {
    id: 4,
    title: "Apex Territory",
    description: "Escape the predator-dominated biome within 3 minutes.",
    type: "escape_zone",
    targetType: "predator_zone",
    timeLimit: 180,

    introAI: "Mission 4 online. Warning: You’ve drifted into an apex predator biome. Threat levels are high. Escape the region before the predators converge.",
    successAI: "You made it out. Your escape path will be logged for future submersible pilots.",
    failureAI: "Predator contact detected. Mission failed.",
    hintAI: "Predator zones often align with low-light, high-pressure areas. Move toward safer biomes like plains or slopes."
  }

]; **/


