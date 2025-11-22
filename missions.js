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

