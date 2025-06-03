document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1'),
        document.getElementById('page2'),
        document.getElementById('page3')
    ];
    const storyTexts = [
        document.getElementById('text-page1'),
        document.getElementById('text-page2'),
        document.getElementById('text-page3')
    ];

    // Navigation buttons
    const nextPage1Btn = document.getElementById('next-page1');
    const prevPage2Btn = document.getElementById('prev-page2');
    const nextPage2Btn = document.getElementById('next-page2');
    const prevPage3Btn = document.getElementById('prev-page3');
    const restartBtn = document.getElementById('restart-story');

    // Page 1 specific
    const svgPage1Art = document.getElementById('svg-page1-art');

    // Page 2 specific
    const operaLinks = document.querySelectorAll('.opera-link');
    const svgPage2Art = document.getElementById('svg-page2-art'); // For potential visual feedback on opera click

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function stopAllSounds() {
        currentOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) {}
        });
        currentOscillators = [];
    }

    function playNoteSequence(notesConfig) { // notesConfig = { notes: [{freq, dur, delay, type, vol}], overallVolume: 0.1 }
        if (!initAudioContext()) {
            console.error("Web Audio API is not supported.");
            return;
        }
        stopAllSounds();
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.1;

        notesConfig.notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = note.type || 'sine';
            oscillator.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
            
            // Simple envelope: attack, sustain, release
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0)); // Start silent
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02); // Quick attack
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05); // Sustain
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration); // Release
            
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.1); // Allow for release
            currentOscillators.push(oscillator);
        });
    }

    const Q = 0.25; // Quarter note duration at a conceptual tempo
    const E = 0.125; // Eighth note
    const H = 0.5;   // Half note
    const W = 1.0;   // Whole note

    const pageMusic = {
        0: { // Page 1: Child Prodigy - Simple, clear, Alberti-bass like hint + melody
            overallVolume: 0.08,
            notes: [
                // Alberti-like bass (C G E G)
                { freq: 130.81, duration: E, delay: 0*E, type: 'triangle'}, // C3
                { freq: 196.00, duration: E, delay: 1*E, type: 'triangle'}, // G3
                { freq: 164.81, duration: E, delay: 2*E, type: 'triangle'}, // E3
                { freq: 196.00, duration: E, delay: 3*E, type: 'triangle'}, // G3
                // Melody on top
                { freq: 523.25, duration: Q, delay: 0*E, type: 'sine', volMultiplier: 1.5}, // C5
                { freq: 587.33, duration: Q, delay: 2*E, type: 'sine', volMultiplier: 1.5}, // D5
                { freq: 659.25, duration: H, delay: 4*E, type: 'sine', volMultiplier: 1.5}, // E5
            ]
        },
        1: { // Page 2: Vienna - More active, slightly operatic
            overallVolume: 0.1,
            notes: [
                { freq: 392.00, duration: Q, delay: 0*Q, type: 'square', volMultiplier: 1.2 }, // G4
                { freq: 440.00, duration: E, delay: 1*Q, type: 'square', volMultiplier: 1.2 }, // A4
                { freq: 493.88, duration: E, delay: 1*Q + E, type: 'square', volMultiplier: 1.2 }, // B4
                { freq: 523.25, duration: H, delay: 1*Q + 2*E, type: 'square', volMultiplier: 1.4 }, // C5
                // Counter melody/harmony
                { freq: 261.63, duration: H, delay: 0*Q, type: 'sawtooth', volMultiplier: 0.8}, // C4
                { freq: 329.63, duration: H, delay: H, type: 'sawtooth', volMultiplier: 0.8}, // E4
            ]
        },
        // Opera motifs
        figaroMotif: { overallVolume: 0.07, notes: [{freq: 523.25, duration:E*1.5, delay:0, type:'sine'}, {freq: 493.88, duration:E, delay:E*1.5, type:'sine'},{freq: 523.25, duration:Q, delay:E*2.5, type:'sine'}] }, // C B C
        giovanniMotif: { overallVolume: 0.09, notes: [{freq: 293.66, duration:Q, delay:0, type:'square', volMultiplier:1.2}, {freq: 261.63, duration:Q, delay:Q, type:'square', volMultiplier:1.2},{freq: 220.00, duration:H, delay:2*Q, type:'square', volMultiplier:1.2}] }, // D C A (minor/dramatic)
        magicfluteMotif: { overallVolume: 0.06, notes: [{freq: 783.99, duration:E, delay:0, type:'triangle'},{freq: 698.46, duration:E, delay:E*1.2, type:'triangle'},{freq: 659.25, duration:Q, delay:E*2.4, type:'triangle'}]}, // G F E (high, flute like)

        2: { // Page 3: Legacy - Serene, slightly grand, perhaps a hint of Requiem feel
            overallVolume: 0.09,
            notes: [
                { freq: 220.00, duration: H, delay: 0, type: 'sine', volMultiplier: 0.8},    // A3 (Lacrimosa-like start)
                { freq: 293.66, duration: Q, delay: H*0.9, type: 'sine', volMultiplier: 1.0},  // D4
                { freq: 329.63, duration: Q, delay: H*0.9+Q, type: 'sine', volMultiplier: 1.0}, // E4
                { freq: 349.23, duration: H, delay: H*0.9+2*Q, type: 'sine', volMultiplier: 1.2}, // F4 (resolving upwards feel)
                { freq: 261.63, duration: W, delay: H*0.9+2*Q+H*0.8, type: 'sine', volMultiplier: 0.7} // C4 long
            ]
        }
    };

    function animateText(textElement) {
        if(textElement) {
            textElement.classList.remove('text-fade-in');
            void textElement.offsetWidth; // Trigger reflow to restart animation
            textElement.classList.add('text-fade-in');
        }
    }
    
    let previousPageIndex = -1;

    function showPage(index) {
        if (index < 0 || index >= pages.length || !pages[index]) return;

        const goingForward = index > previousPageIndex;
        
        if (previousPageIndex !== -1 && pages[previousPageIndex]) {
            pages[previousPageIndex].classList.remove('current-page');
            pages[previousPageIndex].classList.add(goingForward ? 'slide-out-left' : 'slide-out-right');
        }
        
        pages[index].classList.remove('slide-out-left', 'slide-out-right');
        pages[index].classList.add('current-page');
        
        currentPageIndex = index;
        previousPageIndex = index; // Update after transition logic

        animateText(storyTexts[currentPageIndex]);

        if (pageMusic[currentPageIndex]) {
            playNoteSequence(pageMusic[currentPageIndex]);
        }
    }
    
    // --- Page 1: Clavier Click Interaction ---
    if (svgPage1Art) {
        svgPage1Art.addEventListener('click', () => {
            if (currentPageIndex === 0) { // Only if on page 1
                playNoteSequence({ overallVolume: 0.15, notes: [{freq: 523.25, duration: Q, type:'sine'}] }); // Play a C5 note
                // Simple visual feedback
                const head = svgPage1Art.querySelector('circle');
                if(head){
                    head.setAttribute('fill', '#FFEC8B'); // Light yellow
                    setTimeout(() => head.setAttribute('fill', '#FFEBCD'), 300);
                }
            }
        });
    }

    // --- Page 2: Opera Link Interactions ---
    operaLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (currentPageIndex === 1) { // Only if on page 2
                const opera = e.target.dataset.opera;
                if (opera === "figaro" && pageMusic.figaroMotif) playNoteSequence(pageMusic.figaroMotif);
                else if (opera === "giovanni" && pageMusic.giovanniMotif) playNoteSequence(pageMusic.giovanniMotif);
                else if (opera === "magicflute" && pageMusic.magicfluteMotif) playNoteSequence(pageMusic.magicfluteMotif);
                
                // Visual feedback for opera link click
                const notesOnStage = svgPage2Art.querySelectorAll('.music-note');
                notesOnStage.forEach(note => {
                    note.style.transition = 'transform 0.3s ease, fill 0.3s ease';
                    note.style.transform = 'scale(1.5)';
                    note.style.fill = '#FFD700'; // Gold
                    setTimeout(() => {
                        note.style.transform = 'scale(1)';
                        note.style.fill = 'white';
                    }, 500);
                });
            }
        });
    });

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => showPage(0));

    showPage(0);
});