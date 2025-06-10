document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection & Global State ---
    const standbyScreen = document.getElementById('standby-screen');
    const transitionScreen = document.getElementById('transition-screen');
    const dimensionScreen = document.getElementById('dimension-screen');
    const portalGun = document.getElementById('portal-gun-container');
    const restartBtn = document.getElementById('restart-btn');
    const portalEllipse = transitionScreen.querySelector('ellipse');
    const dimensionBackground = document.getElementById('dimension-background');
    const showTitle = document.getElementById('show-title');
    const showLogline = document.getElementById('show-logline');
    
    // --- Audio Synthesis Engine ---
    class AudioEngine {
        constructor() { this.audioCtx = null; }
        _init() { if (this.audioCtx) return; this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); }
        
        playPortalOpen() {
            this._init();
            const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(1000, this.audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.7);
            osc.connect(gain).connect(this.audioCtx.destination);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.7);
        }
        
        playJingle(notes) {
            this._init();
            notes.forEach((note, i) => {
                const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(this._noteToFreq(note), this.audioCtx.currentTime + i * 0.2);
                gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + i * 0.2 + 0.15);
                osc.connect(gain).connect(this.audioCtx.destination);
                osc.start(this.audioCtx.currentTime + i * 0.2);
                osc.stop(this.audioCtx.currentTime + i * 0.2 + 0.15);
            });
        }
        _noteToFreq(note) { const A4 = 440; return A4 * Math.pow(2, (note - 69) / 12); }
    }
    const audio = new AudioEngine();

    // --- NLD Result: Generative Engines for Content ---
    const generator = {
        // --- Visual Generation ---
        createBackground: () => {
            const hue = Math.random() * 360;
            return `background: linear-gradient(to bottom, hsl(${hue}, 70%, 50%), hsl(${hue + 60}, 70%, 30%));`;
        },
        // --- Narrative Generation ---
        createTitle: () => {
            const adjectives = ['Sentient', 'Extreme', 'Galactic', 'Turbo', 'Chronicles of', 'The Real Animated Adventures of'];
            const nouns = ['Toaster', 'Chair', 'Breakfast', 'Lawn Mowing', 'Ball Fondlers', 'Ants in my Eyes Johnson'];
            return `${adjectives[Math.floor(Math.random()*adjectives.length)]} ${nouns[Math.floor(Math.random()*nouns.length)]}`;
        },
        createLogline: () => {
            const premises = ['chairs sit on people', 'everything is on a cob', 'hamsters rule the galaxy', 'the world is made of tiny Ricks'];
            const heroes = ['one man', 'a lone gerbil', 'two brothers', 'a regular old plumbus'];
            const goals = ['find the comfiest couch', 'run really fast in a wheel', 'go on adventures', 'buy some carpet'];
            return `In a world where ${premises[Math.floor(Math.random()*premises.length)]}, ${heroes[Math.floor(Math.random()*heroes.length)]} must ${goals[Math.floor(Math.random()*goals.length)]}.`;
        },
        // --- Audio Generation ---
        createJingle: () => {
            const scale = [60, 62, 64, 65, 67, 69, 71]; // C Major scale
            return Array.from({length: 5}, () => scale[Math.floor(Math.random() * scale.length)]);
        }
    };

    // --- The Main Interaction Function ---
    function firePortalGun() {
        // 1. Generate all content for the new dimension
        const backgroundStyle = generator.createBackground();
        const showTitleText = generator.createTitle();
        const showLoglineText = generator.createLogline();
        const jingleNotes = generator.createJingle();

        // 2. Play sounds and start visual transition
        audio.playPortalOpen();
        standbyScreen.classList.remove('active');
        transitionScreen.classList.add('active');
        
        // Animate portal opening
        portalEllipse.setAttribute('rx', '800');
        portalEllipse.setAttribute('ry', '600');

        // 3. After portal opens, show the new dimension
        setTimeout(() => {
            dimensionBackground.style = backgroundStyle;
            showTitle.textContent = showTitleText;
            showLogline.textContent = showLoglineText;
            
            transitionScreen.classList.remove('active');
            dimensionScreen.classList.add('active');
            
            audio.playJingle(jingleNotes);

            // Reset portal for next time
            portalEllipse.setAttribute('rx', '0');
            portalEllipse.setAttribute('ry', '0');
        }, 500); // Matches the CSS transition duration
    }

    // --- Event Listeners ---
    portalGun.addEventListener('click', firePortalGun);
    restartBtn.addEventListener('click', () => {
        dimensionScreen.classList.remove('active');
        firePortalGun();
    });
});