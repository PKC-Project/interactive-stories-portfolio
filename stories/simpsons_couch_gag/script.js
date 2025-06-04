document.addEventListener('DOMContentLoaded', () => {
    const svgArea = document.getElementById('couch-gag-svg-area');
    const charactersGroup = document.getElementById('characters-group');
    const newGagButton = document.getElementById('new-gag-button');
    const gagDescriptionEl = document.getElementById('gag-description');
    const hubReturnButton = document.querySelector('.hub-return-button');

    let audioContext;
    let currentOscillators = [];

    // --- Audio Functions ---
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }
    function stopAllSounds() {
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
        currentOscillators = [];
    }
    function playSound(notesConfig, clearPrevious = true) {
        if (!initAudioContext()) return;
        if (clearPrevious) stopAllSounds();
        
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.1;

        notesConfig.notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = note.type || 'sine';
            oscillator.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
            
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            if (note.sustain) { // If sustain is true, hold volume longer
                 gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05);
            }
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.05); // Allow for release
            currentOscillators.push(oscillator);
        });
    }

    const soundEffects = {
        themeSting: { overallVolume: 0.15, notes: [ // "The Simp-sons!"
            { freq: 523.25, duration: 0.15, delay: 0, type: 'square'},    // C5
            { freq: 523.25, duration: 0.15, delay: 0.18, type: 'square'},   // C5
            { freq: 587.33, duration: 0.15, delay: 0.36, type: 'square'},  // D5
            { freq: 698.46, duration: 0.4, delay: 0.54, type: 'square', volMultiplier: 1.2} // F5 (long)
        ]},
        run: { overallVolume: 0.05, notes: [{freq: 800, duration: 0.05, delay:0, type:'triangle'}, {freq: 900, duration:0.05, delay:0.06, type:'triangle'}, {freq:850, duration:0.05, delay:0.12, type:'triangle'}]},
        crash: { overallVolume: 0.2, notes: [{freq: 100, duration: 0.3, type:'noise'}, {freq: 150, duration:0.2, delay: 0.1, type:'noise'}]}, // Noise needs specific setup, use sawtooth
        boing: { overallVolume: 0.1, notes: [{freq: 300, duration: 0.1, type:'sine', slideTo: 600}, {freq: 600, duration:0.2, delay:0.1, type:'sine', slideTo: 200}]},
        poof: { overallVolume: 0.15, notes: [{freq: 200, duration: 0.2, type:'noise', volMultiplier: 1.5, slideTo: 50}]} // Noise
    };
    // For 'noise' type, a proper implementation would use a BufferSourceNode with white noise.
    // As a simple fallback, we can use a very low frequency sawtooth or square wave.
    // Let's adjust the playSound to handle 'noise' as sawtooth for now.
    function playSound(notesConfig, clearPrevious = true) { // Overwrite previous for noise fix
        if (!initAudioContext()) return;
        if (clearPrevious) stopAllSounds();
        
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.1;

        notesConfig.notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = (note.type === 'noise') ? 'sawtooth' : (note.type || 'sine');
            let freq = (note.type === 'noise') ? (note.freq || 50) + Math.random()*50 : note.freq; // Low random freq for noise
            oscillator.frequency.setValueAtTime(freq, now + (note.delay || 0));

            if (note.slideTo && note.type !== 'noise') { 
                oscillator.frequency.linearRampToValueAtTime(note.slideTo, now + (note.delay || 0) + note.duration * 0.8);
            }
            
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            if (note.sustain) {
                 gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05);
            }
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.05);
            currentOscillators.push(oscillator);
        });
    }


    // --- Character SVG Definitions (LLM Task: Generate these) ---
    // These are very simplified. LLM should generate more characteristic SVGs.
    const characters = {
        homer: `<circle cx="0" cy="0" r="15" fill="#FFD90F" class="simpson-char" id="homer-head"/>
                <rect x="-10" y="10" width="20" height="25" fill="white" class="simpson-char"/>
                <rect x="-12" y="35" width="24" height="10" fill="blue" class="simpson-char"/>`, // Head, shirt, pants
        marge: `<ellipse cx="0" cy="-15" rx="8" ry="25" fill="blue" class="simpson-char" id="marge-hair"/>
                <circle cx="0" cy="15" r="10" fill="#FFD90F" class="simpson-char"/>
                <rect x="-8" y="20" width="16" height="20" fill="lightgreen" class="simpson-char"/>`, // Hair, head, dress
        bart:  `<path d="M0 -10 L5 -5 L5 5 L-5 5 L-5 -5 Z" fill="#FFD90F" class="simpson-char" id="bart-head"/> <!-- Spiky hair -->
                <circle cx="0" cy="0" r="8" fill="#FFD90F" class="simpson-char"/>
                <rect x="-6" y="5" width="12" height="15" fill="red" class="simpson-char"/>
                <rect x="-7" y="20" width="14" height="8" fill="blue" class="simpson-char"/>`,
        lisa:  `<path d="M0 -12 Q-5 -15 -8 -8 Q-5 -2 0 0 Q5 -2 8 -8 Q5 -15 0 -12 Z" fill="#FFD90F" class="simpson-char" id="lisa-head"/> <!-- Star hair -->
                <circle cx="0" cy="0" r="7" fill="#FFD90F" class="simpson-char"/>
                <rect x="-5" y="4" width="10" height="13" fill="red" class="simpson-char"/>`,
        maggie: `<circle cx="0" cy="0" r="6" fill="#FFD90F" class="simpson-char" id="maggie-head"/>
                 <path d="M-2 -5 L0 -8 L2 -5 Z" fill="blue" class="simpson-char"/> <!-- Bow -->
                 <rect x="-4" y="3" width="8" height="10" fill="lightblue" class="simpson-char"/>`
    };

    function addCharacter(name, x, y, id) {
        const charGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        charGroup.setAttribute('transform', `translate(${x}, ${y})`);
        if (id) charGroup.setAttribute('id', id);
        charGroup.innerHTML = characters[name] || '';
        charactersGroup.appendChild(charGroup);
        return charGroup;
    }

    // --- Couch Gag Animations ---
    const couchGags = [
        function gagStandardSit() {
            gagDescriptionEl.textContent = "The family runs in and sits on the couch... mostly.";
            playSound(soundEffects.run);
            const homer = addCharacter('homer', -50, 85, 'homer');
            const marge = addCharacter('marge', -20, 85, 'marge'); // Marge is taller due to hair
            const bart = addCharacter('bart', 200, 85, 'bart'); // Start off screen right
            const lisa = addCharacter('lisa', 220, 85, 'lisa');
            const maggie = addCharacter('maggie', 240, 90, 'maggie');

            // Animate them running to the couch
            // Couch center is roughly x=100. Positions: Homer (70), Marge (90), Bart (110), Lisa (125), Maggie (135)
            setTimeout(() => { if(homer) homer.setAttribute('transform', 'translate(70, 85)'); }, 100);
            setTimeout(() => { if(marge) marge.setAttribute('transform', 'translate(90, 85)'); }, 200);
            setTimeout(() => { if(bart) bart.setAttribute('transform', 'translate(110, 85)'); }, 300);
            setTimeout(() => { if(lisa) lisa.setAttribute('transform', 'translate(125, 85)'); }, 400);
            setTimeout(() => { if(maggie) maggie.setAttribute('transform', 'translate(135, 90)'); playSound(soundEffects.themeSting, false);}, 500);
        },
        function gagPileUp() {
            gagDescriptionEl.textContent = "Everyone tries to get on the couch at once!";
            playSound(soundEffects.run);
            const homer = addCharacter('homer', -50, 85);
            const marge = addCharacter('marge', 250, 85);
            const bart = addCharacter('bart', -60, 85);
            const lisa = addCharacter('lisa', 260, 85);
            const maggie = addCharacter('maggie', -70, 90);

            setTimeout(() => {
                if(homer) homer.setAttribute('transform', 'translate(95, 80) rotate(15)');
                if(marge) marge.setAttribute('transform', 'translate(105, 82) rotate(-10)');
                if(bart) bart.setAttribute('transform', 'translate(100, 75) rotate(5)');
                if(lisa) lisa.setAttribute('transform', 'translate(102, 85) rotate(-5)');
                if(maggie) maggie.setAttribute('transform', 'translate(98, 70) rotate(20)');
                playSound(soundEffects.crash);
            }, 300);
        },
        function gagAlien() {
            gagDescriptionEl.textContent = "An unexpected visitor joins the family!";
            const alienSVG = `<g transform="translate(100, 80)">
                                <ellipse cx="0" cy="0" rx="15" ry="20" fill="lightgreen"/>
                                <circle cx="-7" cy="-5" r="4" fill="black"/><circle cx="7" cy="-5" r="4" fill="black"/>
                                <line x1="0" y1="-20" x2="-10" y2="-30" stroke="lightgreen" stroke-width="2"/>
                                <line x1="0" y1="-20" x2="10" y2="-30" stroke="lightgreen" stroke-width="2"/>
                              </g>`;
            charactersGroup.innerHTML = alienSVG;
            playSound(soundEffects.boing);
            setTimeout(() => playSound(soundEffects.themeSting, false), 300);
        },
        function gagGiantMaggie() {
            gagDescriptionEl.textContent = "Maggie's had a growth spurt!";
            const maggie = addCharacter('maggie', 100, 60); // Centered, larger
            if (maggie) {
                maggie.setAttribute('transform', 'translate(100, 60) scale(2.5)');
            }
            playSound(soundEffects.poof);
             setTimeout(() => playSound(soundEffects.themeSting, false), 300);
        }
    ];

    function playRandomGag() {
        charactersGroup.innerHTML = ''; // Clear previous characters
        gagDescriptionEl.textContent = "Here comes the family...";
        newGagButton.disabled = true;

        const randomIndex = Math.floor(Math.random() * couchGags.length);
        couchGags[randomIndex]();

        setTimeout(() => {
            newGagButton.disabled = false;
        }, 2000); // Cooldown for button
    }

    // --- Event Listeners ---
    newGagButton.addEventListener('click', playRandomGag);

    if (hubReturnButton) {
        hubReturnButton.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    }

    // Initial state
    gagDescriptionEl.textContent = "Click the button for a Couch Gag!";
    playSound(soundEffects.themeSting); // Play theme on load
});