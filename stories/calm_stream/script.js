/**
 * The Calm Stream - Complete Functional Script
 * 
 * This script orchestrates the entire guided meditation experience.
 * It manages the UI state, generates all procedural audio and visuals,
 * and controls the multi-stage timeline of the practice.
 * 
 * Features:
 * - State-driven application flow.
 * - Advanced Web Audio API for natural soundscapes (wind, water).
 * - Hybrid visual engine (CSS for blobs, Canvas for particles).
 * - Async/await for a clean, readable timeline.
 * - Randomized color themes for replayability.
 */
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
    let audio;
    let particles;
    let blobAnimationId;
    let isRunning = false; // Prevents multiple sessions from starting simultaneously

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
            this.whiteNoiseBuffer = this._createWhiteNoiseBuffer();
        }

        resume() { if (this.ctx.state === 'suspended') this.ctx.resume(); }

        _createWhiteNoiseBuffer() {
            const bufferSize = 2 * this.ctx.sampleRate;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            return buffer;
        }

        _createChime() {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 3.5);
        }

        _createDrip() {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 + Math.random() * 200, this.ctx.currentTime);
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
            osc.connect(gain).connect(this.nodes.masterGain);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 1);
        }

        _createRustle(panValue = 0) {
            const source = this.ctx.createBufferSource(), gain = this.ctx.createGain(), filter = this.ctx.createBiquadFilter(), panner = this.ctx.createStereoPanner();
            source.buffer = this.whiteNoiseBuffer;
            source.loop = true;
            filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 20;
            panner.pan.setValueAtTime(panValue, this.ctx.currentTime);
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.5);
            source.connect(filter).connect(gain).connect(panner).connect(this.nodes.masterGain);
            source.start(this.ctx.currentTime);
            source.stop(this.ctx.currentTime + 1.5);
        }

        start(phase) {
            if (phase === 'arrival') {
                this.nodes.masterGain = this.ctx.createGain();
                this.nodes.masterGain.connect(this.ctx.destination);
                this._createChime();
                const windSource = this.ctx.createBufferSource(), windFilter = this.ctx.createBiquadFilter(), windGain = this.ctx.createGain();
                windSource.buffer = this.whiteNoiseBuffer; windSource.loop = true;
                windFilter.type = 'lowpass'; windFilter.frequency.value = 200;
                windGain.gain.setValueAtTime(0, this.ctx.currentTime);
                windGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 8);
                windSource.connect(windFilter).connect(windGain).connect(this.nodes.masterGain);
                windSource.start();
                this.nodes.wind = { source: windSource, filter: windFilter, gain: windGain, baseGain: 0.3 };
            } else if (phase === 'cadence') {
                const streamSource = this.ctx.createBufferSource(), streamFilter = this.ctx.createBiquadFilter(), streamGain = this.ctx.createGain();
                streamSource.buffer = this.whiteNoiseBuffer; streamSource.loop = true;
                streamFilter.type = 'bandpass'; streamFilter.frequency.value = 1500; streamFilter.Q.value = 5;
                streamGain.gain.setValueAtTime(0, this.ctx.currentTime);
                streamGain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 5);
                streamSource.connect(streamFilter).connect(streamGain).connect(this.nodes.masterGain);
                streamSource.start();
                this.nodes.stream = { source: streamSource, gain: streamGain };
                this.nodes.dripInterval = setInterval(() => this._createDrip(), 2500 + Math.random() * 2000);
            }
        }

        updateBreath(state) {
            const wind = this.nodes.wind;
            if (!wind) return;
            let filterFreq, gain;
            if (state === 'inhale' || state === 'hold') {
                filterFreq = 500; gain = wind.baseGain * 1.5;
            } else {
                filterFreq = 200; gain = wind.baseGain;
            }
            wind.filter.frequency.linearRampToValueAtTime(filterFreq, this.ctx.currentTime + 4);
            wind.gain.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 4);
        }

        triggerScanSound(part) {
            const panMap = { feet: 0, hands: Math.random() > 0.5 ? 0.7 : -0.7, head: 0 };
            this._createRustle(panMap[part]);
        }

        stop(phase) {
            if (phase === 'cadence') {
                if (this.nodes.dripInterval) clearInterval(this.nodes.dripInterval);
                if (this.nodes.stream) {
                    this.nodes.stream.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 5);
                    setTimeout(() => this.nodes.stream.source.stop(), 5000);
                }
            } else if (phase === 'conclusion') {
                if (this.nodes.masterGain) {
                    this.nodes.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 10);
                }
                setTimeout(() => {
                    this.nodes.wind?.source.stop();
                    this.nodes = {};
                }, 10000);
                setTimeout(() => this._createChime(), 12000);
            }
        }
    }

    class ParticleSystem {
        constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.particles = []; this.animationFrameId = null; window.addEventListener('resize', () => this.resize()); }
        resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
        init(count = 500) { this.resize(); this.particles = []; for (let i = 0; i < count; i++) { this.particles.push({ x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, radius: Math.random() * 1.5 + 0.5, alpha: 0, targetAlpha: Math.random() * 0.4 + 0.1, glow: 0 }); } }
        start() { if (!this.animationFrameId) this.animate(); }
        stop() { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
        animate() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1; if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1; if (p.alpha < p.targetAlpha) p.alpha += 0.01; if (p.glow > 0) p.glow -= 0.02; this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); this.ctx.fillStyle = `rgba(219, 232, 245, ${p.alpha + p.glow})`; this.ctx.fill(); }); this.animationFrameId = requestAnimationFrame(() => this.animate()); }
        highlightRegion(region) { const regions = { feet: { y: this.canvas.height * 0.85, r: this.canvas.height * 0.15 }, hands: { y: this.canvas.height * 0.5, r: this.canvas.height * 0.15 }, head: { y: this.canvas.height * 0.2, r: this.canvas.height * 0.15 } }; const r = regions[region]; this.particles.forEach(p => { const dist = Math.abs(p.y - r.y); if (dist < r.r) p.glow = Math.min(1, p.glow + 0.5); }); }
    }

    function updateDotVisual(state) {
        let scale, opacity;
        if (state === 'inhale' || state === 'hold') { scale = 2.5; opacity = 1; } else { scale = 1; opacity = 0.7; }
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
        audio.start('cadence');
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
        audio.stop('cadence');
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
            audio.triggerScanSound(point.part);
            particles.highlightRegion(point.part);
            await wait(Math.max(0, scanDuration - 2000));
        }

        // STAGE 4: Return
        elements.particleCanvas.style.opacity = 0;
        await updateText("", 1000);
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
                if (isRunning) return;
                isRunning = true;
                config.duration = parseInt(btn.dataset.duration);
                runExperience();
            });
        });

        elements.restartBtn.addEventListener('click', () => {
            isRunning = false; // Allow a new session to start
            switchPhaseContainer(elements.setupScreen);
        });
    }

    init();
});