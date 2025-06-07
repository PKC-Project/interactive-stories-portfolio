// script.js for The Celestial Astrolabe (vFinal - Shimmering Audio)

document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('sky-canvas');
    const ctx = canvas.getContext('2d');
    const exposureSlider = document.getElementById('exposure-slider');
    const exposureValue = document.getElementById('exposure-value');
    const densitySlider = document.getElementById('density-slider');
    const densityValue = document.getElementById('density-value');
    const exposeButton = document.getElementById('expose-button');
    const statusText = document.getElementById('status-text');

    let stars = [];
    let animationFrameId;
    let isExposing = false;
    let celestialPole = { x: 0, y: 0 };
    let audioCtx, music;

    // --- BARISTA'S NOTE: Your new, specified audio engine is here. ---
    const setupAudio = () => {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        music = createMusic();
    };

    function createMusic() {
        const masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(audioCtx.destination);

        // This filter is no longer connected in the original snippet,
        // but it can be useful to prevent harsh frequencies. I'll connect the masterGain to it.
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000; // Allow shimmering highs to pass through
        masterGain.connect(filter);
        filter.connect(audioCtx.destination);
        
        const delay = audioCtx.createDelay(3.0);
        const feedback = audioCtx.createGain();
        feedback.gain.value = 0.5;
        delay.connect(feedback).connect(delay);
        // We will connect the shimmer sound directly to the delay
        // masterGain now controls the overall output volume.
        
        return { gain: masterGain, delay, isPlaying: false };
    }

    function playShimmer() {
        if (!music || !music.isPlaying || audioCtx.state === 'suspended') return;
        const now = audioCtx.currentTime;
        const scale = [523.25, 659.25, 783.99, 1046.50];
        const freq = scale[Math.floor(Math.random() * scale.length)];

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

        // Connect the shimmer directly to the main output AND the delay line
        osc.connect(gain);
        gain.connect(music.gain);
        gain.connect(music.delay);

        osc.start(now);
        osc.stop(now + 2);
    }
    // --- End of new audio engine ---

    // --- Star Class (with vibrant color) ---
    class Star {
        constructor(x, y, radius, color, rotationSpeed) {
            this.x = x; this.y = y; this.px = x; this.py = y;
            this.radius = radius;
            this.color = color;
            this.rotationSpeed = rotationSpeed;
        }
        update(pole) {
            this.px = this.x; this.py = this.y;
            const dx = this.x - pole.x; const dy = this.y - pole.y;
            const angle = Math.atan2(dy, dx); const dist = Math.sqrt(dx * dx + dy * dy);
            const newAngle = angle + this.rotationSpeed;
            this.x = pole.x + Math.cos(newAngle) * dist;
            this.y = pole.y + Math.sin(newAngle) * dist;
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.px, this.py);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.radius;
            ctx.stroke();
        }
    }

    // --- Main Simulation Logic ---
    let frameCount = 0;
    function exposeLoop() {
        if (!isExposing) return;
        
        stars.forEach(star => {
            star.update(celestialPole);
            star.draw(ctx);
        });
        
        // Occasionally play a shimmer sound, now using your function
        if (frameCount % 60 === 0) {
            playShimmer();
        }

        frameCount++;
        const exposureDurationInFrames = parseInt(exposureSlider.value, 10) * 60;
        
        if (frameCount >= exposureDurationInFrames) {
            finishExposure();
        } else {
            animationFrameId = requestAnimationFrame(exposeLoop);
        }
    }

    function startExposure() {
        if (isExposing) return;
        isExposing = true;
        frameCount = 0;
        exposeButton.disabled = true;
        statusText.textContent = "Exposing...";
        
        celestialPole = { x: canvas.width / 2, y: canvas.height * 0.15 };

        ctx.fillStyle = '#00000a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        
        stars = [];
        const numStars = parseInt(densitySlider.value, 10);
        const huePalette = [200, 260, 330, 0, 30];

        for (let i = 0; i < numStars; i++) {
            const x = Math.random() * canvas.width; const y = Math.random() * canvas.height;
            const radius = Math.random() * 1.5 + 0.2;
            const hue = huePalette[Math.floor(Math.random() * huePalette.length)];
            const lightness = 70 + Math.random() * 20;
            const opacity = 0.2 + Math.random() * 0.4;
            const color = `hsla(${hue}, 100%, ${lightness}%, ${opacity})`;

            const distFromPole = Math.sqrt((x - celestialPole.x)**2 + (y-celestialPole.y)**2);
            const rotationSpeed = (distFromPole / Math.max(canvas.width, canvas.height)) * 0.0025;

            stars.push(new Star(x, y, radius, color, rotationSpeed));
        }

        if(music) {
            music.isPlaying = true;
            // Fade in the master volume for the shimmers and echoes
            music.gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 1);
        }
        
        animationFrameId = requestAnimationFrame(exposeLoop);
    }
    
    function finishExposure() {
        isExposing = false;
        exposeButton.disabled = false;
        statusText.textContent = "Exposure complete. Create a new image.";
        if(music) {
            music.isPlaying = false;
            // Fade out the master volume
            music.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);
        }
    }
    
    // --- UI and Event Listeners ---
    function updateSliderValues() {
        exposureValue.textContent = `${exposureSlider.value}s`;
        densityValue.textContent = `${densitySlider.value} stars`;
    }
    
    exposeButton.addEventListener('click', () => {
        setupAudio();
        startExposure();
    });
    
    exposureSlider.addEventListener('input', updateSliderValues);
    densitySlider.addEventListener('input', updateSliderValues);
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // --- Initial Setup ---
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateSliderValues();
    statusText.textContent = "Adjust settings and click 'Expose Sky'.";
});