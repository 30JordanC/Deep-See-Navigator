// ui.js
// Handles UI updates: mission panel, hint button, mission selection screen (optional)

let currentMissionIndex = -1;

/*-------------------------------------------------------
    INITIALIZE UI
-------------------------------------------------------*/
function UI_init() {
    UI_setupHintButton();
    UI_setupMissionSelect();
}

/*-------------------------------------------------------
    UPDATE THE MISSION BOX
-------------------------------------------------------*/
function UI_updateMissionBox(mission) {
    const box = document.getElementById("missionText");
    if (!mission) {
        box.innerHTML = "<em>No mission active.</em>";
        return;
    }
    box.textContent = mission.description;
}

/*-------------------------------------------------------
    START A MISSION
-------------------------------------------------------*/
function UI_startMission(id) {
    const mission = MISSIONS.find(m => m.id === id);

    if (!mission) {
        console.error("Mission not found:", id);
        return;
    }

    // Set active mission index
    currentMissionIndex = MISSIONS.indexOf(mission);

    // Update UI
    UI_updateMissionBox(mission);

    // Trigger AI intro
    AI.missionStart(mission);

    // Tell gameplay logic to begin tracking
    if (typeof startMissionLogic === "function") {
        startMissionLogic(mission);
    }

    // Hide mission select overlay (if used)
    const screen = document.getElementById("missionSelectScreen");
    if (screen) screen.style.display = "none";
}

/*-------------------------------------------------------
    SETUP HINT BUTTON
-------------------------------------------------------*/
function UI_setupHintButton() {
    const btn = document.getElementById("hintButton");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (currentMissionIndex === -1) {
            AI.say("No mission active.");
            return;
        }

        const mission = MISSIONS[currentMissionIndex];
        if (mission.hintAI) {
            AI.hint(mission.hintAI);
        } else {
            AI.say("No hint available for this mission.");
        }
    });
}

/*-------------------------------------------------------
    OPTIONAL: MISSION SELECT SCREEN (UI ONLY)
-------------------------------------------------------*/
function UI_setupMissionSelect() {
    const container = document.getElementById("missionSelectScreen");
    if (!container) return;

    MISSIONS.forEach(mission => {
        const btn = document.createElement("button");
        btn.textContent = mission.title;
        btn.className = "mission-btn";

        btn.addEventListener("click", () => {
            UI_startMission(mission.id);
        });

        container.appendChild(btn);
    });
}

/*-------------------------------------------------------
    FINISH / SUCCESS / FAIL
-------------------------------------------------------*/
function UI_missionSuccess() {
    const mission = MISSIONS[currentMissionIndex];
    AI.missionSuccess(mission);
}

function UI_missionFail() {
    const mission = MISSIONS[currentMissionIndex];
    AI.missionFail(mission);
}
