document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection ---
    const elements = {
        setupScreen: document.getElementById('setup-screen'),
        meditationScreen: document.getElementById('meditation-screen'),
        endScreen: document.getElementById('end-screen'),
        durationBtns: document.querySelectorAll('.duration-btn'),
        restartBtn: document.getElementById('restart-btn'),
        guideText: document.getElementById('guide-text'),
        endText: document.getElementById('end-text'),
        focusDot: document.getElementById('focus-dot'),
        metaballContainer: document.getElementById('metaball-container'),
        particleCanvas: document.getElementById('particle-canvas'),
        blobs: document.querySelectorAll('.blob'),
    };

    // --- 2. State Management ---
    const config = { duration: 0 };
    let audio; // Will hold AudioEngine instance
    let particles; // Will hold ParticleSystem instance
    let blobAnimationId; // To control the blob animation loop

    // --- 3. Helper Functions ---
    const wait = ms => new Promise(res => setTimeout(res, ms));

    async function updateText(text, duration = 2000) {
        elements.guideText.style.opacity = 0;
        await wait(duration);
        elements.guideText.textContent = text;
        elements.guideText.style.opacity = 1;
    }

    function switchPhaseContainer(activeContainer) {
        [elements.setupScreen, elements.meditationScreen, elements.endScreen].forEach(c => c.classList.remove('active'));
        activeContainer.classList.add('active');
    }

    function generateCalmColor() {
        const hue = 200 + Math.random() * 60; // Blues and Cyans
        const saturation = 50 + Math.random() * 20;
        const lightness = 60 + Math.random() * 15;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function calculateTimings(totalSeconds) {
        const arrival = 20;
        const conclusion = 20;
        const practiceTime = totalSeconds - arrival - conclusion;
        // Ensure practice time doesn't go negative on short durations
        const safePracticeTime = Math.max(0, practiceTime);
        return {
            arrival: arrival * 1000,
            cadence: safePracticeTime * 0.6 * 1000,
            scan: safePracticeTime * 0.4 * 1000,
            conclusion: conclusion * 1000,
        };
    }

    // --- 4. Core Engines (Audio & Visuals) ---

    class AudioEngine {
        constructor() {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.nodes = {};
        }

        resume() {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
        
        _createChime() {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 3.5);
        }

        _startNode(name, type, freq, initialGain) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            filter.type = 'lowpass';
            filter.frequency.value = 400; // Start with a muted sound
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(initialGain, this.ctx.currentTime + 8);
            osc.connect(filter).connect(gain).connect(this.ctx.destination);
            osc.start();
            this.nodes[name] = { osc, gain, filter, baseGain: initialGain };
        }

        start(phase) {
            if (phase === 'arrival') {
                this._createChime();
                this._startNode('drone_sine', 'sine', 80, 0.04);
                this._startNode('drone_saw', 'sawtooth', 80.1, 0.01);
            } else if (phase === 'scan') {
                this.nodes.shimmerInterval = setInterval(() => {
                    const shimmerOsc = this.ctx.createOscillator(), shimmerGain = this.ctx.createGain();
                    shimmerOsc.type = 'triangle';
                    shimmerOsc.frequency.setValueAtTime(1200 + Math.random() * 200, this.ctx.currentTime);
                    shimmerGain.gain.setValueAtTime(0, this.ctx.currentTime);
                    shimmerGain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.05);
                    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
                    shimmerOsc.connect(shimmerGain).connect(this.ctx.destination);
                    shimmerOsc.start(this.ctx.currentTime);
                    shimmerOsc.stop(this.ctx.currentTime + 1);
                }, 400);
            }
        }

        updateBreath(state) {
            [this.nodes.drone_sine, this.nodes.drone_saw].forEach(node => {
                if (!node) return;
                let filterFreq, gain;
                if (state === 'inhale' || state === 'hold') {
                    filterFreq = 1000; // Brighter sound
                    gain = node.baseGain * 1.5;
                } else { // exhale
                    filterFreq = 400; // Muted sound
                    gain = node.baseGain;
                }
                node.filter.frequency.linearRampToValueAtTime(filterFreq, this.ctx.currentTime + 4);
                node.gain.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 4);
            });
        }

        stop(phase) {
            if (phase === 'scan' && this.nodes.shimmerInterval) {
                clearInterval(this.nodes.shimmerInterval);
            } else if (phase === 'conclusion') {
                Object.values(this.nodes).forEach(node => {
                    if (node && node.gain) node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 10);
                });
                setTimeout(() => {
                    Object.values(this.nodes).forEach(node => node?.osc?.stop());
                    this.nodes = {};
                }, 10000);
                setTimeout(() => this._createChime(), 12000);
            }
        }
    }

    class ParticleSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.animationFrameId = null;
            window.addEventListener('resize', () => this.resize());
        }
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        init(count = 500) {
            this.resize();
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
                    radius: Math.random() * 1.5 + 0.5,
                    alpha: 0, targetAlpha: Math.random() * 0.4 + 0.1, glow: 0
                });
            }
        }
        start() {
            if (!this.animationFrameId) this.animate();
        }
        stop() {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
                if (p.alpha < p.targetAlpha) p.alpha += 0.01;
                if (p.glow > 0) p.glow -= 0.02;
                this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(219, 232, 245, ${p.alpha + p.glow})`;
                this.ctx.fill();
            });
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        }
        highlightRegion(region) {
            const regions = {
                feet: { y: this.canvas.height * 0.85, r: this.canvas.height * 0.15 },
                hands: { y: this.canvas.height * 0.5, r: this.canvas.height * 0.15 },
                head: { y: this.canvas.height * 0.2, r: this.canvas.height * 0.15 }
            };
            const r = regions[region];
            this.particles.forEach(p => {
                const dist = Math.abs(p.y - r.y);
                if (dist < r.r) p.glow = Math.min(1, p.glow + 0.5);
            });
        }
    }

    function updateDotVisual(state) {
        let scale, opacity;
        if (state === 'inhale' || state === 'hold') {
            scale = 2.5; opacity = 1;
        } else { // exhale
            scale = 1; opacity = 0.7;
        }
        elements.focusDot.style.transform = `translate(-50%, -50%) scale(${scale})`;
        elements.focusDot.style.opacity = opacity;
    }

    function animateBlobs() {
        const time = Date.now() * 0.0002;
        elements.blobs.forEach((blob, index) => {
            const x = Math.sin(time * (index * 0.5 + 0.7)) * 150;
            const y = Math.cos(time * (index * 0.3 + 0.5)) * 150;
            blob.style.transform = `translate(${x}px, ${y}px)`;
        });
        blobAnimationId = requestAnimationFrame(animateBlobs);
    }

    // --- 5. Main Experience Orchestrator ---
    async function runExperience() {
        // A. Initial Setup
        audio = new AudioEngine();
        particles = new ParticleSystem(elements.particleCanvas);
        audio.resume();

        document.documentElement.style.setProperty('--color-dot', generateCalmColor());
        document.documentElement.style.setProperty('--color-blob', generateCalmColor());

        const timings = calculateTimings(config.duration);
        switchPhaseContainer(elements.meditationScreen);
        document.body.style.backgroundColor = 'var(--color-bg-main)';

        // STAGE 1: Arrival
        elements.focusDot.style.opacity = 0.7;
        audio.start('arrival');
        await updateText("Welcome. Let's begin.", 1000);
        await wait(5000);
        await updateText("Follow the light with your breath.", 3000);
        await wait(timings.arrival - 10000);
        
        // STAGE 2: Breath Focus (Cadence)
        elements.metaballContainer.style.opacity = 0.5;
        animateBlobs();
        const breathCycles = Math.floor(timings.cadence / 14000);
        for (let i = 0; i < breathCycles; i++) {
            await updateText("Breathe In...", 1000);
            updateDotVisual('inhale'); audio.updateBreath('inhale'); await wait(4000);
            await updateText("Hold...", 0);
            updateDotVisual('hold'); audio.updateBreath('hold'); await wait(4000);
            await updateText("Breathe Out...", 0);
            updateDotVisual('exhale'); audio.updateBreath('exhale'); await wait(6000);
        }

        // STAGE 3: Body Scan
        elements.focusDot.style.opacity = 0;
        elements.metaballContainer.style.opacity = 0;
        cancelAnimationFrame(blobAnimationId);
        elements.particleCanvas.style.opacity = 1;
        audio.start('scan'); // Using 'scan' to start the shimmer
        particles.init();
        particles.start();
        await updateText("Now, bring your awareness inward.", 3000);
        await wait(3000);
        const scanPoints = [
            { part: 'feet', text: "Feel the sensation in your feet, grounded." },
            { part: 'hands', text: "Notice the feeling in your hands." },
            { part: 'head', text: "Observe the quiet space around your head." },
        ];
        const scanDuration = (timings.scan - 6000) / scanPoints.length;
        for (const point of scanPoints) {
            await updateText(point.text, 2000);
            particles.highlightRegion(point.part);
            await wait(scanDuration - 2000);
        }

        // STAGE 4: Return
        elements.particleCanvas.style.opacity = 0;
        await updateText("", 1000);
        audio.stop('scan');
        audio.stop('conclusion');
        particles.stop();
        await updateText("The practice is now complete.", 3000);
        await wait(timings.conclusion - 5000);
        
        // Final transition to end screen
        elements.endText.textContent = `You have completed a ${config.duration / 60}-minute practice.`;
        switchPhaseContainer(elements.endScreen);
        document.body.style.backgroundColor = 'var(--color-bg-start)';
    }

    // --- 6. Initialization ---
    function init() {
        elements.durationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                config.duration = parseInt(btn.dataset.duration);
                runExperience();
            });
        });

        elements.restartBtn.addEventListener('click', () => {
            switchPhaseContainer(elements.setupScreen);
        });
    }

    init();
});