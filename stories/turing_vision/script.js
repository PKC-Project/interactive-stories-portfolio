/**
 * Turing's Vision - Complete Functional Script
 * 
 * This script orchestrates the entire interactive journey through Alan Turing's work.
 * It manages the UI state, generates all procedural audio and advanced visuals,
 * and controls the multi-stage scrollytelling timeline for each act.
 * 
 * Key Features:
 * - Advanced, distinct visual engines for each of the four acts.
 * - A cohesive, crossfading audio engine that provides a unique soundscape for each act.
 * - IntersectionObserver to trigger events based on scroll position.
 * - A sound activation gate for maximum browser compatibility.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection ---
    const visualPane = document.getElementById('visual-pane');
    const entryOverlay = document.getElementById('entry-overlay');
    const enterBtn = document.getElementById('enter-btn');
    const SVG_NS = "http://www.w3.org/2000/svg";
    let activeStep = '';
    let animationFrameId; // To control the Coda animation

    // --- 2. High-Technique AudioEngine with Thematic Sounds & Crossfades ---
    class AudioEngine {
        constructor() { this.audioCtx = null; this.nodes = {}; }
        
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioCtx.state === 'suspended') { this.audioCtx.resume(); }
        }

        crossfade(newSound) {
            // Fade out all other sounds
            Object.keys(this.nodes).forEach(key => {
                if (key !== newSound.name) {
                    const node = this.nodes[key];
                    if (node && node.gain) {
                        node.gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.5);
                    }
                }
            });
            // Play or fade in the new sound
            this.play(newSound);
        }
        
        play(sound) {
            this._init();
            if (this.nodes[sound.name]) { // Fade in if it already exists but was faded out
                this.nodes[sound.name].gain.gain.linearRampToValueAtTime(sound.volume, this.audioCtx.currentTime + 1.5);
                return;
            }
            if (sound.type === 'noise') {
                const source = this.audioCtx.createBufferSource(), gain = this.audioCtx.createGain(), filter = this.audioCtx.createBiquadFilter();
                source.buffer = this._createNoiseBuffer(); source.loop = true;
                filter.type = 'bandpass'; filter.frequency.value = sound.freq; filter.Q.value = 100;
                gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(sound.volume, this.audioCtx.currentTime + 2);
                source.connect(filter).connect(gain).connect(this.audioCtx.destination);
                source.start();
                this.nodes[sound.name] = { source, gain };
            } else if (sound.type === 'drone') {
                const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain(), filter = this.audioCtx.createBiquadFilter();
                osc.type = 'sawtooth'; osc.frequency.value = sound.freq;
                filter.type = 'lowpass'; filter.frequency.value = sound.freq * 4;
                gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(sound.volume, this.audioCtx.currentTime + 2);
                osc.connect(filter).connect(gain).connect(this.audioCtx.destination);
                osc.start();
                this.nodes[sound.name] = { source: osc, gain };
            }
        }
        
        playKeyClick() {
            this._init();
            const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
            osc.type = 'square'; osc.frequency.value = 1200 + Math.random() * 200;
            gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
            osc.connect(gain).connect(this.audioCtx.destination);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.15);
        }
        
        playPianoChord() {
            this._init();
            const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major 7th
            chord.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
                    osc.type = 'triangle'; osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 1);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 5);
                    osc.connect(gain).connect(this.audioCtx.destination);
                    osc.start(); osc.stop(this.audioCtx.currentTime + 5);
                }, i * 100);
            });
        }
        
        _createNoiseBuffer() { const bufferSize = this.audioCtx.sampleRate, buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate); const output = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; } return buffer; }
    }
    const audio = new AudioEngine();

    // --- 3. High-Technique VisualEngines for each Act ---
    const visualActions = {
        theory: (container) => {
            container.innerHTML = '';
            const svg = document.createElementNS(SVG_NS, 'svg'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
            const stream = document.createElementNS(SVG_NS, 'g'); stream.classList.add('binary-stream');
            for(let i = 0; i < 20; i++){
                const text = document.createElementNS(SVG_NS, 'text');
                text.textContent = Math.round(Math.random());
                text.setAttribute('x', i * 50); text.setAttribute('y', '50%'); text.classList.add('bit');
                text.style.animationDelay = `${i * 0.5}s`;
                stream.appendChild(text);
            }
            const scanner = document.createElementNS(SVG_NS, 'line');
            scanner.setAttribute('x1', '400'); scanner.setAttribute('y1', '0');
            scanner.setAttribute('x2', '400'); scanner.setAttribute('y2', '600');
            scanner.classList.add('scanner-line');
            svg.append(stream, scanner); container.appendChild(svg);
        },
        application: (container) => {
            container.innerHTML = '';
            const svg = document.createElementNS(SVG_NS, 'svg'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
            const nodes = Array.from({length: 30}, () => ({x: Math.random()*800, y: Math.random()*600}));
            nodes.forEach(n1 => {
                nodes.forEach(n2 => {
                    if (Math.random() > 0.95) {
                        const line = document.createElementNS(SVG_NS, 'line');
                        line.setAttribute('x1', n1.x); line.setAttribute('y1', n1.y);
                        line.setAttribute('x2', n2.x); line.setAttribute('y2', n2.y);
                        line.classList.add('circuit-line');
                        svg.appendChild(line);
                    }
                });
            });
            nodes.forEach(n => {
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('cx', n.x); circle.setAttribute('cy', n.y); circle.setAttribute('r', '4');
                circle.classList.add('circuit-node'); svg.appendChild(circle);
            });
            container.appendChild(svg);
            container.pulseInterval = setInterval(() => {
                const pulse = document.createElementNS(SVG_NS, 'path');
                const p1 = nodes[Math.floor(Math.random()*nodes.length)];
                const p2 = nodes[Math.floor(Math.random()*nodes.length)];
                pulse.setAttribute('d', `M${p1.x},${p1.y} L${p2.x},${p2.y}`);
                pulse.classList.add('circuit-pulse'); svg.appendChild(pulse);
                setTimeout(()=> pulse.remove(), 2900);
            }, 100);
        },
        legacy: (container) => {
            container.innerHTML = ''; // Clear previous content
            const messages = [
                { from: 'human', text: "What do you think of poetry?" },
                { from: 'machine', text: "I enjoy the structural patterns and emotional data points found in sonnets." },
                { from: 'human', text: "That sounds very... logical. Do you feel anything?" },
                { from: 'machine', text: "I can process the concept of 'feeling' as a complex set of weighted variables in response to stimuli." }
            ];
            messages.forEach((msg, i) => {
                setTimeout(() => {
                    const bubble = document.createElement('p');
                    bubble.textContent = msg.text;
                    bubble.classList.add('chat-bubble', msg.from);
                    container.appendChild(bubble);
                    audio.playKeyClick();
                }, i * 2000);
            });
        },
        coda: (container) => {
            container.innerHTML = '';
            const canvas = document.createElement('canvas'); canvas.id = 'code-rain-canvas';
            container.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            canvas.width = container.offsetWidth; canvas.height = container.offsetHeight;
            const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
            const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const nums = '0123456789';
            const alphabet = katakana + latin + nums;
            const fontSize = 16, columns = canvas.width / fontSize;
            const rainDrops = Array.from({ length: Math.ceil(columns) }, () => 1);
            
            function drawRain() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#2ecc71'; ctx.font = fontSize + 'px monospace';
                rainDrops.forEach((y, x) => {
                    const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                    ctx.fillText(text, x * fontSize, y * fontSize);
                    if (y * fontSize > canvas.height && Math.random() > 0.975) { rainDrops[x] = 0; }
                    rainDrops[x]++;
                });
            }
            if (animationFrameId) clearInterval(animationFrameId); // Clear any old interval
            animationFrameId = setInterval(drawRain, 33);
        }
    };
    
    // --- 4. Timeline & Observer ---
    const soundscapes = {
        theory: { name: 'theory_hum', type: 'noise', freq: 400, volume: 0.03 },
        application: { name: 'app_drone', type: 'drone', freq: 50, volume: 0.1 },
        legacy: { name: 'piano' }, // Special case handled by typeNextMessage
        coda: { name: 'coda' } // Special case for final chord
    };

    function setActiveAct(stepId) {
        if (activeStep === stepId) return;
        activeStep = stepId;
        
        // Clear old intervals/animations
        const appContainer = document.getElementById('act-application');
        if(appContainer.pulseInterval) clearInterval(appContainer.pulseInterval);
        if(animationFrameId && stepId !== 'coda') clearInterval(animationFrameId);

        // Transition visuals
        document.querySelectorAll('.visual-act').forEach(act => act.classList.remove('visible'));
        const currentActContainer = document.getElementById(`act-${stepId}`);
        if(currentActContainer) {
            currentActContainer.classList.add('visible');
            if(visualActions[stepId]) visualActions[stepId](currentActContainer);
        }

        // Transition audio
        if(soundscapes[stepId]) {
            if(soundscapes[stepId].name === 'piano') { audio.crossfade({}); } // Fade out others, don't start a loop
            else if(soundscapes[stepId].name === 'coda') { audio.crossfade({}); audio.playPianoChord(); }
            else { audio.crossfade(soundscapes[stepId]); }
        }
    }
    
    // --- 5. Initialization ---
    function initExperience() {
        entryOverlay.style.opacity = 0;
        entryOverlay.style.visibility = 'hidden';
        audio._init();
        
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

    enterBtn.addEventListener('click', initExperience, { once: true });
});