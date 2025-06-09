document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const sliders = {
        temperature: document.getElementById('temp-slider'),
        humidity: document.getElementById('humidity-slider'),
        pressure: document.getElementById('pressure-slider'),
    };
    const continent = document.getElementById('continent');

    // --- Core Simulation State ---
    const simState = {
        temperature: 50,
        humidity: 50,
        pressure: 50,
        cloudCover: 0,
        isPrecipitating: false,
        precipitationType: 'rain', // 'rain' or 'snow'
        windSpeed: 0,
        snowAccumulation: 0, // 0-1
    };

    // --- Audio Engine ---
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
            this.windGain = null;
            this.rainGain = null;
            this.snowGain = null;
            this.windFilter = null;
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const masterGain = this.audioCtx.createGain();
            masterGain.gain.value = 0.5;
            masterGain.connect(this.audioCtx.destination);
            
            const noiseSource = this.audioCtx.createBufferSource();
            const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 4, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            noiseSource.buffer = buffer;
            noiseSource.loop = true;

            this.windFilter = this.audioCtx.createBiquadFilter(); this.windFilter.type = 'lowpass';
            this.windGain = this.audioCtx.createGain(); this.windGain.gain.value = 0;
            
            this.rainFilter = this.audioCtx.createBiquadFilter(); this.rainFilter.type = 'bandpass';
            this.rainFilter.frequency.value = 1500; this.rainFilter.Q.value = 2;
            this.rainGain = this.audioCtx.createGain(); this.rainGain.gain.value = 0;

            this.snowFilter = this.audioCtx.createBiquadFilter(); this.snowFilter.type = 'lowpass';
            this.snowFilter.frequency.value = 500;
            this.snowGain = this.audioCtx.createGain(); this.snowGain.gain.value = 0;
            
            noiseSource.connect(this.windFilter).connect(this.windGain).connect(masterGain);
            noiseSource.connect(this.rainFilter).connect(this.rainGain).connect(masterGain);
            noiseSource.connect(this.snowFilter).connect(this.snowGain).connect(masterGain);
            noiseSource.start();
        }
        update(state) {
            if (!this.audioCtx) return;
            const now = this.audioCtx.currentTime;
            this.windGain.gain.setTargetAtTime(state.windSpeed * 0.3, now, 0.1);
            this.windFilter.frequency.setTargetAtTime(100 + state.windSpeed * 2000, now, 0.1);

            const rainVolume = state.isPrecipitating && state.precipitationType === 'rain' ? (state.cloudCover / 100) * 0.1 : 0;
            this.rainGain.gain.setTargetAtTime(rainVolume, now, 0.1);
            
            const snowVolume = state.isPrecipitating && state.precipitationType === 'snow' ? (state.cloudCover / 100) * 0.05 : 0;
            this.snowGain.gain.setTargetAtTime(snowVolume, now, 0.1);
        }
    }
    const audio = new AudioEngine();

    // --- Visual Systems ---
    class ParticleSystem {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
        resize() {
            const globe = document.getElementById('globe');
            this.canvas.width = globe.clientWidth;
            this.canvas.height = globe.clientHeight;
        }
        update() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach((p, i) => {
                p.update();
                p.draw(this.ctx);
                if (p.isDead()) this.particles.splice(i, 1);
            });
        }
    }

    class Cloud {
        constructor(w, h) {
            this.x = Math.random() * w; this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.2; this.vy = (Math.random() - 0.5) * 0.2;
            this.radius = Math.random() * 40 + 20; this.alpha = 0; this.maxAlpha = Math.random() * 0.3 + 0.2;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.alpha < this.maxAlpha) this.alpha += 0.01;
        }
        draw(ctx) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        isDead() { return false; }
    }

    class RainDrop {
        constructor(w, h) {
            this.x = Math.random() * w; this.y = Math.random() * h;
            this.vy = Math.random() * 5 + 5; this.len = Math.random() * 10 + 5; this.h = h;
        }
        update() { this.y += this.vy; }
        draw(ctx) {
            ctx.strokeStyle = 'rgba(135, 206, 235, 0.5)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.y + this.len); ctx.stroke();
        }
        isDead() { return this.y > this.h; }
    }

    class Snowflake {
        constructor(w, h) {
            this.x = Math.random() * w; this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.5; this.vy = Math.random() * 0.5 + 0.5;
            this.radius = Math.random() * 2 + 1; this.alpha = Math.random() * 0.5 + 0.3; this.h = h;
        }
        update() { this.x += this.vx; this.y += this.vy; }
        draw(ctx) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        isDead() { return this.y > this.h; }
    }

    const cloudSystem = new ParticleSystem('cloud-canvas');
    const precipitationSystem = new ParticleSystem('precipitation-canvas');

    // --- Core Simulation Logic ---
    function updateWeather() {
        simState.temperature = sliders.temperature.value;
        simState.humidity = sliders.humidity.value;
        simState.pressure = sliders.pressure.value;
        
        const cloudPotential = (simState.humidity / 100) * (1 - simState.pressure / 100);
        simState.cloudCover = cloudPotential > 0.4 ? Math.min(100, simState.cloudCover + 0.5) : Math.max(0, simState.cloudCover - 0.5);

        simState.isPrecipitating = simState.cloudCover > 80 && simState.humidity > 90;
        simState.precipitationType = simState.temperature < 50 ? 'snow' : 'rain';

        simState.windSpeed = Math.abs(50 - simState.pressure) / 50;

        if (simState.isPrecipitating && simState.precipitationType === 'snow') {
            simState.snowAccumulation = Math.min(1, simState.snowAccumulation + 0.002);
        } else if (simState.temperature > 50) {
            simState.snowAccumulation = Math.max(0, simState.snowAccumulation - 0.002);
        }

        const targetCloudCount = Math.floor((simState.cloudCover / 100) * 50);
        while (cloudSystem.particles.length < targetCloudCount) cloudSystem.particles.push(new Cloud(cloudSystem.canvas.width, cloudSystem.canvas.height));
        while (cloudSystem.particles.length > targetCloudCount) cloudSystem.particles.pop();

        if (simState.isPrecipitating) {
            for (let i = 0; i < 5; i++) {
                if (simState.precipitationType === 'rain') {
                    precipitationSystem.particles.push(new RainDrop(precipitationSystem.canvas.width, precipitationSystem.canvas.height));
                } else {
                    precipitationSystem.particles.push(new Snowflake(precipitationSystem.canvas.width, precipitationSystem.canvas.height));
                }
            }
        }
        
        const continentBase = getComputedStyle(document.documentElement).getPropertyValue('--continent-color').trim();
        const continentSnow = getComputedStyle(document.documentElement).getPropertyValue('--continent-snow-color').trim();
        continent.style.fill = `color-mix(in srgb, ${continentBase}, ${continentSnow} ${simState.snowAccumulation * 100}%)`;

        audio.update(simState);
    }

    // --- Main Loop & Initial Setup ---
    function mainLoop() {
        updateWeather();
        cloudSystem.update();
        precipitationSystem.update();
        requestAnimationFrame(mainLoop);
    }
    
    function init() {
        Object.values(sliders).forEach(s => s.addEventListener('input', () => audio._init(), { once: true }));
        mainLoop();
    }
    
    init();
});