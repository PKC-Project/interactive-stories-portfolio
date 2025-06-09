document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const canvas = document.getElementById('reaction-canvas');
    const ctx = canvas.getContext('2d');
    const heatSlider = document.getElementById('heat-slider');
    const flavorScoreDisplay = document.getElementById('flavor-score');
    const resetBtn = document.getElementById('reset-btn');

    // --- Core Simulation State ---
    let heatLevel = 0;
    let particles = [];
    let flavorScore = 0;
    let effects = []; // For temporary visuals like smoke

    // --- Procedural Audio Engine ---
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
            this.sizzleGain = null;
            this.sizzleFilter = null;
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const noiseSource = this.audioCtx.createBufferSource();
            const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 2, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            noiseSource.buffer = buffer;
            noiseSource.loop = true;
            this.sizzleFilter = this.audioCtx.createBiquadFilter();
            this.sizzleFilter.type = 'highpass';
            this.sizzleGain = this.audioCtx.createGain();
            this.sizzleGain.gain.value = 0;
            noiseSource.connect(this.sizzleFilter).connect(this.sizzleGain).connect(this.audioCtx.destination);
            noiseSource.start();
        }
        updateSizzle(heat) {
            if (!this.sizzleGain) return;
            const now = this.audioCtx.currentTime;
            const volume = (heat / 100) * 0.1;
            const filterFreq = 1000 + (heat / 100) * 8000;
            this.sizzleGain.gain.setTargetAtTime(volume, now, 0.1);
            this.sizzleFilter.frequency.setTargetAtTime(filterFreq, now, 0.1);
        }
        playReaction() {
            if (!this.audioCtx) return;
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            const gain = this.audioCtx.createGain();
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain).connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    }
    const audio = new AudioEngine();

    // --- Particle and Effect Classes ---
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.radius = 8;
            this.isDead = false;
        }
        update(width, height) {
            const speedMultiplier = 1 + (heatLevel / 100) * 4;
            this.x += this.vx * speedMultiplier;
            this.y += this.vy * speedMultiplier;
            if (this.x < this.radius || this.x > width - this.radius) this.vx *= -1;
            if (this.y < this.radius || this.y > height - this.radius) this.vy *= -1;
        }
    }

    class Sugar extends Particle {
        constructor(x, y) {
            super(x, y);
            this.type = 'sugar';
        }
        draw(ctx) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                ctx.lineTo(this.x + this.radius * Math.cos(i * 2 * Math.PI / 6), this.y + this.radius * Math.sin(i * 2 * Math.PI / 6));
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    class AminoAcid extends Particle {
        constructor(x, y) {
            super(x, y);
            this.type = 'amino';
            this.radius = 10;
        }
        draw(ctx) {
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                ctx.lineTo(this.x + this.radius * Math.cos(i * 2 * Math.PI / 3 - Math.PI / 2), this.y + this.radius * Math.sin(i * 2 * Math.PI / 3 - Math.PI / 2));
            }
            ctx.closePath();
            ctx.fill();
        }
    }
    
    class MaillardCompound extends Particle {
        constructor(x, y) {
            super(x, y);
            this.type = 'maillard';
            this.radius = 12;
            this.life = 60; // For birth animation
        }
        draw(ctx) {
            const scale = this.life > 0 ? 1 + (this.life / 60) * 0.5 : 1;
            const hue = 30;
            const saturation = 50;
            const lightness = Math.max(10, 40 - (heatLevel - 60) * 0.5);
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            ctx.fillStyle = color;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            // Draw a combined shape
            ctx.beginPath();
            for (let i = 0; i < 6; i++) { ctx.lineTo(0 + 8 * Math.cos(i * 2 * Math.PI / 6), 0 + 8 * Math.sin(i * 2 * Math.PI / 6)); }
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            for (let i = 0; i < 3; i++) { ctx.lineTo(0 + 5 * Math.cos(i * 2 * Math.PI / 3), 0 + 5 * Math.sin(i * 2 * Math.PI / 3)); }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        update(width, height) {
            super.update(width, height);
            if (this.life > 0) this.life--;
        }
    }
    
    class BurnedParticle extends Particle {
        constructor(x, y) {
            super(x, y);
            this.type = 'burned';
            this.radius = 5;
        }
        draw(ctx) {
            ctx.fillStyle = '#222';
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    class SmokeParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = -0.5 - Math.random() * 0.5; // Moves up
            this.life = 60 + Math.random() * 30; // Lasts 1-1.5 seconds
            this.radius = Math.random() * 3 + 2;
            this.isDead = false;
        }
        update() {
            this.life--;
            this.x += this.vx;
            this.y += this.vy;
            if (this.life <= 0) {
                this.isDead = true;
            }
        }
        draw(ctx) {
            const opacity = (this.life / 60) * 0.4;
            ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }


    // --- Core Simulation Logic ---
    function setup() {
        flavorScoreDisplay.textContent = '0';
        flavorScore = 0;
        particles = [];
        effects = [];
        const numSugars = 30;
        const numAminos = 30;
        for (let i = 0; i < numSugars; i++) {
            particles.push(new Sugar(Math.random() * canvas.width, Math.random() * canvas.height));
        }
        for (let i = 0; i < numAminos; i++) {
            particles.push(new AminoAcid(Math.random() * canvas.width, Math.random() * canvas.height));
        }
    }
    
    let burnCounter = 0;
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = effects.length - 1; i >= 0; i--) {
            effects[i].update();
            effects[i].draw(ctx);
            if (effects[i].isDead) {
                effects.splice(i, 1);
            }
        }
        
        const newParticles = [];
        for (let i = particles.length - 1; i >= 0; i--) {
            const p1 = particles[i];
            p1.update(canvas.width, canvas.height);
            
            if (heatLevel > 60 && !p1.isDead) {
                for (let j = i - 1; j >= 0; j--) {
                    const p2 = particles[j];
                    if (p2.isDead) continue;
                    
                    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    if (dist < p1.radius + p2.radius) {
                        if ((p1.type === 'sugar' && p2.type === 'amino') || (p1.type === 'amino' && p2.type === 'sugar')) {
                            p1.isDead = true;
                            p2.isDead = true;
                            newParticles.push(new MaillardCompound((p1.x + p2.x) / 2, (p1.y + p2.y) / 2));
                            flavorScore++;
                            audio.playReaction();
                            break;
                        }
                    }
                }
            }
        }
        particles = particles.filter(p => !p.isDead).concat(newParticles);
        
        if (heatLevel > 95) {
            burnCounter++;
            if (burnCounter > 20) {
                const toBurnIndex = particles.findIndex(p => p.type === 'sugar' || p.type === 'amino');
                if (toBurnIndex !== -1) {
                    const toBurn = particles[toBurnIndex];
                    particles[toBurnIndex] = new BurnedParticle(toBurn.x, toBurn.y);
                    effects.push(new SmokeParticle(toBurn.x, toBurn.y));
                }
                burnCounter = 0;
            }
        }

        particles.forEach(p => p.draw(ctx));
        flavorScoreDisplay.textContent = flavorScore;
        requestAnimationFrame(gameLoop);
    }
    
    // --- Initial Setup & Event Listeners ---
    function init() {
        canvas.width = 600;
        canvas.height = 600;
        
        heatSlider.addEventListener('input', () => {
            audio._init();
            heatLevel = parseInt(heatSlider.value);
            audio.updateSizzle(heatLevel);
        });
        
        resetBtn.addEventListener('click', () => {
            heatSlider.value = 0;
            heatLevel = 0;
            audio.updateSizzle(0);
            setup();
        });

        setup();
        gameLoop();
    }
    
    init();
});