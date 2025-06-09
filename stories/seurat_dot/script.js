document.addEventListener('DOMContentLoaded', () => {

    const artLayers = document.getElementById('art-layers');
    const SVG_NS = "http://www.w3.org/2000/svg";

    // --- NLD Result: Improved Audio Engine with Reverb ---
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
            this.reverbNode = null;
            this.activeIntervals = [];
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioCtx.state === 'suspended') { this.audioCtx.resume(); }
            // Create a simple reverb effect
            const reverb = this.audioCtx.createConvolver();
            const impulse = this.audioCtx.createBuffer(2, 0.5 * this.audioCtx.sampleRate, this.audioCtx.sampleRate);
            for (let i = 0; i < impulse.numberOfChannels; i++) {
                const channel = impulse.getChannelData(i);
                for (let j = 0; j < impulse.length; j++) {
                    channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / impulse.length, 2);
                }
            }
            reverb.buffer = impulse;
            this.reverbNode = reverb;
            this.reverbNode.connect(this.audioCtx.destination);
        }

        playNote(freq, duration, volume) {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            // Layered sound for richer timbre
            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 2, this.audioCtx.currentTime); // One octave higher
            gain2.gain.setValueAtTime(volume * 0.3, this.audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

            osc.connect(gain).connect(this.reverbNode);
            osc2.connect(gain2).connect(this.reverbNode);
            
            osc.start(this.audioCtx.currentTime);
            osc2.start(this.audioCtx.currentTime);
            osc.stop(this.audioCtx.currentTime + duration);
            osc2.stop(this.audioCtx.currentTime + duration);
        }

        startArpeggio(notes, tempo, duration, volume) {
            this._init();
            let noteIndex = 0;
            const intervalId = setInterval(() => {
                this.playNote(notes[noteIndex % notes.length], duration, volume);
                noteIndex++;
            }, tempo);
            this.activeIntervals.push(intervalId);
        }
        
        playBassNote(note, duration, volume) {
            this._init();
            this.playNote(note, duration, volume);
        }

        stopAll() {
            this.activeIntervals.forEach(id => clearInterval(id));
            this.activeIntervals = [];
        }
    }
    const audio = new AudioEngine();

    // --- NLD Result: Improved function for generating dots within shapes ---
    function generateDotCluster(config) {
        const { dotCount, palette, area, containerId, animationDelay = 0, clipPathId = '' } = config;
        const container = document.createElementNS(SVG_NS, 'g');
        container.id = containerId;
        if (clipPathId) {
            container.setAttribute('clip-path', `url(#${clipPathId})`);
        }
        artLayers.appendChild(container);

        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElementNS(SVG_NS, 'circle');
            const x = area.x + Math.random() * area.w;
            const y = area.y + Math.random() * area.h;
            const color = palette[Math.floor(Math.random() * palette.length)];

            dot.setAttribute('cx', x);
            dot.setAttribute('cy', y);
            dot.setAttribute('r', 1.5);
            dot.setAttribute('fill', color);
            dot.classList.add('art-dot');
            // NLD Result: Add randomized animation delay for cascading effect
            dot.style.animationDelay = `${i * animationDelay}ms`;
            container.appendChild(dot);
        }
        return container;
    }

    // --- NLD Result: Map step names to improved actions ---
    const stepActions = {
        theory: () => {
            audio.stopAll();
            artLayers.innerHTML = '';
            generateDotCluster({ dotCount: 1000, palette: ['#4a90e2', '#f5a623'], area: { x: 200, y: 150, w: 400, h: 300 }, containerId: 'theory-dots', animationDelay: 1 });
        },
        riverbank: () => {
            artLayers.innerHTML = '';
            generateDotCluster({ dotCount: 2000, palette: ['#79a281', '#40634f', '#f4d58d'], area: { x: 0, y: 350, w: 800, h: 250 }, containerId: 'grass-layer', animationDelay: 1 });
            generateDotCluster({ dotCount: 1500, palette: ['#5d8a9b', '#a2c4e8'], area: { x: 0, y: 400, w: 800, h: 100 }, containerId: 'water-layer', animationDelay: 1 });
            audio.startArpeggio([261.63, 329.63, 392.00, 440.00], 300, 1.5, 0.08);
        },
        shadows: () => {
            generateDotCluster({ dotCount: 500, palette: ['#3a6a8f', '#e67e22'], area: { x: 500, y: 380, w: 250, h: 100 }, containerId: 'shadow-group', animationDelay: 2 });
            audio.playBassNote(130.81, 5, 0.05); // C3 bass note
        },
        figures: () => {
            // NLD Result: Use the clipPath to create organic shapes
            generateDotCluster({ dotCount: 1000, palette: ['#4a4a4a', '#d0021b', '#f8e71c'], area: { x: 580, y: 150, w: 120, h: 250 }, containerId: 'figure-woman', animationDelay: 2, clipPathId: 'clip-woman' });
            generateDotCluster({ dotCount: 800, palette: ['#2e4034', '#ffffff'], area: { x: 140, y: 200, w: 90, h: 200 }, containerId: 'figure-man', animationDelay: 2, clipPathId: 'clip-man' });
            audio.startArpeggio([523.25, 587.33, 659.25], 450, 1.5, 0.06); // Higher counter-melody
        },
        masterpiece: () => {
            artLayers.querySelectorAll('.art-dot').forEach((dot) => {
                dot.classList.add('final-shimmer');
                // NLD Result: Randomize shimmer delay for a more natural twinkle
                dot.style.animationDelay = `${Math.random() * 3}s`;
            });
        }
    };

    // --- Intersection Observer Setup ---
    const steps = document.querySelectorAll('.story-step');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const stepId = entry.target.dataset.step;
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (stepActions[stepId]) {
                    stepActions[stepId]();
                }
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, { threshold: 0.6 });

    steps.forEach(step => observer.observe(step));
});