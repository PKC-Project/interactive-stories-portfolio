document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const wordText = document.getElementById('word-text');
    const eraTitle = document.getElementById('era-title');
    const eraDescription = document.getElementById('era-description');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // NLD Result: Generate a JS class to handle PROCEDURAL audio playback
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
            this.activeLoops = {};
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        play(name) {
            this._init();
            const now = this.audioCtx.currentTime;
            
            if (name === 'click') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain).connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (name === 'quill_scratch') {
                this.stopAllLoops();
                const noise = this.audioCtx.createBufferSource();
                const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 2, this.audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                noise.loop = true;
                const filter = this.audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 3000;
                filter.Q.value = 20;
                const gain = this.audioCtx.createGain();
                gain.gain.value = 0.05;
                noise.connect(filter).connect(gain).connect(this.audioCtx.destination);
                noise.start();
                this.activeLoops['quill'] = noise;
            } else if (name === 'lute_pluck') {
                this.stopAllLoops();
                const notes = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4
                const interval = setInterval(() => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    osc.type = 'sine'; // Simplified lute sound
                    osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
                    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.8);
                    osc.connect(gain).connect(this.audioCtx.destination);
                    osc.start();
                    osc.stop(this.audioCtx.currentTime + 1);
                }, 1000 + Math.random() * 500);
                this.activeLoops['lute'] = { stop: () => clearInterval(interval) };
            } else if (name === 'chisel_hit') {
                const noise = this.audioCtx.createBufferSource();
                const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.1, this.audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                const filter = this.audioCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 5000;
                const gain = this.audioCtx.createGain();
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                noise.connect(filter).connect(gain).connect(this.audioCtx.destination);
                noise.start();
            } else if (name === 'pie_drone') {
                this.stopAllLoops();
                const osc = this.audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 60; // Deep hum
                const gain = this.audioCtx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 5);
                osc.connect(gain).connect(this.audioCtx.destination);
                osc.start();
                this.activeLoops['drone'] = osc;
            }
        }
        stopAllLoops() {
            Object.values(this.activeLoops).forEach(loop => loop.stop());
            this.activeLoops = {};
        }
    }

    const audio = new AudioEngine();

    // NLD Result: Generate the timeline data for the word "Captain"
    const timeline = [
        {
            word: "Captain",
            era: "Modern English",
            description: "The commander of a vessel, such as a ship or aircraft. Also used more broadly for a leader of a team or group. Its strong naval connotation is its most recognized modern meaning.",
            theme: "modern",
            font: "'Poppins', sans-serif",
            textColor: "var(--text-modern)",
            audio: "click"
        },
        {
            word: "Capitayn",
            era: "Middle English",
            description: "Entering English from Old French around 1300, 'capitayn' referred to a military leader or a chieftain. The term was generalized, losing some of its specific noble context.",
            theme: "middle-english",
            font: "'Cinzel', serif",
            textColor: "var(--text-parchment)",
            audio: "quill_scratch"
        },
        {
            word: "Capitain",
            era: "Old French",
            description: "After the Norman Conquest of England in 1066, this French term for a military commander or nobleman became influential. It signified a position of high authority.",
            theme: "old-french",
            font: "'Cinzel', serif",
            textColor: "var(--text-tapestry)",
            audio: "lute_pluck"
        },
        {
            word: "Capitaneus",
            era: "Late Latin",
            description: "Meaning 'chief' or 'prominent,' this term derives from the classical Latin word 'caput,' meaning 'head.' It literally described the 'head man' of a group.",
            theme: "latin",
            font: "'Cinzel', serif",
            textColor: "var(--text-stone)",
            audio: "chisel_hit"
        },
        {
            word: "*kaput-",
            era: "Proto-Indo-European (Root)",
            description: "The reconstructed, theoretical origin. This ancient root simply meant 'head' and is the common ancestor of 'captain,' 'capital,' 'chapter,' 'chef,' and many other words across languages.",
            theme: "pie",
            font: "'Poppins', sans-serif",
            textColor: "var(--text-nebula)",
            audio: "pie_drone"
        }
    ];

    let currentIndex = 0;

    function updateStage(index) {
        const stage = timeline[index];

        document.body.className = stage.theme;
        document.body.style.color = stage.textColor;

        eraTitle.textContent = stage.era;
        eraDescription.textContent = stage.description;

        wordText.innerHTML = '';
        wordText.style.fontFamily = stage.font;
        wordText.style.textShadow = (stage.theme === 'pie') ? '0 0 15px #fff' : 'none';
        
        stage.word.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'letter';
            span.style.animationDelay = `${i * 0.05}s`;
            wordText.appendChild(span);
            if (stage.audio === 'chisel_hit') {
                setTimeout(() => audio.play('chisel_hit'), i * 50);
            }
        });

        if (stage.audio !== 'chisel_hit') {
            audio.play(stage.audio);
        }

        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === timeline.length - 1;
    }

    nextBtn.addEventListener('click', () => {
        if (currentIndex < timeline.length - 1) {
            currentIndex++;
            updateStage(currentIndex);
            audio.play('click');
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateStage(currentIndex);
            audio.play('click');
        }
    });

    updateStage(0);
});