document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-beethoven'),
        document.getElementById('page2-beethoven'),
        document.getElementById('page3-beethoven')
    ];
    const storyTexts = [
        document.getElementById('text-page1-beethoven'),
        document.getElementById('text-page2-beethoven'),
        document.getElementById('text-page3-beethoven')
    ];

    const nextPage1Btn = document.getElementById('next-page1-beethoven');
    const prevPage2Btn = document.getElementById('prev-page2-beethoven');
    const nextPage2Btn = document.getElementById('next-page2-beethoven');
    const prevPage3Btn = document.getElementById('prev-page3-beethoven');
    const restartBtn = document.getElementById('restart-story-beethoven');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    const infoPopups = { // Store popups by page index for easier access
        0: document.getElementById('info-popup-beethoven'),
        1: document.getElementById('info-popup-beethoven-p2'),
        2: document.getElementById('info-popup-beethoven-p3')
    };

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;

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

    function playNoteSequence(notesConfig) {
        if (!initAudioContext()) return;
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
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.1);
            currentOscillators.push(oscillator);
        });
    }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0; // Note durations

    const pageMusicBeethoven = {
        0: { // Page 1: Early Classical, virtuosic hint
            overallVolume: 0.1,
            notes: [
                { freq: 261.63, duration: Q, delay: 0*Q, type: 'square', volMultiplier: 1.2}, // C4
                { freq: 329.63, duration: Q, delay: 1*Q, type: 'square', volMultiplier: 1.2}, // E4
                { freq: 392.00, duration: Q, delay: 2*Q, type: 'square', volMultiplier: 1.2}, // G4
                { freq: 523.25, duration: H, delay: 3*Q, type: 'square', volMultiplier: 1.4}, // C5
            ]
        },
        1: { // Page 2: Heroic, dramatic - hint of 5th symphony motif
            overallVolume: 0.12,
            notes: [
                { freq: 196.00, duration: E*0.8, delay: 0, type: 'sawtooth', volMultiplier: 1.3},     // G3
                { freq: 196.00, duration: E*0.8, delay: E, type: 'sawtooth', volMultiplier: 1.3},     // G3
                { freq: 196.00, duration: E*0.8, delay: 2*E, type: 'sawtooth', volMultiplier: 1.3},     // G3
                { freq: 155.56, duration: H * 1.2, delay: 3*E, type: 'sawtooth', volMultiplier: 1.5}, // Eb3 (long)
                // Higher, more intense part
                { freq: 392.00, duration: Q, delay: 3*E + H*1.2 + Q*0.5, type: 'square', volMultiplier: 1.1}, // G4
                { freq: 466.16, duration: H, delay: 3*E + H*1.2 + Q*1.5, type: 'square', volMultiplier: 1.3}, // Bb4
            ]
        },
        2: { // Page 3: Late period, Ode to Joy hint, transcendent
            overallVolume: 0.1,
            notes: [ // E E F G G F E D C C D E E (Ode to Joy start)
                { freq: 329.63, duration: Q, delay: 0*Q, type: 'sine', volMultiplier: 1.1}, // E4
                { freq: 329.63, duration: Q, delay: 1*Q, type: 'sine', volMultiplier: 1.1}, // E4
                { freq: 349.23, duration: Q, delay: 2*Q, type: 'sine', volMultiplier: 1.1}, // F4
                { freq: 392.00, duration: Q, delay: 3*Q, type: 'sine', volMultiplier: 1.1}, // G4
                { freq: 392.00, duration: Q, delay: 4*Q, type: 'sine', volMultiplier: 1.1}, // G4
                { freq: 349.23, duration: Q, delay: 5*Q, type: 'sine', volMultiplier: 1.1}, // F4
                { freq: 329.63, duration: Q, delay: 6*Q, type: 'sine', volMultiplier: 1.1}, // E4
                { freq: 293.66, duration: H, delay: 7*Q, type: 'sine', volMultiplier: 1.3}, // D4
            ]
        }
    };
    
    const noteFrequencies = { "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "B4": 493.88, "C5": 523.25 };


    function animateText(textElement) {
        if(textElement) {
            textElement.classList.remove('text-fade-in');
            void textElement.offsetWidth; 
            textElement.classList.add('text-fade-in');
        }
    }

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
        previousPageIndex = index;

        animateText(storyTexts[currentPageIndex]);
        if (pageMusicBeethoven[currentPageIndex]) {
            playNoteSequence(pageMusicBeethoven[currentPageIndex]);
        }
        // Hide popups when changing page
        Object.values(infoPopups).forEach(popup => { if(popup) popup.style.opacity = '0'; });
    }
    
    // --- SVG Click Interactions & Popups ---
    function setupClickableSVGElementsForPage(pageIndex) {
        const svgArtElement = document.getElementById(`svg-page${pageIndex + 1}-beethoven-art`);
        const popupElement = infoPopups[pageIndex];
        if (!svgArtElement || !popupElement) return;

        const clickables = svgArtElement.querySelectorAll('.clickable-svg-element');
        
        clickables.forEach(el => {
            // Play note if it's a piano key
            if (el.classList.contains('piano-key')) {
                el.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering other SVG clicks if any
                    const noteName = el.dataset.note;
                    if (noteName && noteFrequencies[noteName]) {
                        playNoteSequence({ overallVolume: 0.15, notes: [{freq: noteFrequencies[noteName], duration: Q, type:'square'}] });
                    }
                });
            }

            // Show info on hover
            const info = el.dataset.info;
            if (info) {
                el.addEventListener('mousemove', (e) => {
                    popupElement.textContent = info;
                    // Position popup near mouse, considering SVG's position relative to viewport
                    const svgRect = svgArtElement.getBoundingClientRect();
                    popupElement.style.left = (e.clientX - svgRect.left + 15) + 'px'; // Adjust for mouse position within SVG
                    popupElement.style.top = (e.clientY - svgRect.top - popupElement.offsetHeight - 5) + 'px'; // Above cursor
                    popupElement.style.opacity = '1';
                });
                el.addEventListener('mouseleave', () => {
                    popupElement.style.opacity = '0';
                });
            }
        });
    }
    
    setupClickableSVGElementsForPage(0); // Page 1
    setupClickableSVGElementsForPage(1); // Page 2
    setupClickableSVGElementsForPage(2); // Page 3


    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => showPage(0));

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    showPage(0);
});