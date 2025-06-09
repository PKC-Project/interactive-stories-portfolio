document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const visualPane = document.getElementById('visual-pane');
    const storyBeats = document.querySelectorAll('.story-beat');
    const gatherBtn = document.getElementById('gather-btn');
    const miseText = document.getElementById('mise-text');
    const ingredients = {
        flour: document.getElementById('flour'),
        butter: document.getElementById('butter'),
        ricotta: document.getElementById('ricotta')
    };
    const ingredientData = {
        flour: "Flour: The foundation, creating the structure of our dough.",
        butter: "Butter: Provides richness and helps create flaky layers.",
        ricotta: "Ricotta: A fresh, creamy cheese for the sweet filling."
    };
    const kneadBtn = document.getElementById('knead-btn');
    const dustBtn = document.getElementById('dust-btn');
    const doughShape = document.getElementById('dough-shape');
    const fryingPastry = document.getElementById('frying-pastry');
    const platedPastries = document.getElementById('plated-pastries');

    // --- Audio Engine ---
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
            this.sizzleNode = null;
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        play(sound) {
            this._init();
            const now = this.audioCtx.currentTime;
            if (sound === 'clink') {
                const osc = this.audioCtx.createOscillator(); osc.type = 'sine';
                const gain = this.audioCtx.createGain();
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain).connect(this.audioCtx.destination);
                osc.start(now); osc.stop(now + 0.3);
            } else if (sound === 'dough_squish') {
                const noise = this.audioCtx.createBufferSource();
                const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.2, this.audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                const filter = this.audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600;
                const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
                noise.connect(filter).connect(gain).connect(this.audioCtx.destination); noise.start(now);
            } else if (sound === 'frying_sizzle') {
                if (this.sizzleNode) this.sizzleNode.stop();
                const noise = this.audioCtx.createBufferSource();
                const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 8, this.audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                const filter = this.audioCtx.createBiquadFilter(); filter.type = 'highpass';
                const gain = this.audioCtx.createGain();
                filter.frequency.setValueAtTime(2000, now); filter.frequency.linearRampToValueAtTime(8000, now + 4);
                gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 0.5); gain.gain.linearRampToValueAtTime(0, now + 7.5);
                noise.connect(filter).connect(gain).connect(this.audioCtx.destination); noise.start(now);
                this.sizzleNode = noise;
            } else if (sound === 'sugar_dust') {
                const noise = this.audioCtx.createBufferSource();
                const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 1, this.audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                const filter = this.audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 10000;
                const gain = this.audioCtx.createGain(); gain.gain.value = 0.05;
                noise.connect(filter).connect(gain).connect(this.audioCtx.destination); noise.start(now); noise.stop(now + 1);
            }
        }
    }
    const audio = new AudioEngine();

    // --- Scene Management ---
    let currentScene = '';
    function updateScene(sceneName) {
        if (sceneName === currentScene) return;
        currentScene = sceneName;
        visualPane.className = `scene-${sceneName}`;
        
        if (sceneName === 'frying') {
            audio.play('frying_sizzle');
            createBlisters();
        }
        if (sceneName === 'final') {
            createPlatedPastries();
        }
    }

    // --- Intersection Observer Setup ---
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.6 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateScene(entry.target.dataset.scene);
            }
        });
    }, observerOptions);
    storyBeats.forEach(beat => observer.observe(beat));

    // --- Interactive Logic ---
    gatherBtn.addEventListener('click', async () => {
        audio._init();
        gatherBtn.disabled = true;
        
        const wait = ms => new Promise(res => setTimeout(res, ms));
        
        miseText.textContent = ingredientData.flour;
        await wait(1500);
        ingredients.flour.classList.add('gathering');
        audio.play('clink');
        await wait(1000);

        miseText.textContent = ingredientData.butter;
        await wait(1500);
        ingredients.butter.classList.add('gathering');
        audio.play('clink');
        await wait(1000);
        
        miseText.textContent = ingredientData.ricotta;
        await wait(1500);
        ingredients.ricotta.classList.add('gathering');
        audio.play('clink');
        await wait(1500);

        // NLD REFINEMENT: Seamlessly transition to the next visual state
        visualPane.classList.remove('scene-mise');
        visualPane.classList.add('scene-dough');
        currentScene = 'dough'; // Manually update scene to prevent observer conflicts
        miseText.textContent = "All ingredients are ready. Scroll down to begin making the dough.";
    });

    kneadBtn.addEventListener('click', () => {
        audio.play('dough_squish');
        doughShape.classList.add('kneading');
        doughShape.addEventListener('animationend', () => {
            doughShape.classList.remove('kneading');
        }, { once: true });
    });
    
    dustBtn.addEventListener('click', () => {
        audio.play('sugar_dust');
        const finalView = document.getElementById('final-view');
        for (let i = 0; i < 50; i++) {
            const dust = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dust.setAttribute('cx', Math.random() * 400 + 200);
            dust.setAttribute('cy', '0');
            dust.setAttribute('r', Math.random() * 2 + 1);
            dust.setAttribute('fill', 'rgba(255,255,255,0.8)');
            finalView.appendChild(dust);
            
            dust.animate([
                { transform: `translateY(0px)`, opacity: 1 },
                { transform: `translateY(${Math.random() * 200 + 350}px)`, opacity: 0 }
            ], {
                duration: Math.random() * 1000 + 1000,
                easing: 'ease-in',
                delay: Math.random() * 500
            }).onfinish = () => dust.remove();
        }
    });

    function createBlisters() {
        const interval = setInterval(() => {
            if (currentScene !== 'frying') {
                clearInterval(interval);
                return;
            }
            const blister = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            blister.setAttribute('cx', 360 + Math.random() * 80);
            blister.setAttribute('cy', 380 + Math.random() * 40);
            blister.setAttribute('r', '0');
            blister.setAttribute('fill', '#d49a59');
            fryingPastry.appendChild(blister);

            blister.animate([
                { r: 0 },
                { r: Math.random() * 5 + 2 },
                { r: Math.random() * 3 }
            ], { duration: 500, easing: 'ease-out' }).onfinish = () => blister.remove();
        }, 200);
    }

    // NLD REFINEMENT: Procedurally stack pastries for a more realistic pile
    function createPlatedPastries() {
        platedPastries.innerHTML = '';
        const baseCount = 7;
        const layer2Count = 5;
        const layer3Count = 3;

        // Layer 1 (Base)
        for (let i = 0; i < baseCount; i++) {
            const angle = (i / baseCount) * Math.PI * 2;
            const x = 400 + Math.cos(angle) * 80;
            const y = 430 + Math.sin(angle) * 20;
            const r = (Math.random() - 0.5) * 20;
            createPastry(x, y, r);
        }
        // Layer 2
        for (let i = 0; i < layer2Count; i++) {
            const angle = (i / layer2Count) * Math.PI * 2 + 0.5;
            const x = 400 + Math.cos(angle) * 50;
            const y = 420 + Math.sin(angle) * 15;
            const r = (Math.random() - 0.5) * 20;
            createPastry(x, y, r);
        }
        // Layer 3
        for (let i = 0; i < layer3Count; i++) {
            const angle = (i / layer3Count) * Math.PI * 2 + 1;
            const x = 400 + Math.cos(angle) * 25;
            const y = 410 + Math.sin(angle) * 10;
            const r = (Math.random() - 0.5) * 20;
            createPastry(x, y, r);
        }
    }

    function createPastry(x, y, r) {
        const pastry = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pastry.setAttribute('d', "M0,-25 L40,0 L0,25 L-40,0 Z");
        pastry.setAttribute('fill', '#a1662f');
        pastry.setAttribute('transform', `translate(${x}, ${y}) rotate(${r})`);
        platedPastries.appendChild(pastry);
    }
});