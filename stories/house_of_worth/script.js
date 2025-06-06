// script.js for The House of Worth (vFinal - Complete)

document.addEventListener('DOMContentLoaded', () => {

    const acts = document.querySelectorAll('.act');
    const gownSVG = document.getElementById('gown-svg');
    const swatchBook = document.getElementById('swatch-book');
    let audioCtx, music;
    let currentGown = {};

    // --- Audio Engine ---
    const setupAudio = () => {
        if(audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        music = createMusic();
        // Gently fade in the music
        music.gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 2);
    }
    // Initialize audio on the first user interaction to comply with browser policies
    document.body.addEventListener('click', setupAudio, {once: true});
    
    const playSound = (type) => {
        if(!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if(type === 'swoosh') {
            // A more elegant swoosh using filtered white noise
            const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource();
            noise.buffer = noiseBuffer;
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(500, now);
            filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            noise.connect(filter).connect(gain);
            noise.start(now);
        } else if(type === 'snip') {
             // A sharp, quick "snip" sound
             gain.gain.setValueAtTime(0.3, now).linearRampToValueAtTime(0, now + 0.1);
             osc.type = 'square';
             osc.frequency.setValueAtTime(1200, now);
             osc.start(now);
             osc.stop(now + 0.1);
        } else if(type === 'chime') {
             // A final, triumphant chime
             gain.gain.setValueAtTime(0.2, now).linearRampToValueAtTime(0, now + 1);
             osc.type = 'sine';
             osc.frequency.setValueAtTime(880, now);
             osc.start(now);
             osc.stop(now + 1);
        }
    }
    
    function createMusic() {
        // A simple, arpeggiated baroque-style theme
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioCtx.destination);
        const notes = [293.66, 440.00, 587.33, 783.99]; // D, A, D, G
        let noteIndex = 0;
        const intervalId = setInterval(() => {
            if(!audioCtx) {
                clearInterval(intervalId);
                return;
            }
            const osc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();
            osc.connect(noteGain).connect(gainNode);
            const now = audioCtx.currentTime;
            osc.frequency.value = notes[noteIndex % notes.length];
            noteGain.gain.setValueAtTime(0.5, now);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.5);
            noteIndex++;
        }, 300);
        return { gain: gainNode };
    }
    
    // --- Data: Gown "Patterns" & Customizations (MASTER COUTURIER VERSION) ---
    const gownData = {
        princess: {
            name: "The Princess Line",
            description: "A sleek, elegant silhouette that flows uninterrupted from the shoulder to the hem, creating a clean and elongated look without a horizontal waist seam.",
            svg: `
                <defs>
                    <linearGradient id="princess-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="transparent"/>
                    </linearGradient>
                </defs>
                <g class="gown-part">
                    <path d="M150,20 C140,40 160,40 150,20 L125,20 L105,60 C100,100 90,200 70,450 L230,450 C210,200 200,100 195,60 L175,20 Z" />
                    <path d="M150,20 C140,40 160,40 150,20 L125,20 L105,60 C100,100 90,200 70,450 L230,450 C210,200 200,100 195,60 L175,20 Z" fill="url(#princess-grad)"/>
                    <path d="M150,20 L125,20 M175,20 L150,20" stroke-width="2" stroke-linejoin="round" stroke="rgba(0,0,0,0.2)" fill="none"/>
                    <path d="M150,20 C130,80 170,80 150,20" stroke="rgba(0,0,0,0.1)" stroke-width="1" fill="none"/>
                </g>
            `
        },
        polonaise: {
            name: "The Polonaise",
            description: "Characterized by its overskirt, which is puffed, looped, and draped over the underskirt, evoking romantic, pastoral styles.",
            svg: `
                <defs>
                    <radialGradient id="polonaise-highlight" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="transparent"/>
                    </radialGradient>
                </defs>
                <g class="gown-part">
                    <!-- Underskirt -->
                    <path d="M100,150 L80,450 L220,450 L200,150 Z" opacity="0.8"/>
                    <!-- Bodice -->
                    <path d="M150,20 L120,20 L100,60 V150 H200 V60 L180,20 Z" />
                    <!-- Overskirt with draping -->
                    <path d="M150,150 C 50,180 50,350 90,440 L100,440 C80,300 100,200 150,150" />
                    <path d="M150,150 C 250,180 250,350 210,440 L200,440 C 220,300 200,200 150,150" />
                    <!-- Highlight -->
                    <path d="M150,20 L120,20 L100,60 V150 L80,450 L220,450 L200,150 V60 L180,20 Z" fill="url(#polonaise-highlight)"/>
                </g>
            `
        },
        evening: {
            name: "The Evening Gown",
            description: "A dramatic design with a low neckline and a prominent bustle at the rear, often adorned with elaborate trims for balls and soirees.",
            svg: `
                <defs>
                    <linearGradient id="bustle-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="black" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="transparent"/>
                    </linearGradient>
                </defs>
                <g class="gown-part">
                    <!-- Main dress shape -->
                    <path d="M150,25 C140,45 160,45 150,25 L130,25 L110,50 C110,100 100,250 90,450 L210,450 C200,250 190,100 190,50 L170,25 Z" />
                    <!-- Bustle layers -->
                    <path d="M150,250 C 50,300 80,450 150,450 C 220,450 250,300 150,250" fill-opacity="0.9"/>
                    <path d="M150,280 C 80,320 90,420 150,420 C 210,420 220,320 150,280" fill-opacity="0.8"/>
                    <!-- Shading to give depth -->
                    <path d="M150,250 C 50,300 80,450 150,450 C 220,450 250,300 150,250" fill="url(#bustle-shadow)"/>
                    <!-- Neckline detail -->
                    <path d="M150,25 C140,45 160,45 150,25" stroke="rgba(0,0,0,0.3)" stroke-width="2" fill="none"/>
                </g>
            `
        }
    };
    const customizationData = {
        Fabric: {
            Silk: {
                type: 'pattern',
                def: `<linearGradient id="pattern-Silk" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.3)"/><stop offset="50%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0.3)"/></linearGradient>`,
                fill: 'url(#pattern-Silk)'
            },
            Velvet: {
                type: 'pattern',
                def: `<filter id="filter-Velvet"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><pattern id="pattern-Velvet" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="rgba(0,0,0,0.2)" filter="url(#filter-Velvet)"/></pattern>`,
                fill: 'url(#pattern-Velvet)'
            },
            Taffeta: {
                type: 'pattern',
                def: `<pattern id="pattern-Taffeta" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M -1 1 H 5" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/></pattern>`,
                fill: 'url(#pattern-Taffeta)'
            }
        },
        Color: {
            Rose: {type: 'color', value: '#c28d9f'},
            Cerulean: {type: 'color', value: '#9cb4d4'},
            Ivory: {type: 'color', value: '#f1eadd'}
        },
        Trim: {
            None: {type: 'trim', value: ''},
            Lace: {
                type: 'trim',
                value: `<path d="M50,440 C 70,430 90,430 110,440 S 150,450 170,440 S 210,430 230,440 L250,450" stroke="white" stroke-width="2" fill="none" opacity="0.6"/>`
            },
            Ruffles: {
                type: 'trim',
                value: `<path d="M110,50 Q120,60 130,50 T150,50 T170,50 T190,50" stroke="rgba(255,255,255,0.5)" stroke-width="3" fill="none" opacity="0.7"/>`
            },
        }
    };

    // --- Core Logic ---
    function switchAct(actNumber) {
        playSound('swoosh');
        acts.forEach(act => act.classList.remove('active'));
        document.getElementById(`act-${actNumber}`).classList.add('active');
    }

    function selectSilhouette(choice) {
        currentGown.base = gownData[choice];
        currentGown.custom = {
            Fabric: 'Silk',
            Color: 'Ivory',
            Trim: 'None'
        };
        
        document.getElementById('gown-title').textContent = currentGown.base.name;
        document.getElementById('gown-description').textContent = currentGown.base.description;
        buildSwatchBook();
        updateGown();
        
        switchAct(2);
    }
    
    function buildSwatchBook() {
        swatchBook.innerHTML = '';
        for (const category in customizationData) {
            const catDiv = document.createElement('div');
            catDiv.className = 'swatch-category';
            catDiv.innerHTML = `<h3>${category}</h3>`;
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'swatch-options';
            
            for (const option in customizationData[category]) {
                const swatchData = customizationData[category][option];
                const swatchDiv = document.createElement('div');
                swatchDiv.className = 'swatch';
                swatchDiv.dataset.category = category;
                swatchDiv.dataset.option = option;
                swatchDiv.title = option;
                
                if(swatchData.type === 'color') {
                    swatchDiv.style.background = swatchData.value;
                } else if (swatchData.type === 'pattern') {
                    swatchDiv.innerHTML = `<svg viewBox="0 0 50 50"><defs>${swatchData.def}</defs><rect width="50" height="50" fill="#ccc"/><rect width="50" height="50" fill="${swatchData.fill}"/></svg>`;
                } else { // Trim
                    swatchDiv.innerHTML = `<svg viewBox="0 0 50 50" style="stroke:var(--border-color);"><rect width="50" height="50" fill="transparent"/>${swatchData.value}</svg>`;
                }
                
                swatchDiv.addEventListener('click', () => {
                    playSound('snip');
                    currentGown.custom[category] = option;
                    updateGown();
                });
                
                optionsDiv.appendChild(swatchDiv);
            }
            catDiv.appendChild(optionsDiv);
            swatchBook.appendChild(catDiv);
        }
    }
    
    function updateGown() {
        const color = customizationData.Color[currentGown.custom.Color].value;
        const fabric = customizationData.Fabric[currentGown.custom.Fabric];
        const trim = customizationData.Trim[currentGown.custom.Trim];
        
        gownSVG.innerHTML = `
            <defs>
                ${fabric.def || ''}
            </defs>
            <g class="gown-base" fill="${color}">
                ${currentGown.base.svg}
            </g>
            <g class="gown-fabric-pattern" fill="${fabric.fill || 'transparent'}">
                 ${currentGown.base.svg}
            </g>
            <g class="gown-trim">
                ${trim.value}
            </g>
        `;
        
        document.querySelectorAll('.swatch').forEach(sw => {
            const { category, option } = sw.dataset;
            sw.classList.toggle('active', currentGown.custom[category] === option);
        });
    }
    
    function finalizeCreation() {
        playSound('chime');
        if (music) music.gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 2);

        const finalGownContainer = document.getElementById('final-gown-display');
        finalGownContainer.innerHTML = `<svg viewBox="0 0 300 500">${gownSVG.innerHTML}</svg>`;

        const signatureContainer = document.getElementById('signature');
        signatureContainer.innerHTML = `<svg viewBox="0 0 200 60"><path d="M10,40 Q25,10 50,30 T90,40 Q110,10 140,45 T190,40" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--header-color')}" stroke-width="2" fill="none"/></svg>`;
        
        switchAct(3);
    }
    
    function restart() {
        if(music) music.gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 1);
        switchAct(1);
    }

    // --- Event Listeners ---
    document.querySelectorAll('.silhouette-choice').forEach(btn => {
        btn.addEventListener('click', () => selectSilhouette(btn.dataset.choice));
    });
    document.getElementById('finalize-button').addEventListener('click', finalizeCreation);
    document.getElementById('restart-button').addEventListener('click', restart);
});