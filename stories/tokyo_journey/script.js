/**
 * Tokyo: Echoes of the Future - Complete & Corrected Functional Script
 *
 * This version resolves the critical "Cannot read properties of null" error
 * by ensuring the JavaScript reliably targets the <svg> container provided
 * in the corrected index.html and correctly manages its content.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection & Global State ---
    const visualPaneSVG = document.getElementById('tokyo-canvas');
    const entryOverlay = document.getElementById('entry-overlay');
    const enterBtn = document.getElementById('enter-btn');
    const SVG_NS = "http://www.w3.org/2000/svg";
    let activeStep = '';

    // --- 2. High-Technique AudioEngine ---
    class AudioEngine {
        constructor() { this.audioCtx = null; this.nodes = {}; }
        _init() { if (this.audioCtx) return; this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); }

        crossfade(newSoundsConfig = []) {
            this._init();
            Object.keys(this.nodes).forEach(key => {
                if (!newSoundsConfig.some(s => s.name === key)) {
                    const node = this.nodes[key];
                    if (node.gain) node.gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.5);
                    if (node.interval) clearInterval(node.interval);
                    if (node.source) setTimeout(() => { try { node.source.stop(); } catch(e){} }, 1500);
                    delete this.nodes[key];
                }
            });
            newSoundsConfig.forEach(sound => this.play(sound));
        }

        play(sound) {
            if (this.nodes[sound.name]) {
                if (this.nodes[sound.name].gain) this.nodes[sound.name].gain.gain.linearRampToValueAtTime(sound.volume, this.audioCtx.currentTime + 1.5);
                return;
            }
            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(sound.volume, this.audioCtx.currentTime + 2);
            gain.connect(this.audioCtx.destination);
            let source = null, interval = null;
            if (sound.type === 'noise') {
                source = this.audioCtx.createBufferSource(); source.buffer = this._createNoiseBuffer(); source.loop = true;
                const filter = this.audioCtx.createBiquadFilter();
                filter.type = sound.filter_type || 'lowpass'; filter.frequency.value = sound.freq;
                source.connect(filter).connect(gain); source.start();
            } else {
                interval = setInterval(() => {
                    const osc = this.audioCtx.createOscillator(), g = this.audioCtx.createGain();
                    osc.type = sound.wave || 'sine';
                    osc.frequency.value = Array.isArray(sound.freq) ? sound.freq[Math.floor(Math.random() * sound.freq.length)] : sound.freq;
                    g.gain.setValueAtTime(sound.volume * 0.5, this.audioCtx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + sound.duration);
                    osc.connect(g).connect(this.audioCtx.destination);
                    osc.start(); osc.stop(this.audioCtx.currentTime + sound.duration);
                }, sound.tempo);
            }
            this.nodes[sound.name] = { gain, source, interval };
        }
        _createNoiseBuffer() { const bS = this.audioCtx.sampleRate, b = this.audioCtx.createBuffer(1, bS, bS), o = b.getChannelData(0); for (let i = 0; i < bS; i++) o[i] = Math.random() * 2 - 1; return b; }
    }
    const audio = new AudioEngine();
    
    // --- 3. Corrected Visual Rendering Functions ---
    const visualActions = {
        akihabara: () => {
            const container = document.createElementNS(SVG_NS, 'g');
            container.innerHTML = '<rect width="800" height="600" fill="#0c0c1d" />';
            const colors = ['#ff00ff', '#00ffff', '#ffdd00', '#00ff00'];
            for(let i=0; i<10; i++){
                const neon = document.createElementNS(SVG_NS, 'path');
                const color = colors[i % colors.length];
                neon.setAttribute('d', `M${Math.random()*800} ${Math.random()*600} h ${50+Math.random()*100} v ${20+Math.random()*30}`);
                neon.setAttribute('fill', 'none'); neon.setAttribute('stroke', color); neon.setAttribute('stroke-width', 4);
                neon.style.setProperty('--glow-color', color);
                neon.classList.add('neon-sign'); neon.style.animationDelay = `${i*0.2}s`;
                container.appendChild(neon);
            }
            return container;
        },
        gyoen: () => {
            const container = document.createElementNS(SVG_NS, 'g');
            container.innerHTML = '<rect width="800" height="600" fill="#e0f2f1" />';
            container.innerHTML += '<path d="M0 450 C 200 400, 600 500, 800 450" fill="#81c784"/>';
            container.innerHTML += '<path d="M0 480 C 150 450, 650 520, 800 480" fill="#a5d6a7"/>';
            const koi = document.createElementNS(SVG_NS, 'path');
            koi.setAttribute('d', 'M400 300 C 450 280, 500 320, 400 300');
            koi.setAttribute('stroke', '#e65100'); koi.setAttribute('stroke-width', 15); koi.setAttribute('stroke-linecap', 'round');
            koi.classList.add('koi-fish'); container.appendChild(koi);
            return container;
        },
        shinkansen: () => {
            const container = document.createElementNS(SVG_NS, 'g');
            container.innerHTML = '<rect width="800" height="600" fill="#81d4fa" />';
            for(let i=0; i<10; i++){
                container.innerHTML += `<rect y="${i * 60}" width="800" height="30" fill="rgba(255,255,255,0.2)" />`;
            }
            const train = document.createElementNS(SVG_NS, 'path');
            train.setAttribute('d', 'M0 280 H 600 C 700 280, 750 300, 700 320 H 0 Z');
            train.setAttribute('fill', '#f5f5f5');
            train.classList.add('shinkansen-body'); container.appendChild(train);
            return container;
        },
        asakusa: () => {
            const container = document.createElementNS(SVG_NS, 'g');
            container.innerHTML = '<rect width="800" height="600" fill="#3e2723" />';
            const gate = document.createElementNS(SVG_NS, 'path');
            gate.setAttribute('d', 'M150 500 V 200 H 650 V 500 M 100 200 H 700 L 650 150 H 150 Z');
            gate.setAttribute('fill', '#c62828'); container.appendChild(gate);
            const lantern = document.createElementNS(SVG_NS, 'path');
            lantern.setAttribute('d', 'M350 350 C 320 300, 480 300, 450 350 V 450 H 350 Z');
            lantern.setAttribute('fill', '#fbe9e7'); lantern.classList.add('lantern'); container.appendChild(lantern);
            return container;
        },
        skytree: () => {
            const container = document.createElementNS(SVG_NS, 'g');
            container.innerHTML = '<rect width="800" height="600" fill="#0a1420" />';
            for(let i=0; i<200; i++){
                container.innerHTML += `<circle cx="${Math.random()*800}" cy="${200+Math.random()*400}" r="${Math.random()*1.5}" fill="hsl(${40+Math.random()*20}, 100%, 70%)" opacity="0.8"/>`;
            }
            const skytree = document.createElementNS(SVG_NS, 'path');
            skytree.setAttribute('d', 'M400 600 L 380 100 L 420 100 L 400 600 M 350 150 H 450');
            skytree.setAttribute('fill', '#90a4ae'); container.appendChild(skytree);
            return container;
        },
    };
    
    // --- 4. Timeline & Audio Cues ---
    const soundscapes = {
        akihabara: [{name:'jpop', type:'rhythm', wave:'square', freq:[698,783,880,932], tempo:150, duration:0.1, volume:0.05}, {name:'electronics', type:'noise', filter_type:'highpass', freq:2000, volume:0.02}],
        gyoen: [{name:'koto', type:'rhythm', wave:'sine', freq:[587,659,880,1046], tempo:800, duration:0.7, volume:0.1}, {name:'water', type:'noise', filter_type:'lowpass', freq:400, volume:0.03}],
        shinkansen: [{name:'whine', type:'rhythm', wave:'sine', freq:1200, tempo:50, duration:0.05, volume:0.05}, {name:'clack', type:'noise', filter_type:'bandpass', freq:800, volume:0.1}],
        asakusa: [{name:'gong', type:'rhythm', wave:'sine', freq:110, tempo:5000, duration:4, volume:0.2}, {name:'chant', type:'noise', filter_type:'bandpass', freq:600, volume:0.02}],
        skytree: [{name:'synth_pad', type:'rhythm', wave:'triangle', freq:[261, 329, 392], tempo:4000, duration:4, volume:0.1}, {name:'city_hum', type:'noise', filter_type:'lowpass', freq:150, volume:0.05}]
    };
    
    // --- 5. Core Application Logic (Corrected) ---
    function setActiveAct(stepId) {
        if (activeStep === stepId) return;
        activeStep = stepId;
        
        // --- FIX: Safely find and manage content within the persistent SVG canvas ---
        const oldContent = visualPaneSVG.querySelector('.visual-act');

        if(oldContent){
            oldContent.classList.remove('visible');
            setTimeout(() => { oldContent.remove(); }, 2000); // Remove after fade out animation
        }
        
        if (visualActions[stepId]) {
            const newContent = visualActions[stepId]();
            newContent.classList.add('visual-act');
            visualPaneSVG.appendChild(newContent);
            
            // A tiny delay to allow the DOM to update before adding the 'visible' class
            setTimeout(() => {
                newContent.classList.add('visible');
            }, 50);
        }

        // Transition audio
        if(soundscapes[stepId]) audio.crossfade(soundscapes[stepId]);
    }
    
    function initExperience() {
        entryOverlay.style.opacity = 0;
        entryOverlay.style.visibility = 'hidden';
        
        audio._init(); // Initialize audio context on user interaction
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    setActiveAct(entry.target.dataset.step);
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, { threshold: 0.6 });

        document.querySelectorAll('.story-step').forEach(step => observer.observe(step));
    }

    // --- 6. Initialization ---
    enterBtn.addEventListener('click', initExperience, { once: true });
});