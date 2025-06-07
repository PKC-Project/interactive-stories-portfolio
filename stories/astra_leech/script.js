// script.js for Astra Leech (vFinal - Minimalist & Melodic)

document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const uiContainer = document.getElementById('ui-container');
    const scoreDisplay = document.getElementById('score');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');

    const AMOEBA_PARTICLES = 60;
    const PLAYER_LEECH_RADIUS = 50;
    const PLAYER_COLLISION_RADIUS = 8;
    const PLAYER_LEECH_RATE = 0.1;

    let player, amoeba, stars, audioCtx, music;
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let gameState = 'menu';
    let score = 0;
    let animationFrameId;

    // --- REFINED Audio Engine ---
    const setupAudio = () => {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        music = createMusic();
    };

    function createMusic() {
        // The master gain now only processes effects, not constant music.
        const masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.4; // A good volume for effects
        masterGain.connect(audioCtx.destination);
        
        // A long, beautiful echo for our melodic notes
        const delay = audioCtx.createDelay(5.0);
        const feedback = audioCtx.createGain();
        feedback.gain.value = 0.7; // Strong feedback for a long tail
        delay.connect(feedback).connect(delay);
        delay.connect(masterGain);

        return { gain: masterGain, delay };
    }

    function playLeechSound() {
        if (!music || audioCtx.state === 'suspended') return;
        
        const scale = [329.63, 392.00, 440.00, 523.25, 659.25]; // E, G, A, C, E
        const now = audioCtx.currentTime;
        
        // Create a richer sound with two oscillators
        const fundamentalFreq = scale[Math.floor(Math.random() * scale.length)];
        const overtoneFreq = fundamentalFreq * 2;

        [fundamentalFreq, overtoneFreq].forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            osc.connect(gain).connect(music.delay); // Connect to the echo
            
            const attackTime = 0.01;
            const decayTime = 1.5;
            const initialGain = index === 0 ? 0.2 : 0.1; // Overtone is quieter

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(initialGain, now + attackTime);
            gain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);
            
            osc.start(now);
            osc.stop(now + decayTime);
        });
    }
    
    // --- Classes ---
    class Player {
        constructor(x, y) { this.x = x; this.y = y; this.radius = PLAYER_COLLISION_RADIUS; }
        update(mouse) { this.x += (mouse.x - this.x) * 0.1; this.y += (mouse.y - this.y) * 0.1; }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const color = getComputedStyle(document.documentElement).getPropertyValue('--player-color');
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 25;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    class AmoebaParticle {
        constructor(x, y) {
            this.x = x; this.y = y; this.vx = 0; this.vy = 0;
            this.radius = Math.random() * 5 + 5;
            // Each particle gets its own base color!
            this.baseHue = 200 + Math.random() * 100;
        }
        update(attractionPoint, attractionForce, time) {
            const dx = attractionPoint.x - this.x; const dy = attractionPoint.y - this.y;
            this.vx += dx * attractionForce; this.vy += dy * attractionForce;
            const angle = Math.atan2(dy, dx);
            this.vx += Math.cos(angle + time * 0.01) * 0.05; this.vy += Math.sin(angle + time * 0.01) * 0.05;
            this.vx *= 0.95; this.vy *= 0.95;
            this.x += this.vx; this.y += this.vy;
        }
        draw(ctx) {
            // Color is now dynamic based on speed
            const speed = Math.sqrt(this.vx**2 + this.vy**2);
            const hue = (this.baseHue + speed * 10) % 360;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.1)`;
            ctx.fill();
        }
    }

    class Amoeba {
        constructor(x, y, numParticles) {
            this.x = x; this.y = y; this.particles = []; this.aggression = 0;
            for (let i = 0; i < numParticles; i++) {
                const angle = Math.random() * Math.PI * 2; const radius = Math.random() * 80;
                this.particles.push(new AmoebaParticle(this.x + Math.cos(angle) * radius, this.y + Math.sin(angle) * radius));
            }
        }
        update(player, time) {
            this.x += (Math.random() - 0.5) * 0.2; this.y += (Math.random() - 0.5) * 0.2;
            const attractionForce = 0.0001 + this.aggression * 0.001;
            this.particles.forEach(p => p.update(player, attractionForce, time));
        }
        draw(ctx) {
            ctx.globalCompositeOperation = 'lighter';
            this.particles.forEach(p => p.draw(ctx));
            ctx.globalCompositeOperation = 'source-over';
        }
    }
    
    class Star {
        constructor(canvas) { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * 1.5 + 0.5; this.opacity = Math.random() * 0.5 + 0.2; this.flickerSpeed = Math.random() * 0.01; }
        update(time) { this.opacity = Math.max(0.1, Math.min(0.8, this.opacity + Math.sin(time * this.flickerSpeed) * 0.05)); }
        draw(ctx) { ctx.fillStyle = `rgba(255,255,255,${this.opacity})`; ctx.fillRect(this.x, this.y, this.size, this.size); }
    }

    // --- Game Loop ---
    let time = 0; let noteCooldown = 0;
    function gameLoop() {
        if (gameState !== 'playing') return;
        time++;
        
        ctx.fillStyle = 'rgba(10, 13, 20, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => { s.update(time); s.draw(ctx); });

        player.update(mouse);
        amoeba.update(player, time);
        
        let leechAmount = 0;
        for (const p of amoeba.particles) {
            const distSq = (p.x - player.x) ** 2 + (p.y - player.y) ** 2;
            if (distSq < (p.radius + player.radius) ** 2) {
                endGame();
                return;
            }
            if (distSq < PLAYER_LEECH_RADIUS * PLAYER_LEECH_RADIUS) {
                leechAmount++;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(player.x, player.y);
                ctx.strokeStyle = `hsla(145, 100%, 70%, 0.05)`; ctx.stroke();
            }
        }

        if (leechAmount > 0) {
            score += leechAmount * PLAYER_LEECH_RATE;
            amoeba.aggression = Math.min(1, amoeba.aggression + 0.001);
            if (time > noteCooldown) { playLeechSound(); noteCooldown = time + 15; } // Play notes less frequently
        } else {
            amoeba.aggression = Math.max(0, amoeba.aggression - 0.002);
        }

        amoeba.draw(ctx);
        player.draw(ctx);
        scoreDisplay.textContent = Math.floor(score);
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // --- Setup and Control ---
    function init() {
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        player = new Player(window.innerWidth / 2, window.innerHeight / 2);
        amoeba = new Amoeba(Math.random() * canvas.width, Math.random() * canvas.height, AMOEBA_PARTICLES);
        stars = Array.from({ length: 200 }, () => new Star(canvas));
        
        score = 0;
        gameState = 'playing';
        gameOverScreen.classList.add('hidden');
        startScreen.classList.add('hidden');
        uiContainer.classList.add('visible');
        
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function endGame() {
        if (gameState === 'over') return;
        gameState = 'over';
        finalScoreDisplay.textContent = Math.floor(score);
        gameOverScreen.classList.remove('hidden');
        uiContainer.classList.remove('visible');
    }

    // --- Event Listeners for Mouse and Touch ---
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
    const updateMousePos = (e) => {
        const touch = e.touches ? e.touches[0] : e;
        mouse.x = touch.clientX; mouse.y = touch.clientY;
    };
    window.addEventListener('mousemove', updateMousePos);
    window.addEventListener('touchmove', (e) => { e.preventDefault(); updateMousePos(e); }, { passive: false });

    startScreen.addEventListener('click', () => { if (gameState === 'menu') { setupAudio(); init(); }});
    restartButton.addEventListener('click', init);
});