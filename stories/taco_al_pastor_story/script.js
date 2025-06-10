document.addEventListener('DOMContentLoaded', () => {

    const artLayers = document.getElementById('art-layers');
    const SVG_NS = "http://www.w3.org/2000/svg";
    let activeStep = '';

    // --- Audio Synthesis Engine ---
    class AudioEngine {
        constructor() { this.audioCtx = null; this.nodes = {}; }
        _init() { if (this.audioCtx) return; this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (this.audioCtx.state === 'suspended') { this.audioCtx.resume(); } }
        
        crossfade(newSound) {
            Object.values(this.nodes).forEach(node => node.gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1));
            setTimeout(() => { Object.values(this.nodes).forEach(n => { if (n.source) n.source.stop(); if (n.interval) clearInterval(n.interval); }); this.nodes = {}; if (newSound) this.play(newSound); }, 1000);
        }
        
        play(sound) {
            this._init(); const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0, this.audioCtx.currentTime); gain.gain.linearRampToValueAtTime(sound.volume, this.audioCtx.currentTime + 1.5); gain.connect(this.audioCtx.destination); let source, interval;
            if (sound.type === 'noise') {
                source = this.audioCtx.createBufferSource(); source.buffer = this._createNoiseBuffer(); source.loop = true;
                const filter = this.audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = sound.freq; filter.Q.value = 50;
                source.connect(filter).connect(gain); source.start();
            } else {
                interval = setInterval(() => {
                    const osc = this.audioCtx.createOscillator(), g = this.audioCtx.createGain();
                    osc.type = sound.wave || 'sine'; osc.frequency.value = sound.freq[Math.floor(Math.random() * sound.freq.length)];
                    if(sound.lfo_freq) { // For the alchemy bubbling sound
                        const lfo = this.audioCtx.createOscillator(); lfo.frequency.value = sound.lfo_freq;
                        const lfoGain = this.audioCtx.createGain(); lfoGain.gain.value = 20;
                        lfo.connect(lfoGain).connect(osc.frequency); lfo.start(); lfo.stop(this.audioCtx.currentTime + sound.duration);
                    }
                    g.gain.setValueAtTime(0.15, this.audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + sound.duration);
                    osc.connect(g).connect(gain); osc.start(); osc.stop(this.audioCtx.currentTime + sound.duration);
                }, sound.tempo);
            }
            this.nodes[sound.name] = { gain, source, interval };
        }
        _createNoiseBuffer() { const s = this.audioCtx.sampleRate, b = this.audioCtx.createBuffer(1, s, s), o = b.getChannelData(0); for (let i = 0; i < s; i++) o[i] = Math.random() * 2 - 1; return b; }
    }
    const audio = new AudioEngine();

    // --- High-Technique VisualEngines ---
    // NLD Result: Re-usable function to create the trompo at different stages
    function createTrompo(color) {
        return `<g transform="translate(400, 300)">
                    <path d="M 0,-150 L 0,150" stroke="#455a64" stroke-width="10" />
                    <path id="trompo-path" d="M 0,-120 C 70,-120 70,120 0,120 C -70,120 -70,-120 0,-120 Z" fill="${color}" />
                    <path d="M 0,-140 C 20,-140 20,-120 0,-120 C -20,-120 -20,-140 0,-140 Z" fill="#f1c40f" />
                </g>`;
    }

    const visualActions = {
        ottoman: () => {
            artLayers.innerHTML = `<rect width="800" height="600" fill="#a07c5b" />
                <path d="M100 600 V 200 A 300 300 0 0 1 700 200 V 600" fill="#d3a375" />
                <g transform="translate(400, 300)">
                    <path d="M 0,-150 L 0,150" stroke="#455a64" stroke-width="10" />
                    <path d="M 0,-100 C 60,-100 60,100 0,100 C -60,100 -60,-100 0,-100 Z" fill="#b08968" />
                </g>`;
        },
        voyage: () => {
            artLayers.innerHTML = `<rect width="800" height="600" fill="#3498db" />
                <path id="voyage-line" d="M100 400 C 300 100, 500 500, 700 200" fill="none" stroke="white" stroke-width="3" stroke-dasharray="10 10"/>`;
        },
        fusion: () => {
            // FIX: Trompo is now un-marinated pork color
            artLayers.innerHTML = `<rect width="800" height="600" fill="#e67e22" />` + createTrompo('#f8d7da');
        },
        alchemy: () => {
            // FIX: Start with the un-marinated trompo, then transform it
            artLayers.innerHTML = `<rect width="800" height="600" fill="#2c3e50" />` + createTrompo('#f8d7da');
            
            // Add swirling marinade paths
            const swirlGroup = document.createElementNS(SVG_NS, 'g');
            for (let i = 0; i < 7; i++) {
                const path = document.createElementNS(SVG_NS, 'path');
                const d = `M${400 + (Math.random()-0.5)*100},600 C${400+(Math.random()-0.5)*200},400 ${400+(Math.random()-0.5)*200},200 ${400+(Math.random()-0.5)*100},0`;
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', '#c0392b');
                path.setAttribute('stroke-width', 10 + Math.random()*15);
                path.setAttribute('opacity', '0.6');
                path.classList.add('swirl-path');
                path.style.animationDelay = `${i * 0.15}s`;
                swirlGroup.appendChild(path);
            }
            artLayers.appendChild(swirlGroup);
            
            // Trigger the color change on the trompo meat
            setTimeout(() => {
                document.getElementById('trompo-path').style.fill = '#bf360c';
            }, 500);
        },
        icon: () => {
            artLayers.innerHTML = `<rect width="800" height="600" fill="#ecf0f1" />
                <g transform="translate(400, 300) scale(1.5)">
                    <path d="M -80,80 C -80,20 80,20 80,80 Z" fill="#f5e6c4" />
                    <g fill="#bf360c">
                        <path d="M-60 60 C -40 40, 0 40, 20 60 Z"/>
                        <path d="M-50 70 C -30 50, 10 50, 30 70 Z"/>
                    </g>
                    <g fill="#27ae60"><circle cx="-20" cy="50" r="5"/><circle cx="0" cy="55" r="5"/><circle cx="20" cy="50" r="5"/></g>
                </g>`;
        }
    };
    
    // --- Timeline & Audio Cues ---
    const soundscapes = {
        ottoman: {name: 'oud', type: 'rhythm', wave: 'sawtooth', freq: [293, 329, 349, 392], tempo: 500, duration: 0.4, volume: 0.1},
        voyage: {name: 'ocean', type: 'noise', filter_type: 'lowpass', freq: 400, volume: 0.2},
        fusion: {name: 'guitar', type: 'rhythm', wave: 'triangle', freq: [392, 440, 523, 659], tempo: 300, duration: 0.3, volume: 0.15},
        // FIX: New audio for the alchemy step
        alchemy: {name: 'alchemy_sound', type: 'rhythm', wave: 'sine', freq: [100, 120, 140], lfo_freq: 5, tempo: 200, duration: 0.8, volume: 0.1},
        icon: {name: 'final-guitar', type: 'rhythm', wave: 'triangle', freq: [392, 440, 523, 659, 783], tempo: 200, duration: 0.2, volume: 0.2}
    };

    function setActiveStep(stepId) {
        if (activeStep === stepId) return;
        activeStep = stepId;
        if(visualActions[stepId]) visualActions[stepId]();
        if(soundscapes[stepId]) audio.crossfade(soundscapes[stepId]);
    }
    
    function initExperience() {
        document.getElementById('entry-overlay').style.opacity = 0;
        document.getElementById('entry-overlay').style.visibility = 'hidden';
        audio._init();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    setActiveStep(entry.target.dataset.step);
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, { threshold: 0.6 });
        document.querySelectorAll('.story-step').forEach(step => observer.observe(step));
    }
    
    document.getElementById('enter-btn').addEventListener('click', initExperience, { once: true });
});