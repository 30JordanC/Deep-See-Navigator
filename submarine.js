// submarine.js

export class Submarine {
	constructor(startRow, startCol) {
		this.row = startRow;
		this.col = startCol;

		this.health = 100;
		this.hunger = 100;   // optional
		this.speed = 1;      // moves 1 tile per key press

		this.maxHealth = 100;
	}

	move(dx, dy, world) {
		const newRow = this.row + dy;
		const newCol = this.col + dx;

		// stay inside map boundaries
		if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) {
			return;
		}

		this.row = newRow;
		this.col = newCol;

		// currents push after movement
		const cell = world.getCell(newRow, newCol);
		if (cell.current) {
			this.row += cell.current.dy;
			this.col += cell.current.dx;
		}
	}

	applyDamage(amount) {
		this.health = Math.max(0, this.health - amount);
	}

	isDead() {
		return this.health <= 0;
	}
}

