document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-leonardo'),
        document.getElementById('page2-leonardo'),
        document.getElementById('page3-leonardo')
    ];
    const storyTexts = [
        document.getElementById('text-page1-leonardo'),
        document.getElementById('text-page2-leonardo'),
        document.getElementById('text-page3-leonardo')
    ];

    const nextPage1Btn = document.getElementById('next-page1-leonardo');
    const prevPage2Btn = document.getElementById('prev-page2-leonardo');
    const nextPage2Btn = document.getElementById('next-page2-leonardo');
    const prevPage3Btn = document.getElementById('prev-page3-leonardo');
    const restartBtn = document.getElementById('restart-story-leonardo');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    const infoPopups = {
        0: document.getElementById('info-popup-leonardo'),
        1: document.getElementById('info-popup-leonardo-p2'),
        // Page 3 doesn't have interactive SVG elements in this simple version
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
        const overallVolume = notesConfig.overallVolume || 0.07; // Softer for Leonardo

        notesConfig.notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = note.type || 'sine';
            oscillator.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.03); // Slower attack
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.1); // Longer sustain
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.2); // Longer release
            currentOscillators.push(oscillator);
        });
    }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;

    const pageMusicLeonardo = {
        0: { // Page 1: Calm, clear, Renaissance polyphony hint
            overallVolume: 0.06,
            notes: [
                { freq: 261.63, duration: H, delay: 0, type: 'triangle', volMultiplier: 1},    // C4
                { freq: 329.63, duration: H, delay: Q, type: 'triangle', volMultiplier: 0.9},   // E4 (overlapping slightly)
                { freq: 392.00, duration: W, delay: H, type: 'sine', volMultiplier: 1.1},      // G4
            ]
        },
        1: { // Page 2: More complex, sense of depth/intellect
            overallVolume: 0.07,
            notes: [
                { freq: 196.00, duration: Q, delay: 0, type: 'square', volMultiplier: 1},     // G3
                { freq: 246.94, duration: Q, delay: Q*0.8, type: 'square', volMultiplier: 1},   // B3
                { freq: 293.66, duration: H, delay: Q*1.6, type: 'square', volMultiplier: 1.2}, // D4
                { freq: 440.00, duration: Q, delay: Q*1.6 + H*0.5, type: 'sine', volMultiplier: 1}, // A4 (higher voice)
                { freq: 392.00, duration: H, delay: Q*1.6 + H, type: 'sine', volMultiplier: 0.9}, // G4
            ]
        },
        2: { // Page 3: Thoughtful, grand, resolved
            overallVolume: 0.08,
            notes: [
                { freq: 261.63, duration: W, delay: 0, type: 'sine', volMultiplier: 1},     // C4 (long root)
                { freq: 329.63, duration: H, delay: W*0.3, type: 'sine', volMultiplier: 1.1},  // E4
                { freq: 392.00, duration: H, delay: W*0.3 + H*0.6, type: 'sine', volMultiplier: 1.2}, // G4
                { freq: 523.25, duration: W, delay: W*0.3 + H*1.2, type: 'sine', volMultiplier: 1.3}  // C5 (octave up, grand)
            ]
        }
    };

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
        if (pageMusicLeonardo[currentPageIndex]) {
            playNoteSequence(pageMusicLeonardo[currentPageIndex]);
        }
        Object.values(infoPopups).forEach(popup => { if(popup) popup.style.opacity = '0'; });
    }
    
    function setupClickableSVGElementsForPage(pageIndex) {
        const svgArtElement = document.getElementById(`svg-page${pageIndex + 1}-leonardo-art`);
        const popupElement = infoPopups[pageIndex];
        if (!svgArtElement || !popupElement) return;

        const clickables = svgArtElement.querySelectorAll('.clickable-svg-element');
        
        clickables.forEach(el => {
            const info = el.dataset.info;
            if (info) {
                el.addEventListener('mousemove', (e) => {
                    const svgRect = svgArtElement.getBoundingClientRect();
                    const storybookRect = document.getElementById('storybook-container-leonardo').getBoundingClientRect();
                    
                    // Calculate position relative to the storybook container for fixed popup
                    let x = e.clientX - storybookRect.left + 15;
                    let y = e.clientY - storybookRect.top - popupElement.offsetHeight - 10; // Above cursor

                    // Boundary checks for popup within storybook container
                    if (x + popupElement.offsetWidth > storybookRect.width -10) {
                        x = e.clientX - storybookRect.left - popupElement.offsetWidth - 15; // Place left of cursor
                    }
                    if (y < 10) { // If too close to top, place below cursor
                        y = e.clientY - storybookRect.top + 15;
                    }


                    popupElement.textContent = info;
                    popupElement.style.left = x + 'px';
                    popupElement.style.top = y + 'px';
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
    // Page 3 has no specific clickables in this simple version, but you could add them.


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