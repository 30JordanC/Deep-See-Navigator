const FACTS = {
    vent: [
        "Hydrothermal vents can exceed 400°C...",
        "Vents support unique bacteria that use chemosynthesis..."
    ],
    predator: [
        "Apex predators often rely on low-light ambush hunting...",
        "Some predators track electrical signals emitted by prey..."
    ],
    coral: [
        "Deep sea corals grow extremely slowly, often less than 1 cm per year..."
    ],
    trench: [
        "Trenches reach pressures above 1000 atmospheres..."
    ]
};

function AI_fact(type) {
    if (!FACTS[type]) return;
    const list = FACTS[type];
    const randomFact = list[Math.floor(Math.random() * list.length)];
    AI.say(randomFact, 5000);
}
