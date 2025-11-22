import { Submarine } from "./submarine.js";
import { render } from "../render/render.js";

export const gameState = {
    sub: new Submarine(25, 25), // start in middle of screen
};

export function initGame() {
    setupControls();
    gameLoop();
}

function setupControls() {
    window.addEventListener("keydown", e => {
        const { sub } = gameState;

        if (e.key === "ArrowUp" || e.key === "w") sub.move(0, -1);
        if (e.key === "ArrowDown" || e.key === "s") sub.move(0, 1);
        if (e.key === "ArrowLeft" || e.key === "a") sub.move(-1, 0);
        if (e.key === "ArrowRight" || e.key === "d") sub.move(1, 0);

        render.update(gameState);
    });
}

function gameLoop() {
    render.update(gameState);
    requestAnimationFrame(gameLoop);
}

document.getElementById("hintButton").addEventListener("click", () => {
    const mission = MISSIONS[currentMissionIndex];
    if (mission && mission.hintAI) {
        AI.hint(mission.hintAI);
    } else {
        AI.say("No hint available.");
    }
});

window.addEventListener("DOMContentLoaded", () => {
    AI.init();
    UI_init();
});

