/**
 * The Debussy's Dream - Complete Functional Script
 * 
 * This script orchestrates the entire "Painting with Sound" experience.
 * It manages the UI state, generates all procedural audio and advanced visuals,
 * and controls the multi-stage scrollytelling timeline.
 * 
 * Key Features:
 * - Advanced VisualEngine for luminous, atmospheric SVG effects.
 * - AudioEngine with procedural reverb for a spacious, musical sound.
 * - `requestAnimationFrame` loop for dynamic, non-repeating animations.
 * - IntersectionObserver to trigger events based on scroll position.
 * - A sound activation gate for browser compatibility.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection ---
    const artLayers = document.getElementById('art-layers');
    const SVG_NS = "http://www.w3.org/2000/svg";
    const entryOverlay = document.getElementById('entry-overlay');
    const enterBtn = document.getElementById('enter-btn');
    let animationFrameId;

    // --- 2. AudioEngine with Reverb ---
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
            this.masterGain = null;
            this.activeNotes = [];
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioCtx.state === 'suspended') { this.audioCtx.resume(); }
            
            this.masterGain = this.audioCtx.createGain();
            const reverb = this.audioCtx.createConvolver();
            // Create a simple reverb impulse response
            const impulse = this.audioCtx.createBuffer(2, 1 * this.audioCtx.sampleRate, this.audioCtx.sampleRate);
            for (let i = 0; i < impulse.numberOfChannels; i++) {
                const channel = impulse.getChannelData(i);
                for (let j = 0; j < impulse.length; j++) {
                    channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / impulse.length, 2.5);
                }
            }
            reverb.buffer = impulse;
            this.masterGain.connect(reverb).connect(this.audioCtx.destination);
        }

        playSequence(notes, tempo, duration, volume) {
            this.stopAll();
            notes.forEach((note, index) => {
                if (note === null) return;
                const startTime = this.audioCtx.currentTime + index * tempo;
                // Main Note (Triangle for softness)
                const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, startTime);
                gain.gain.setValueAtTime(volume, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                osc.connect(gain).connect(this.masterGain);
                osc.start(startTime);
                osc.stop(startTime + duration);
                this.activeNotes.push(osc);
                
                // Sub-octave (Sine for warmth)
                const osc2 = this.audioCtx.createOscillator(), gain2 = this.audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(note / 2, startTime);
                gain2.gain.setValueAtTime(volume * 0.5, startTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                osc2.connect(gain2).connect(this.masterGain);
                osc2.start(startTime);
                osc2.stop(startTime + duration);
                this.activeNotes.push(osc2);
            });
        }
        
        fadeOut(duration) {
            if (this.masterGain) {
                this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration);
            }
        }
        stopAll() {
            this.activeNotes.forEach(n => { try { n.stop(); } catch(e) {} });
            this.activeNotes = [];
        }
    }
    const audio = new AudioEngine();
    
    // --- 3. Music Data ---
    const musicParts = {
        opening: { notes: [207.65, 233.08, 311.13], tempo: 1.5, duration: 3, volume: 0.1 },
        melody: { notes: [415.30, 466.16, 523.25, 466.16, 415.30, 349.23, 415.30], tempo: 0.6, duration: 1.5, volume: 0.15 },
        arpeggios: { notes: [622.25, 698.46, 783.99, 932.33, 783.99, 698.46, 622.25], tempo: 0.2, duration: 0.8, volume: 0.12 },
        coda: { notes: [207.65, 233.08, 311.13], tempo: 2, duration: 4, volume: 0.08 }
    };

    // --- 4. Advanced VisualEngine ---
    class VisualEngine {
        constructor() { this.elements = {}; this.mistParticles = []; }
        createLayer(id, type = 'g') { const layer = document.createElementNS(SVG_NS, type); layer.id = id; layer.classList.add('visual-layer'); artLayers.appendChild(layer); this.elements[id] = layer; return layer; }
        show(id) { setTimeout(() => this.elements[id]?.classList.add('visible'), 100); }
        createStars(count = 100) {
            const starfield = this.createLayer('starfield');
            for (let i = 0; i < count; i++) {
                const star = document.createElementNS(SVG_NS, 'circle');
                star.classList.add('star');
                star.setAttribute('cx', Math.random() * 800);
                star.setAttribute('cy', Math.random() * 400);
                star.setAttribute('r', Math.random() * 1.2);
                star.style.animationDelay = `${Math.random() * 5}s`;
                starfield.appendChild(star);
            }
            this.show('starfield');
        }
        createLuminousMoon() {
            const moonGroup = this.createLayer('moon-group');
            const atmosphere = document.createElementNS(SVG_NS, 'circle');
            atmosphere.setAttribute('cx', 400); atmosphere.setAttribute('cy', 200); atmosphere.setAttribute('r', 120); atmosphere.setAttribute('fill', '#4a6a8f');
            const corona = document.createElementNS(SVG_NS, 'circle');
            corona.setAttribute('cx', 400); corona.setAttribute('cy', 200); corona.setAttribute('r', 90); corona.setAttribute('fill', 'url(#moon-gradient)');
            const core = document.createElementNS(SVG_NS, 'circle');
            core.setAttribute('cx', 400); core.setAttribute('cy', 200); core.setAttribute('r', 50); core.setAttribute('fill', '#f5f5f5');
            moonGroup.appendChild(atmosphere); moonGroup.appendChild(corona); moonGroup.appendChild(core);
            moonGroup.setAttribute('filter', 'url(#luminous-glow)');
            this.show('moon-group');
        }
        createDynamicWater() {
            const waterGroup = this.createLayer('water-group');
            const waterSurface = document.createElementNS(SVG_NS, 'rect');
            waterSurface.setAttribute('width', 800); waterSurface.setAttribute('height', 250);
            waterSurface.setAttribute('y', 350); waterSurface.setAttribute('fill', '#1e3a5f');
            const reflection = document.createElementNS(SVG_NS, 'g');
            const moon = this.elements['moon-group'].cloneNode(true);
            const stars = this.elements['starfield'].cloneNode(true);
            reflection.appendChild(stars); reflection.appendChild(moon);
            reflection.setAttribute('transform', 'translate(0, 700) scale(1, -1)');
            reflection.style.opacity = 0.5;
            reflection.setAttribute('filter', 'url(#water-distortion-filter)');
            waterGroup.appendChild(waterSurface); waterGroup.appendChild(reflection);
            this.show('water-group');
        }
        createVolumetricMist(count = 80) {
            const mistGroup = this.createLayer('mist-group');
            this.mistParticles = [];
            for (let i = 0; i < count; i++) {
                const particle = document.createElementNS(SVG_NS, 'circle');
                particle.classList.add('mist-particle');
                const p = {
                    el: particle, x: Math.random() * 1000 - 100, y: 250 + Math.random() * 200,
                    r: 50 + Math.random() * 50, vx: 0.05 + Math.random() * 0.1,
                    opacity: 0, targetOpacity: 0.05 + Math.random() * 0.1
                };
                particle.setAttribute('cx', p.x); particle.setAttribute('cy', p.y); particle.setAttribute('r', p.r);
                mistGroup.appendChild(particle);
                this.mistParticles.push(p);
            }
            this.show('mist-group');
        }
        update(time) {
            const waterFilter = document.querySelector('#water-distortion-filter feTurbulence');
            if (waterFilter) { waterFilter.setAttribute('baseFrequency', `${0.01 + Math.sin(time / 2000) * 0.002} 0.04`); }
            this.mistParticles.forEach(p => {
                p.x += p.vx;
                if (p.x > 900) p.x = -100;
                if (p.opacity < p.targetOpacity) p.opacity += 0.001;
                p.el.setAttribute('cx', p.x);
                p.el.style.opacity = p.opacity;
            });
        }
    }
    const visuals = new VisualEngine();

    // --- 5. Timeline & Observer ---
    const stepActions = {
        theory: () => {
            artLayers.innerHTML = ''; artLayers.style.opacity = 1;
            visuals.createStars();
            audio.playSequence(musicParts.opening.notes, musicParts.opening.tempo, musicParts.opening.duration, musicParts.opening.volume);
        },
        melody: () => {
            visuals.createLuminousMoon();
            audio.playSequence(musicParts.melody.notes, musicParts.melody.tempo, musicParts.melody.duration, musicParts.melody.volume);
        },
        arpeggios: () => {
            visuals.createDynamicWater();
            audio.playSequence(musicParts.arpeggios.notes, musicParts.arpeggios.tempo, musicParts.arpeggios.duration, musicParts.arpeggios.volume);
        },
        atmosphere: () => {
            visuals.createVolumetricMist();
            audio.playSequence(musicParts.melody.notes, musicParts.melody.tempo, musicParts.melody.duration, musicParts.melody.volume * 0.7);
        },
        coda: () => {
            artLayers.style.transition = 'opacity 5s'; artLayers.style.opacity = 0;
            audio.fadeOut(5);
        }
    };

    // --- 6. Initialization ---
    function mainAnimationLoop(time) {
        visuals.update(time);
        animationFrameId = requestAnimationFrame(mainAnimationLoop);
    }
    
    function initExperience() {
        entryOverlay.style.opacity = 0;
        entryOverlay.style.visibility = 'hidden';
        
        audio._init(); // Initialize audio context on user interaction
        
        const steps = document.querySelectorAll('.story-step');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const stepId = entry.target.dataset.step;
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    if (stepActions[stepId]) stepActions[stepId]();
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, { threshold: 0.6 });
        
        steps.forEach(step => observer.observe(step));
        mainAnimationLoop();
    }
    
    enterBtn.addEventListener('click', initExperience, { once: true });
});