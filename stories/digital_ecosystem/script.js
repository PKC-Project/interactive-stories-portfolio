// script.js for The Digital Ecosystem (v3 - Finely Tuned Balance)

document.addEventListener('DOMContentLoaded', () => {

    // --- Elements and Context ---
    const canvas = document.getElementById('pond-canvas');
    const toggleButton = document.getElementById('toggle-button');
    const resetButton = document.getElementById('reset-button');
    const svgNS = "http://www.w3.org/2000/svg";

    // --- Simulation Settings (v3 - Tuned for interesting cycles) ---
    const settings = {
        maxAlgae: 150,
        maxCritters: 30, // Slightly more room for critters
        maxPredators: 10,  // Slightly less room for predators
        
        // Barista's Note: The energy economy has been completely re-balanced.
        critter: {
            size: 5,
            speed: 0.8,
            energy: {
                initial: 1000,
                reproductionCost: 750, // Must eat ~3 algae to reproduce
                gainFromAlgae: 250,
                moveCost: 0.8,
                baseDecay: 0.5 // The "metabolism" cost of living per frame
            }
        },
        predator: {
            size: 8,
            speed: 1.1, // Clearly faster than critters
            energy: {
                initial: 1500,
                reproductionCost: 1400, // Must eat ~2 critters to reproduce
                gainFromCritter: 700, // High reward for a successful hunt
                moveCost: 1.2,
                baseDecay: 1.0 // Higher metabolism for a larger creature
            }
        },
        algae: {
            size: 3,
            reproductionRate: 0.0015 // A slightly more robust food source
        },
        
        initialCritters: 12,
        initialPredators: 3,
        
        colors: { critter: '#3a86ff', predator: '#d00000', algae: '#52b788' }
    };

    // --- State ---
    let algae = [], critters = [], predators = [];
    let animationFrameId;
    let isRunning = true;

    // --- Utility Functions ---
    const random = (min, max) => Math.random() * (max - min) + min;
    const distance = (a, b) => Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);

    // --- Agent Classes (Updated with new energy model) ---
    class Agent {
        constructor(x, y, size, color) {
            this.x = x; this.y = y; this.size = size; this.isDead = false;
            this.el = document.createElementNS(svgNS, 'circle');
            this.el.setAttribute('cx', this.x); this.el.setAttribute('cy', this.y);
            this.el.setAttribute('r', this.size); this.el.setAttribute('fill', color);
            canvas.appendChild(this.el);
        }
        update() { this.el.setAttribute('cx', this.x); this.el.setAttribute('cy', this.y); }
        die() { this.isDead = true; if (this.el.parentNode) canvas.removeChild(this.el); }
    }

    class Alga extends Agent {
        constructor(x, y) { super(x, y, settings.algae.size, settings.colors.algae); }
        update() {
            super.update();
            if (algae.length < settings.maxAlgae && Math.random() < settings.algae.reproductionRate) {
                algae.push(new Alga(this.x + random(-15, 15), this.y + random(-15, 15)));
            }
        }
    }

    class Critter extends Agent {
        constructor(x, y) {
            super(x, y, settings.critter.size, settings.colors.critter);
            this.energy = settings.critter.energy.initial;
            this.vx = random(-1, 1) * settings.critter.speed;
            this.vy = random(-1, 1) * settings.critter.speed;
        }
        move() {
            // Barista's Note: Apply base metabolism + movement cost.
            this.energy -= (settings.critter.energy.baseDecay + settings.critter.energy.moveCost);
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width.baseVal.value) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height.baseVal.value) this.vy *= -1;
        }
        eat(food) {
            food.die();
            algae.splice(algae.indexOf(food), 1);
            this.energy += settings.critter.energy.gainFromAlgae;
        }
        reproduce() {
            if (critters.length < settings.maxCritters && this.energy > settings.critter.energy.reproductionCost) {
                this.energy /= 2;
                critters.push(new Critter(this.x, this.y));
            }
        }
        update() {
            this.move();
            for (const alga of algae) {
                if (distance(this, alga) < this.size + alga.size) { this.eat(alga); break; }
            }
            this.reproduce();
            this.el.style.opacity = Math.max(0.1, this.energy / settings.critter.energy.initial);
            if (this.energy <= 0) this.die();
            super.update();
        }
    }

    class Predator extends Agent {
        constructor(x, y) {
            super(x, y, settings.predator.size, settings.colors.predator);
            this.energy = settings.predator.energy.initial;
            this.vx = random(-1, 1) * settings.predator.speed;
            this.vy = random(-1, 1) * settings.predator.speed;
        }
        move() {
            // Barista's Note: Higher metabolism and movement cost.
            this.energy -= (settings.predator.energy.baseDecay + settings.predator.energy.moveCost);
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width.baseVal.value) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height.baseVal.value) this.vy *= -1;
        }
        eat(prey) {
            prey.die();
            critters.splice(critters.indexOf(prey), 1);
            this.energy += settings.predator.energy.gainFromCritter;
        }
        reproduce() {
            if (predators.length < settings.maxPredators && this.energy > settings.predator.energy.reproductionCost) {
                this.energy /= 2;
                predators.push(new Predator(this.x, this.y));
            }
        }
        update() {
            this.move();
            for (const critter of critters) {
                if (distance(this, critter) < this.size + critter.size) { this.eat(critter); break; }
            }
            this.reproduce();
            this.el.style.opacity = Math.max(0.1, this.energy / settings.predator.energy.initial);
            if (this.energy <= 0) this.die();
            super.update();
        }
    }

    // --- Main Simulation Loop & Controls (Logic is the same, but the inputs are better) ---
    function simulationLoop() {
        if (!isRunning) return; // Guard clause
        predators.forEach(p => p.update());
        critters.forEach(c => c.update());
        algae.forEach(a => a.update());

        critters = critters.filter(c => !c.isDead);
        predators = predators.filter(p => !p.isDead);
        algae = algae.filter(a => !a.isDead);
        
        animationFrameId = requestAnimationFrame(simulationLoop);
    }
    
    function toggleSimulation() {
        isRunning = !isRunning;
        toggleButton.textContent = isRunning ? 'Stop' : 'Start';
        if (isRunning) {
            animationFrameId = requestAnimationFrame(simulationLoop);
        } else {
            cancelAnimationFrame(animationFrameId);
        }
    }
    
    function resetSimulation() {
        cancelAnimationFrame(animationFrameId);
        
        [...algae, ...critters, ...predators].forEach(agent => agent.die());
        algae = []; critters = []; predators = [];
        
        init();
        if (!isRunning) {
            isRunning = true;
            toggleButton.textContent = 'Stop';
        }
    }

    // --- Event Listeners ---
    canvas.addEventListener('click', (e) => {
        if (algae.length < settings.maxAlgae) {
            const rect = canvas.getBoundingClientRect();
            algae.push(new Alga(e.clientX - rect.left, e.clientY - rect.top));
        }
    });
    toggleButton.addEventListener('click', toggleSimulation);
    resetButton.addEventListener('click', resetSimulation);

    // --- Initialization ---
    function init() {
        for (let i = 0; i < settings.initialCritters; i++) {
            critters.push(new Critter(random(0, canvas.width.baseVal.value), random(0, canvas.height.baseVal.value)));
        }
        for (let i = 0; i < settings.initialPredators; i++) {
            predators.push(new Predator(random(0, canvas.width.baseVal.value), random(0, canvas.height.baseVal.value)));
        }
        animationFrameId = requestAnimationFrame(simulationLoop);
    }

    init();
});