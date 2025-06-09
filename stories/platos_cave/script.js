document.addEventListener('DOMContentLoaded', () => {

    const visualPane = document.getElementById('visual-pane');
    const storyBeats = document.querySelectorAll('.story-beat');
    const audioToggle = document.getElementById('audio-toggle');
    const caveWalls = document.getElementById('cave-walls');
    const caveExit = document.getElementById('cave-exit');

    const soundOnIcon = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>`;
    const soundOffIcon = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>`;

    class AudioEngine {
        constructor() {
            this.audioCtx = null; this.activeLoops = {}; this.isMuted = true; this.masterGain = null;
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.connect(this.audioCtx.destination);
            this.masterGain.gain.value = this.isMuted ? 0 : 1;
        }
        play(name) {
            if (this.isMuted) return; this._init(); this.stopAllLoops(); const now = this.audioCtx.currentTime;
            if (name === 'cave_ambiance') {
                const gain = this.audioCtx.createGain(); gain.gain.value = 0.05;
                const rumble = this.audioCtx.createOscillator(); rumble.type = 'sine'; rumble.frequency.value = 50;
                rumble.connect(gain).connect(this.masterGain); rumble.start();
                this.activeLoops['rumble'] = rumble;
                const dripInterval = setInterval(() => {
                    if (this.isMuted) return;
                    const osc = this.audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 800;
                    const dripGain = this.audioCtx.createGain(); dripGain.gain.setValueAtTime(0.5, this.audioCtx.currentTime); dripGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
                    const delay = this.audioCtx.createDelay(2.0); delay.delayTime.value = Math.random() * 0.5 + 0.2;
                    const feedback = this.audioCtx.createGain(); feedback.gain.value = 0.6;
                    osc.connect(dripGain).connect(delay); delay.connect(feedback).connect(delay);
                    delay.connect(this.masterGain);
                    osc.start(); osc.stop(this.audioCtx.currentTime + 0.3);
                }, 3000);
                this.activeLoops['drips'] = { stop: () => clearInterval(dripInterval) };
            } else if (name === 'sensory_overload') {
                const osc = this.audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 2000;
                const lfo = this.audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5;
                const lfoGain = this.audioCtx.createGain(); lfoGain.gain.value = 10;
                lfo.connect(lfoGain).connect(osc.frequency);
                const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 4);
                osc.connect(gain).connect(this.masterGain);
                osc.start(); lfo.start();
                this.activeLoops['overload'] = { stop: () => { osc.stop(); lfo.stop(); } };
            } else if (name === 'nature_sounds') {
                const createChirp = () => {
                    if (this.isMuted) return;
                    const now = this.audioCtx.currentTime;
                    const osc = this.audioCtx.createOscillator(); osc.type = 'sine';
                    const gain = this.audioCtx.createGain();
                    const freq = 3000 + Math.random() * 1000;
                    osc.frequency.setValueAtTime(freq, now);
                    osc.frequency.exponentialRampToValueAtTime(freq - 500, now + 0.2);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.connect(gain).connect(this.masterGain);
                    osc.start(); osc.stop(now + 0.2);
                };
                const chirpInterval = setInterval(createChirp, 800 + Math.random() * 1000);
                this.activeLoops['birdsong'] = { stop: () => clearInterval(chirpInterval) };
            }
        }
        stopAllLoops() { Object.values(this.activeLoops).forEach(loop => { if (loop.stop) loop.stop(); }); this.activeLoops = {}; }
        toggleMute() {
            this.isMuted = !this.isMuted; if (!this.isMuted) this._init();
            if (this.masterGain) { this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.audioCtx.currentTime); }
            updateAudioButton(this.isMuted);
            if (!this.isMuted) { updateScene(currentScene, true); } else { this.stopAllLoops(); }
        }
    }

    const audio = new AudioEngine();
    function updateAudioButton(isMuted) { audioToggle.innerHTML = isMuted ? soundOffIcon : soundOnIcon; }

    let currentScene = '';
    function updateScene(sceneName, forceRestart = false) {
        if (sceneName === currentScene && !forceRestart) return;
        currentScene = sceneName;
        visualPane.className = `scene-${sceneName}`;
        switch (sceneName) {
            case 'cave': audio.play('cave_ambiance'); break;
            case 'sun': audio.play('sensory_overload'); break;
            case 'real-world': audio.play('nature_sounds'); break;
            default: audio.stopAllLoops();
        }
    }

    window.addEventListener('scroll', () => {
        if (currentScene === 'ascent') {
            const startElement = document.querySelector('[data-scene="ascent"]');
            const startOffset = startElement.offsetTop;
            const sceneHeight = startElement.offsetHeight;
            const relativeScroll = window.scrollY - startOffset;
            const progress = Math.max(0, Math.min(1, relativeScroll / sceneHeight));
            caveWalls.style.transform = `translateY(${-progress * 200}px)`;
            caveExit.style.transform = `translateY(${-progress * 50}px) scale(${1 + progress * 2})`;
        }
    });

    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.5 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateScene(entry.target.dataset.scene);
            }
        });
    }, observerOptions);

    storyBeats.forEach(beat => observer.observe(beat));

    audioToggle.addEventListener('click', () => audio.toggleMute());
    updateAudioButton(audio.isMuted);
});