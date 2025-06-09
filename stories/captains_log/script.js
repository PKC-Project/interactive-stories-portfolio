document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const stardateDisplay = document.getElementById('stardate-display');
    const logText = document.getElementById('log-text');
    const newLogBtn = document.getElementById('new-log-btn');

    // NLD Result: Generate a JS class to handle PROCEDURAL audio playback
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        play(name) {
            this._init();
            const now = this.audioCtx.currentTime;
            
            if (name === 'beep') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now); // A4 note
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain).connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (name === 'typing_click') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(4000, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain).connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            }
        }
    }

    const audio = new AudioEngine();

    // NLD Result: Generate JS arrays of sci-fi tropes
    const planets = ['a Class-M planet', 'a rogue gas giant', 'an unstable nebula', 'a derelict space station', 'a pre-warp civilization', 'an artificial ring world'];
    const inhabitants = ['a race of crystalline beings', 'a silicon-based lifeform', 'a non-corporeal energy entity', 'a hive-mind of insectoids', 'a species of peaceful philosophers', 'a forgotten Federation colony'];
    const communication = ['who communicate through complex musical tones', 'who communicate via controlled plasma bursts', 'who communicate telepathically', 'who do not communicate, only observe', 'who communicate through intricate light patterns', 'who communicate by altering local probability'];
    const threat = ['and are threatened by a temporal anomaly', 'and are facing an imminent solar flare', 'and are being consumed by a grey goo nanoplague', 'and are caught in a territorial dispute with the Gorn', 'and are suffering from a planet-wide memory virus', 'and are guarding a powerful, ancient artifact'];

    // NLD Result: Generate a function to create a random stardate
    function generateStardate() {
        const main = Math.floor(Math.random() * (50000 - 40000) + 40000);
        const sub = Math.floor(Math.random() * 10);
        return `${main}.${sub}`;
    }

    // NLD Result: Generate a function to construct the log entry text
    function generateLogEntry() {
        const planet = planets[Math.floor(Math.random() * planets.length)];
        const inhabitant = inhabitants[Math.floor(Math.random() * inhabitants.length)];
        const comm = communication[Math.floor(Math.random() * communication.length)];
        const thr = threat[Math.floor(Math.random() * threat.length)];

        return `Captain's log, supplemental.\n\nThe Enterprise has arrived at ${planet} inhabited by ${inhabitant}, ${comm}. Our mission is to observe, but initial scans indicate they are in peril, ${thr}. We will proceed with caution.\n\nKirk out.`;
    }

    // NLD Result: Generate JS to display text with a typing animation
    function typeText(element, text) {
        element.textContent = '';
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                if (text.charAt(i) !== ' ' && text.charAt(i) !== '\n') {
                    audio.play('typing_click');
                }
                i++;
            } else {
                clearInterval(interval);
            }
        }, 30); // Typing speed in milliseconds
    }

    // NLD Result: Generate JS to bind the logic to the button click
    newLogBtn.addEventListener('click', () => {
        // Ensure audio context is started by user gesture
        audio._init();
        audio.play('beep');

        stardateDisplay.textContent = `STARDATE: ${generateStardate()}`;
        const newLog = generateLogEntry();
        typeText(logText, newLog);
    });

});