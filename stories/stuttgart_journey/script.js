document.addEventListener('DOMContentLoaded', () => {

    const artLayers = document.getElementById('art-layers');
    const SVG_NS = "http://www.w3.org/2000/svg";
    let activeStep = '';
    let animationFrameId;

    // --- High-Technique AudioEngine with Leitmotif ---
    class AudioEngine {
        constructor() { this.audioCtx = null; this.nodes = {}; this.leitmotifInterval = null; }
        _init() { if (!this.audioCtx) { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } if (this.audioCtx.state === 'suspended') { this.audioCtx.resume(); } }
        
        playLeitmotif(instrument = 'piano') {
            this.stopLeitmotif();
            const notes = [523.25, 587.33, 659.25, 783.99]; // C-D-E-G
            let noteIndex = 0;
            this.leitmotifInterval = setInterval(() => {
                const note = notes[noteIndex % notes.length];
                const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain(), filter = this.audioCtx.createBiquadFilter();
                gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.5);
                filter.type = 'lowpass';
                if (instrument === 'piano') { osc.type = 'triangle'; filter.frequency.value = 2000; } 
                else if (instrument === 'synth') { osc.type = 'sawtooth'; filter.frequency.value = 1200; } 
                else if (instrument === 'reverb') { osc.type = 'sine'; filter.frequency.value = 5000; }
                osc.frequency.value = note;
                osc.connect(filter).connect(gain).connect(this.audioCtx.destination);
                osc.start(); osc.stop(this.audioCtx.currentTime + 1.5);
                noteIndex++;
            }, (instrument === 'reverb') ? 1000 : 500);
        }
        stopLeitmotif() { clearInterval(this.leitmotifInterval); }

        fadeTo(soundName, options) {
            Object.keys(this.nodes).forEach(key => {
                if (key !== soundName) {
                    const node = this.nodes[key];
                    if (node && node.gain) node.gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.5);
                }
            });
            if (this.nodes[soundName]) {
                 this.nodes[soundName].gain.gain.linearRampToValueAtTime(options.volume, this.audioCtx.currentTime + 1.5);
            } else { this.playSound(soundName, options); }
        }

        playSound(name, options = {}) {
            this._init();
            const source = this.audioCtx.createBufferSource(), gain = this.audioCtx.createGain(), filter = this.audioCtx.createBiquadFilter();
            source.buffer = this._createNoiseBuffer(); source.loop = true;
            filter.type = options.filter_type || 'lowpass';
            filter.frequency.value = options.filter_freq || 1000;
            gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(options.volume, this.audioCtx.currentTime + 2);
            source.connect(filter).connect(gain).connect(this.audioCtx.destination);
            source.start(); this.nodes[name] = { source, gain };
        }
        _createNoiseBuffer() { const bufferSize = this.audioCtx.sampleRate * 2, buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate); const output = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; } return buffer; }
    }
    const audio = new AudioEngine();

    // --- High-Technique VisualEngine ---
    class VisualEngine {
        constructor() { this.elements = {}; }
        createLayer(id) { const layer = document.createElementNS(SVG_NS, 'g'); layer.id = id; layer.classList.add('visual-layer'); artLayers.appendChild(layer); this.elements[id] = layer; return layer; }
        show(id) { setTimeout(() => this.elements[id]?.classList.add('visible'), 100); }
        
        createParallaxForest() {
            const colors = ['#1e4d2b', '#2a6f44', '#358659'];
            for (let i = 0; i < 3; i++) {
                const layer = this.createLayer(`forest-layer-${i}`);
                layer.dataset.parallaxSpeed = 0.2 + i * 0.2;
                for (let j = 0; j < 15; j++) {
                    const tree = document.createElementNS(SVG_NS, 'path');
                    const x = Math.random() * 800;
                    tree.setAttribute('d', `M${x} 600 V ${100 + Math.random() * 200} L ${x - 20 - i*10} 600 Z M${x} 600 V ${100 + Math.random() * 200} L ${x + 20 + i*10} 600 Z`);
                    tree.setAttribute('fill', colors[i]);
                    tree.setAttribute('opacity', 0.6 + i*0.15);
                    layer.appendChild(tree);
                }
                this.show(`forest-layer-${i}`);
            }
        }
        createSchlossplatz() {
            const layer = this.createLayer('schlossplatz-layer');
            const oldCastle = document.createElementNS(SVG_NS, 'path');
            oldCastle.setAttribute('d', 'M50 450 V200 h50 v-50 h50 v50 h200 V450 Z M125 150 h50 v50 h-50 Z'); oldCastle.setAttribute('fill', '#8b5e34');
            const museum = document.createElementNS(SVG_NS, 'rect');
            museum.setAttribute('x', 450); museum.setAttribute('y', 200); museum.setAttribute('width', 300); museum.setAttribute('height', 250); museum.setAttribute('fill', 'rgba(44, 62, 80, 0.8)'); museum.setAttribute('stroke', 'rgba(236, 240, 241, 0.5)');
            layer.append(oldCastle, museum); this.show('schlossplatz-layer');
        }
        createAutoBlueprint() {
            const layer = this.createLayer('auto-layer');
            layer.innerHTML = '<rect width="800" height="600" fill="#2c3e50" />';
            const grid = document.createElementNS(SVG_NS, 'path');
            grid.setAttribute('d', 'M0 300 H800 M400 0 V600'); grid.setAttribute('stroke', 'rgba(127, 140, 141, 0.1)');
            const carPaths = [ 'M100 400 C 150 250, 650 250, 700 400', 'M150 400 C 180 350, 250 360, 280 400', 'M520 400 C 550 350, 620 360, 650 400', 'M200 450 A 50 50 0 0 1 300 450 A 50 50 0 0 1 200 450', 'M500 450 A 50 50 0 0 1 600 450 A 50 50 0 0 1 500 450' ];
            carPaths.forEach((d, i) => {
                const p = document.createElementNS(SVG_NS, 'path');
                p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#ecf0f1'); p.setAttribute('stroke-width', '4');
                p.classList.add('car-line'); p.style.animationDelay = `${i * 0.2}s`;
                layer.appendChild(p);
            });
            layer.prepend(grid); this.show('auto-layer');
        }
        createLibrary() {
            const layer = this.createLayer('library-layer');
            layer.innerHTML = '<rect width="800" height="600" fill="#1e272e" />';
            const lib = document.createElementNS(SVG_NS, 'path');
            lib.setAttribute('d', 'M200 500 l200 -100 v-250 l-200 100 Z M400 400 l200 100 v-250 l-200 -100 Z M200 500 l200 100 l200 -100 l-200 -100 Z');
            lib.setAttribute('fill', 'rgba(44, 62, 80, 0.9)'); lib.setAttribute('stroke', '#7f8c8d');
            for(let i=0; i<5; i++){
                const light = document.createElementNS(SVG_NS, 'rect');
                light.setAttribute('x', 210); light.setAttribute('y', 475 - i*30);
                light.setAttribute('width', 180); light.setAttribute('height', 20);
                light.setAttribute('fill', '#f1c40f'); light.setAttribute('filter', 'url(#glow-filter)');
                light.classList.add('library-light');
                light.style.transitionDelay = `${i*0.3}s`;
                layer.appendChild(light);
            }
            layer.appendChild(lib); this.show('library-layer');
            setTimeout(() => document.querySelectorAll('.library-light').forEach(l => l.classList.add('on')), 500);
        }
        createTwinklingCity() {
            const layer = this.createLayer('fernsehturm-layer');
            layer.innerHTML = '<rect width="800" height="600" fill="#0a1420" />';
            for(let i=0; i<200; i++) {
                const light = document.createElementNS(SVG_NS, 'circle');
                light.setAttribute('cx', Math.random()*800);
                light.setAttribute('cy', 300 + Math.random()*300);
                light.setAttribute('r', Math.random()*1.5);
                light.setAttribute('fill', '#f1c40f');
                light.classList.add('city-light');
                light.style.animationDelay = `${Math.random()*4}s`;
                layer.appendChild(light);
            }
            this.show('fernsehturm-layer');
        }
    }
    const visuals = new VisualEngine();

    // --- Timeline & Observer ---
    const stepActions = {
        forest: () => { artLayers.innerHTML = ''; audio.stopLeitmotif(); audio.fadeTo('wind', {volume: 0.1, filter_type:'lowpass', filter_freq: 400}); audio.playLeitmotif('piano'); visuals.createParallaxForest(); },
        schlossplatz: () => { artLayers.innerHTML = ''; audio.stopLeitmotif(); audio.fadeTo('city', {volume: 0.04, filter_type:'bandpass', filter_freq: 800}); audio.playLeitmotif('piano'); visuals.createSchlossplatz(); },
        auto: () => { artLayers.innerHTML = ''; audio.fadeTo('city', {volume: 0}); audio.playLeitmotif('synth'); visuals.createAutoBlueprint(); },
        bibliothek: () => { artLayers.innerHTML = ''; audio.fadeTo('city', {volume: 0}); audio.playLeitmotif('reverb'); visuals.createLibrary(); },
        fernsehturm: () => { artLayers.innerHTML = ''; audio.fadeTo('city', {volume: 0.02, filter_type:'bandpass', filter_freq: 1200}); audio.fadeTo('wind', {volume: 0.05, filter_type:'lowpass', filter_freq: 200}); audio.playLeitmotif('piano'); visuals.createTwinklingCity(); },
    };

    function mainAnimationLoop() {
        if (activeStep === 'forest') {
            const scrollY = window.scrollY;
            document.querySelectorAll('[data-parallax-speed]').forEach(layer => {
                const speed = layer.dataset.parallaxSpeed;
                layer.setAttribute('transform', `translate(0, ${scrollY * speed * 0.1})`);
            });
        }
        animationFrameId = requestAnimationFrame(mainAnimationLoop);
    }
    
    function initExperience() {
        document.getElementById('entry-overlay').style.opacity = 0;
        document.getElementById('entry-overlay').style.visibility = 'hidden';
        audio._init();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const stepId = entry.target.dataset.step;
                if (entry.isIntersecting) {
                    activeStep = stepId;
                    entry.target.classList.add('active');
                    if (stepActions[stepId]) stepActions[stepId]();
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, { threshold: 0.6 });

        document.querySelectorAll('.story-step').forEach(step => observer.observe(step));
        mainAnimationLoop();
    }

    document.getElementById('enter-btn').addEventListener('click', initExperience, { once: true });
});