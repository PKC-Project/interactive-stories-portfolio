// script.js for Newton's Sandbox

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('universe-canvas');
    const ctx = canvas.getContext('2d');
    const massSlider = document.getElementById('mass-slider');
    const massValue = document.getElementById('mass-value');
    const staticCheckbox = document.getElementById('static-checkbox');
    const trailsCheckbox = document.getElementById('trails-checkbox');
    const resetButton = document.getElementById('reset-button');

    // --- Simulation Constants ---
    // Barista's Note: This G is not the real one! It's tuned for a good-looking simulation.
    const G = 0.1;
    const MIN_DISTANCE_SQUARED = 25; // To prevent absurd forces at close range

    // --- State ---
    let bodies = [];
    let isDragging = false;
    let startDrag = { x: 0, y: 0 };
    let endDrag = { x: 0, y: 0 };

    // --- The Physics Body Class ---
    class CelestialBody {
        constructor(x, y, vx, vy, mass, isStatic) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.mass = mass;
            this.isStatic = isStatic;
            this.radius = Math.max(2, Math.pow(mass, 1/3) / 2); // Radius grows with mass
            this.color = `hsl(${200 + mass / 20}, 100%, 75%)`;
            this.trail = [];
        }

        applyForce(fx, fy) {
            if (this.isStatic) return;
            // a = F/m
            this.vx += fx / this.mass;
            this.vy += fy / this.mass;
        }

        updatePosition() {
            if (this.isStatic) return;
            this.x += this.vx;
            this.y += this.vy;
            
            // Add to trail
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > 100) {
                this.trail.shift();
            }
        }

        draw() {
            // Draw trail
            if (trailsCheckbox.checked && this.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.lineTo(this.trail[i].x, this.trail[i].y);
                }
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = 0.5;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            // Draw body
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // --- Simulation Loop ---
    function update() {
        // Calculate forces
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const bodyA = bodies[i];
                const bodyB = bodies[j];
                const dx = bodyB.x - bodyA.x;
                const dy = bodyB.y - bodyA.y;
                const distSq = Math.max(MIN_DISTANCE_SQUARED, dx * dx + dy * dy);
                const dist = Math.sqrt(distSq);
                
                const force = G * (bodyA.mass * bodyB.mass) / distSq;
                const forceX = force * (dx / dist);
                const forceY = force * (dy / dist);

                bodyA.applyForce(forceX, forceY);
                bodyB.applyForce(-forceX, -forceY);
            }
        }
        
        // Update positions
        bodies.forEach(body => body.updatePosition());
    }

    function draw() {
        // Fade effect for trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        bodies.forEach(body => body.draw());

        // Draw launch vector
        if (isDragging) {
            ctx.beginPath();
            ctx.moveTo(startDrag.x, startDrag.y);
            ctx.lineTo(endDrag.x, endDrag.y);
            ctx.strokeStyle = 'white';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    function mainLoop() {
        update();
        draw();
        requestAnimationFrame(mainLoop);
    }

    // --- Event Handlers & Initialization ---
    function resizeCanvas() {
        const container = document.getElementById('simulation-container');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    function init() {
        resizeCanvas();
        bodies = [];
        // Start with a central star for convenience
        const sun = new CelestialBody(canvas.width / 2, canvas.height / 2, 0, 0, 10000, true);
        bodies.push(sun);
    }

    massSlider.addEventListener('input', () => {
        massValue.textContent = massSlider.value;
    });

    resetButton.addEventListener('click', init);

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startDrag = { x: e.offsetX, y: e.offsetY };
        endDrag = { x: e.offsetX, y: e.offsetY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            endDrag = { x: e.offsetX, y: e.offsetY };
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            const vx = (e.offsetX - startDrag.x) * 0.1;
            const vy = (e.offsetY - startDrag.y) * 0.1;
            const mass = parseInt(massSlider.value, 10);
            const isStatic = staticCheckbox.checked;
            
            const newBody = new CelestialBody(startDrag.x, startDrag.y, vx, vy, mass, isStatic);
            bodies.push(newBody);
        }
    });

    window.addEventListener('resize', resizeCanvas);

    // --- Start the universe ---
    init();
    mainLoop();
});