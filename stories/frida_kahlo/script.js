document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-frida'),
        document.getElementById('page2-frida'),
        document.getElementById('page3-frida')
    ];
    const storyTexts = [ // For fade-in animation
        document.getElementById('text-page1-frida'),
        document.getElementById('text-page2-frida'),
        document.getElementById('text-page3-frida')
    ];

    const nextPage1Btn = document.getElementById('next-page1-frida');
    const prevPage2Btn = document.getElementById('prev-page2-frida');
    const nextPage2Btn = document.getElementById('next-page2-frida');
    const prevPage3Btn = document.getElementById('prev-page3-frida');
    const restartBtn = document.getElementById('restart-story-frida');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button'); // Get all return buttons

    const infoPopupP1 = document.getElementById('info-popup-frida');
    const infoPopupP2 = document.getElementById('info-popup-frida-p2');


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
        const overallVolume = notesConfig.overallVolume || 0.08;

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
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;

    const pageMusicFrida = {
        0: { // Page 1: Intimate, folk-inspired, resilient
            overallVolume: 0.07,
            notes: [
                { freq: 220.00, duration: H, delay: 0, type: 'triangle', volMultiplier: 1}, // A3
                { freq: 246.94, duration: Q, delay: H, type: 'triangle', volMultiplier: 0.9}, // B3
                { freq: 293.66, duration: H + E, delay: H + Q, type: 'sine', volMultiplier: 1.2}, // D4
                { freq: 261.63, duration: Q, delay: H + Q + H + E, type: 'triangle', volMultiplier: 0.8} // C4
            ]
        },
        1: { // Page 2: More vibrant, symbolic, hint of Mexican folk
            overallVolume: 0.09,
            notes: [
                { freq: 329.63, duration: Q, delay: 0, type: 'square', volMultiplier: 1.1}, // E4
                { freq: 392.00, duration: E, delay: Q, type: 'square', volMultiplier: 1},   // G4
                { freq: 440.00, duration: E, delay: Q + E, type: 'square', volMultiplier: 1},   // A4
                { freq: 392.00, duration: Q, delay: Q + 2 * E, type: 'square', volMultiplier: 1.1}, // G4
                { freq: 493.88, duration: H, delay: 2 * Q + 2 * E, type: 'sawtooth', volMultiplier: 1.3} // B4
            ]
        },
        2: { // Page 3: Reflective but powerful spirit
            overallVolume: 0.08,
            notes: [
                { freq: 440.00, duration: H, delay: 0, type: 'sine', volMultiplier: 1.2}, // A4
                { freq: 392.00, duration: H, delay: H*0.9, type: 'sine', volMultiplier: 1},   // G4
                { freq: 523.25, duration: W, delay: H*0.9 + H*0.8, type: 'sine', volMultiplier: 1.4}  // C5 (stronger, longer)
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
        if (pageMusicFrida[currentPageIndex]) {
            playNoteSequence(pageMusicFrida[currentPageIndex]);
        }
        // Hide popups when changing page
        if(infoPopupP1) infoPopupP1.style.opacity = '0';
        if(infoPopupP2) infoPopupP2.style.opacity = '0';
    }

    // --- SVG Click Interactions & Popups ---
    function setupClickableSVGElements(svgArtElement, popupElement) {
        if (!svgArtElement || !popupElement) return;
        const clickables = svgArtElement.querySelectorAll('.clickable-svg-element');
        
        clickables.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const info = el.dataset.info;
                if (info) {
                    popupElement.textContent = info;
                    popupElement.style.left = (e.clientX + 15 - svgArtElement.getBoundingClientRect().left) + 'px';
                    popupElement.style.top = (e.clientY - 30 - svgArtElement.getBoundingClientRect().top) + 'px';
                    popupElement.style.opacity = '1';
                }
            });
            el.addEventListener('mouseleave', () => {
                popupElement.style.opacity = '0';
            });
        });
    }
    
    setupClickableSVGElements(document.getElementById('svg-page1-frida-art'), infoPopupP1);
    setupClickableSVGElements(document.getElementById('svg-page2-frida-art'), infoPopupP2);


    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => showPage(0));

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html'; // Adjust path if needed
        });
    });

    showPage(0);
});