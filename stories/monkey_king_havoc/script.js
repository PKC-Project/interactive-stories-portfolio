// script.js for The Monkey King's Heavenly Havoc (Performance Version)

document.addEventListener('DOMContentLoaded', () => {
    const startOverlay = document.getElementById('start-overlay');
    const startButton = document.getElementById('start-button');
    const storyContainer = document.getElementById('story-container');
    const storyBeats = document.querySelectorAll('.story-beat');
    const svgStage = document.getElementById('scene-svg');
    const svgNS = "http://www.w3.org/2000/svg";
    let activeTrigger = null;
    let audioCtx;
    const visualAssets = {};
    let musicEngine = { intervalId: null, gainNode: null };

    // --- Audio Engine ---
    const setupAudio = () => {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    };
    startButton.addEventListener('click', () => {
        setupAudio();
        startOverlay.style.opacity = '0';
        startOverlay.style.pointerEvents = 'none';
        storyContainer.classList.remove('hidden');
        storyContainer.style.transition = 'opacity 1s ease-in-out 0.5s';
        storyContainer.style.opacity = '1';
    });

    const playSound = (type) => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        let oscType = 'sine', freq = 440, duration = 0.5, attack = 0.01, decay = 0.4, gainVol = 0.3;
        switch (type) {
            case 'smash': oscType = 'square'; freq = 80; gainVol = 0.5; decay = 0.4; break;
            case 'peach': freq = 880; gainVol = 0.4; decay = 0.1; break;
            case 'clash': oscType = 'sawtooth'; freq = 1200; gainVol = 0.4; decay = 0.2; break;
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gainVol, now + attack);
        gain.gain.linearRampToValueAtTime(0, now + decay);
        osc.start(now);
        osc.stop(now + duration);
    };

    const startMusic = (theme) => {
        if (!audioCtx) return;
        if (musicEngine.intervalId) clearInterval(musicEngine.intervalId);
        if (musicEngine.gainNode) musicEngine.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 1);
        gainNode.connect(audioCtx.destination);
        musicEngine.gainNode = gainNode;

        let notes, interval, wave;
        if (theme === 'heaven') { notes = [523, 587, 659, 783, 880]; interval = 500; wave = 'sine'; } 
        else if (theme === 'battle') { notes = [110, 147, 123, 110]; interval = 250; wave = 'sawtooth'; } 
        else { return; }

        let noteIndex = 0;
        musicEngine.intervalId = setInterval(() => {
            const osc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();
            osc.connect(noteGain).connect(gainNode);
            const now = audioCtx.currentTime;
            osc.type = wave;
            osc.frequency.value = notes[noteIndex % notes.length];
            noteGain.gain.setValueAtTime(0.3, now);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + (interval / 1000 - 0.05));
            osc.start(now);
            osc.stop(now + (interval / 1000));
            noteIndex++;
        }, interval);
    };

    // --- Mastered SVG Generation Functions ---
    const createSVGElement = (tag, attributes) => {
        const el = document.createElementNS(svgNS, tag);
        for (const key in attributes) el.setAttribute(key, attributes[key]);
        return el;
    };

    const createMountainScene = () => {
        const group = createSVGElement('g', { id: 'mountain-scene' });
        group.innerHTML = `
            <defs><linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4a5a73"/><stop offset="100%" stop-color="#1a1e23"/></linearGradient><filter id="mist"><feGaussianBlur in="SourceGraphic" stdDeviation="5"/></filter></defs>
            <rect width="500" height="800" fill="url(#skyGrad)"/>
            <path d="M-100,800 L200,450 Q250,350 300,450 L600,800 Z" fill="#2a2522" opacity="0.6" filter="url(#mist)"/>
            <path d="M-50,800 L150,400 Q250,250 350,400 L550,800 Z" fill="#3d3531"/>`;
        return group;
    };

    const createWukong = () => {
        const group = createSVGElement('g', { id: 'wukong' });
        group.innerHTML = `
            <g transform="translate(250, 600) scale(1.5)">
                <circle class="wukong-aura" r="30"/>
                <g class="wukong-body">
                    <line id="staff" x1="-40" y1="20" x2="40" y2="20" stroke="#f1c40f" stroke-width="4" stroke-linecap="round"/>
                    <rect x="-10" y="5" width="20" height="30" fill="#c07040" rx="5"/>
                    <circle cx="0" cy="0" r="12" fill="#e8b080"/>
                    <path d="M-5,-2 C-2,-8 2,-8 5,-2" stroke="black" stroke-width="1.5" fill="none"/>
                    <path d="M-8,-5 Q0,-12 8,-5" stroke="#f1c40f" stroke-width="2" fill="none"/>
                </g>
            </g>`;
        group.style.transition = 'transform 2s ease-in-out';
        return group;
    };
    
    const createHeavenlyGate = () => {
        const group = createSVGElement('g', { id: 'heaven-gate' });
        group.innerHTML = `
            <defs><radialGradient id="cloudGrad"><stop offset="0%" stop-color="rgba(255,255,255,0.2)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
            <circle cx="100" cy="200" r="150" fill="url(#cloudGrad)"/><circle cx="400" cy="150" r="100" fill="url(#cloudGrad)"/>
            <path d="M150,300 L100,250 L150,250 L125,200 L175,200 L150,150 L200,150 L250,200 L225,200 L275,250 L250,250 L300,300 Z" fill="#d94a38" stroke="#c0a080" stroke-width="2"/>
            <rect x="125" y="300" width="150" height="10" fill="#c0a080"/>`;
        return group;
    };

    const createNezha = () => {
        const group = createSVGElement('g', { id: 'nezha' });
        group.innerHTML = `
            <g transform="translate(250, 200) scale(1.2)">
                <circle r="25" fill="#e63946" opacity="0.8"/>
                <text x="0" y="10" font-size="30" text-anchor="middle" fill="white">吒</text>
            </g>`;
        return group;
    };

    // --- Scene Choreography ---
    const updateScene = (trigger) => {
        if (trigger === activeTrigger) return;
        activeTrigger = trigger;

        switch (trigger) {
            case 'act1_mountain':
                svgStage.innerHTML = '';
                visualAssets.mountain = createMountainScene();
                visualAssets.wukong = createWukong();
                svgStage.appendChild(visualAssets.mountain);
                svgStage.appendChild(visualAssets.wukong);
                startMusic('heaven');
                break;

            case 'act1_heaven':
                if (!visualAssets.gate) {
                    visualAssets.gate = createHeavenlyGate();
                    visualAssets.gate.style.opacity = '0';
                    svgStage.insertBefore(visualAssets.gate, visualAssets.wukong);
                    setTimeout(() => visualAssets.gate.style.opacity = '1', 100);
                }
                if (visualAssets.wukong) visualAssets.wukong.style.transform = 'translateY(-350px)';
                break;

            case 'act1_havoc':
                if (visualAssets.gate) {
                    playSound('smash');
                    visualAssets.gate.classList.add('smashed');
                }
                break;

            case 'act2_peaches':
                if (visualAssets.wukong) visualAssets.wukong.style.transform = 'translateY(-450px)';
                if (visualAssets.gate) visualAssets.gate.style.opacity = '0';
                
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        playSound('peach');
                        const peach = createSVGElement('circle', { cx: Math.random() * 300 + 100, cy: 100, r: 15, fill: '#ffac81', class: 'peach' });
                        svgStage.appendChild(peach);
                        setTimeout(() => peach.remove(), 2900);
                    }, i * 300);
                }
                if (visualAssets.wukong) visualAssets.wukong.querySelector('.wukong-aura').classList.add('active');
                break;

            case 'act3_duel':
                if (visualAssets.wukong) visualAssets.wukong.style.transform = 'translateY(-550px) scale(1.2)';
                if (!visualAssets.nezha) {
                    visualAssets.nezha = createNezha();
                    visualAssets.nezha.style.opacity = '0';
                    svgStage.insertBefore(visualAssets.nezha, visualAssets.wukong);
                    setTimeout(() => visualAssets.nezha.style.opacity = '1', 500);
                }
                startMusic('battle');
                
                setTimeout(() => {
                    playSound('clash');
                    const blast = createSVGElement('circle', { cx: 250, cy: 200, r: 10, class: 'attack-blast' });
                    svgStage.appendChild(blast);
                    setTimeout(() => blast.remove(), 1500);
                }, 1000);
                break;
            
            case 'end':
                if (musicEngine.gainNode) musicEngine.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
                break;
        }
    };

    // --- Intersection Observer Setup ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-active');
                updateScene(entry.target.dataset.trigger);
            } else {
                entry.target.classList.remove('is-active');
            }
        });
    }, { threshold: 0.8, rootMargin: "0px 0px -15% 0px" });

    storyBeats.forEach(beat => observer.observe(beat));
});