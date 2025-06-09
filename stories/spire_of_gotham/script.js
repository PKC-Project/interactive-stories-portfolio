document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const visualPane = document.getElementById('visual-pane');
    const storyBeats = document.querySelectorAll('.story-beat');
    const audioToggle = document.getElementById('audio-toggle');
    const citySkylineBG = document.getElementById('city-skyline-bg');
    const citySkylineFG = document.getElementById('city-skyline-fg');
    
    // --- Audio Icon SVGs ---
    const soundOnIcon = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>`;
    const soundOffIcon = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>`;

    // --- Procedural Audio Engine ---
    class AudioEngine {
        constructor() {
            this.audioCtx = null; this.isMuted = true; this.masterGain = null;
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.connect(this.audioCtx.destination);
            this.masterGain.gain.value = this.isMuted ? 0 : 1;
        }
        play(name) {
            if (this.isMuted) return; this._init(); const now = this.audioCtx.currentTime;
            if (name === 'elevator_open') {
                const noise = this.audioCtx.createBufferSource(), buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate*1.5, this.audioCtx.sampleRate), data=buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random()*2-1; noise.buffer=buffer;
                const filter=this.audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=800;
                const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.2, now+0.1); gain.gain.linearRampToValueAtTime(0, now+1.2);
                noise.connect(filter).connect(gain).connect(this.masterGain); noise.start(now);
            } else if (name === 'thunder_crack') {
                const noise=this.audioCtx.createBufferSource(), buffer=this.audioCtx.createBuffer(1,this.audioCtx.sampleRate*1,this.audioCtx.sampleRate), data=buffer.getChannelData(0);
                for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1; noise.buffer=buffer;
                const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.8, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                noise.connect(gain).connect(this.masterGain); noise.start(now);
            }
        }
        toggleMute() {
            this.isMuted = !this.isMuted; if (!this.isMuted) this._init();
            if (this.masterGain) { this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.audioCtx.currentTime); }
            updateAudioButton(this.isMuted);
        }
    }

    const audio = new AudioEngine();
    function updateAudioButton(isMuted) { audioToggle.innerHTML = isMuted ? soundOffIcon : soundOnIcon; }

    // --- Scene Management Engine ---
    let currentScene = '';
    function updateScene(sceneName) {
        if (sceneName === currentScene) return;
        currentScene = sceneName;
        visualPane.className = `scene-${sceneName}`;
        if (sceneName === 'doors-open') audio.play('elevator_open');
        if (sceneName === 'lightning-strike') audio.play('thunder_crack');
    }

    // Parallax & Scroll Logic
    window.addEventListener('scroll', () => {
        const scrollableScenes = ['ascent', 'sky-view'];
        if (scrollableScenes.includes(currentScene)) {
            const startElement = document.querySelector('[data-scene="ascent"]');
            const startOffset = startElement.offsetTop;
            const sceneHeight = startElement.offsetHeight;
            const relativeScroll = window.scrollY - startOffset;
            const progress = Math.max(0, Math.min(1, relativeScroll / sceneHeight));
            citySkylineFG.style.transform = `translateY(${100 - progress * 50}px)`;
            citySkylineBG.style.transform = `translateY(${150 - progress * 25}px)`;
        }
    });

    // --- Intersection Observer Setup ---
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.5 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateScene(entry.target.dataset.scene);
            }
        });
    }, observerOptions);

    storyBeats.forEach(beat => observer.observe(beat));

    // --- Initial Call ---
    audioToggle.addEventListener('click', () => audio.toggleMute());
    updateAudioButton(audio.isMuted);
});