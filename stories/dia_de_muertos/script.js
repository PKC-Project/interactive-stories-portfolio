document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-diademuertos'),
        document.getElementById('page2-diademuertos'),
        document.getElementById('page3-diademuertos')
    ];
    const storyTexts = [
        document.getElementById('text-page1-diademuertos'),
        document.getElementById('text-page2-diademuertos'),
        document.getElementById('text-page3-diademuertos')
    ];

    const nextPage1Btn = document.getElementById('next-page1-diademuertos');
    const prevPage2Btn = document.getElementById('prev-page2-diademuertos');
    const nextPage2Btn = document.getElementById('next-page2-diademuertos');
    const prevPage3Btn = document.getElementById('prev-page3-diademuertos');
    const restartBtn = document.getElementById('restart-story-diademuertos');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page specific elements
    const infoPopupP1 = document.getElementById('info-popup-diademuertos-p1');
    const infoPopupP2 = document.getElementById('info-popup-diademuertos-p2');
    const languageToggleButtons = document.querySelectorAll('.language-toggle-button'); // Get all language buttons

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let currentLanguage = 'es'; // Start in Spanish

    function initAudioContext() { /* ... (same as previous story) ... */ 
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return audioContext;
    }
    function stopAllSounds() { /* ... (same as previous story) ... */ 
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
        currentOscillators = [];
    }
    function playNoteSequence(notesConfig) { /* ... (same as previous story) ... */
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
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.05);
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.1);
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.2);
            currentOscillators.push(oscillator);
        });
    }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;

    const pageMusicDiademuertos = { /* ... (Use the notes from previous response) ... */
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
                { freq: 523.25, duration: W, delay: H*0.8 + H*0.8, type: 'sine', volMultiplier: 1.4}  // C5 (stronger, longer)
            ]
        }
    };


    function animateText(textElement) { /* ... (same) ... */ 
        if(textElement) {
            textElement.classList.remove('text-fade-in');
            void textElement.offsetWidth; 
            textElement.classList.add('text-fade-in');
        }
    }

    // --- Multilingual Text Logic ---
    function setLanguage(lang) {
        const langElements = document.querySelectorAll('.lang');
        langElements.forEach(el => {
            el.classList.remove('current');
            if (el.classList.contains(lang)) {
                el.classList.add('current');
            }
        });
        currentLanguage = lang;
        // Update button text
        languageToggleButtons.forEach(btn => {
            if (lang === 'es') btn.textContent = 'Read in English';
            else btn.textContent = 'Leer en Español';
        });

        // Re-animate text after language change
        if(storyTexts[currentPageIndex]) {
             animateText(storyTexts[currentPageIndex].closest('.text-area').querySelector('.lang.current')); // Fade in the currently visible span
        }
    }

    languageToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetLang = currentLanguage === 'es' ? 'en' : 'es';
            setLanguage(targetLang);
        });
    });
    
    // --- Term Popups (Multilingual) ---
    function setupTermPopups() {
        const terms = document.querySelectorAll('.term');
        const popup = document.getElementById('info-popup-diademuertos-p1'); // Use one general popup or multiple

        if (!popup) {
            console.warn("Info popup element not found.");
             return;
        }

        terms.forEach(term => {
            term.addEventListener('mousemove', (e) => {
                const termInfoEs = term.dataset.termEs;
                const termInfoEn = term.dataset.termEn;
                let infoToShow = currentLanguage === 'es' ? termInfoEs : termInfoEn;

                if (infoToShow) {
                     // Add base term in current language + explanation in other? Depends on design
                     // E.g., "Ofrenda (altar)" or "altar (ofrenda)"
                    if(currentLanguage === 'es' && term.dataset.termEn) infoToShow = `${term.textContent} (${term.dataset.termEn})`;
                    else if (currentLanguage === 'en' && term.dataset.termEs) infoToShow = `${term.textContent} (${term.dataset.termEs})`;
                    else infoToShow = term.textContent; // Fallback

                    popup.textContent = infoToShow;
                    popup.style.left = (e.clientX + 15) + 'px'; // Position near mouse
                    popup.style.top = (e.clientY - 30) + 'px'; // Position above mouse
                    popup.style.opacity = '1';
                    popup.style.position = 'fixed'; // Ensure it positions relative to viewport
                }
            });
            term.addEventListener('mouseleave', () => {
                 popup.style.opacity = '0';
            });
        });
    }
    setupTermPopups(); // Set up once DOM is ready

    // --- SVG Click Interactions & Popups (Multilingual) ---
    function setupClickableSVGElementsForPage(pageIndex) {
        const svgArtElement = document.getElementById(`svg-page${pageIndex + 1}-diademuertos-art`);
        const popupElement = document.getElementById(`info-popup-diademuertos-p${pageIndex + 1}`); // Use popup for the specific page

        if (!svgArtElement || !popupElement) return;

        const clickables = svgArtElement.querySelectorAll('.clickable-svg-element');
        
        clickables.forEach(el => {
             const infoEs = el.dataset.infoEs;
             const infoEn = el.dataset.infoEn;

             if (infoEs || infoEn) {
                el.addEventListener('mousemove', (e) => {
                    const info = currentLanguage === 'es' ? infoEs : infoEn;
                    if (info) {
                        popupElement.textContent = info;
                         // Position popup relative to SVG container
                        const svgRect = svgArtElement.getBoundingClientRect();
                        popupElement.style.left = (e.clientX - svgRect.left + 10) + 'px'; 
                        popupElement.style.top = (e.clientY - svgRect.top - popupElement.offsetHeight - 5) + 'px';
                        popupElement.style.opacity = '1';
                        popupElement.style.position = 'absolute'; // Position relative to SVG container
                    }
                });
                el.addEventListener('mouseleave', () => {
                    popupElement.style.opacity = '0';
                });
                 // Optional: Add a click sound
                 el.addEventListener('click', () => {
                     playNoteSequence({overallVolume: 0.05, notes: [{freq: 880, duration: E*0.5, type:'sine'}]}); // Simple high beep
                 });
            }
        });
    }
    
    // Setup clickable SVG elements for pages 1, 2, and 3
    setupClickableSVGElementsForPage(0);
    setupClickableSVGElementsForPage(1);
    setupClickableSVGElementsForPage(2);


    function showPage(index) { /* ... (same as previous story, using pageMusicDiademuertos) ... */ 
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

        // Ensure correct text is shown for the current language on the new page
        setLanguage(currentLanguage); // This will also handle text fade-in

        if (pageMusicDiademuertos[currentPageIndex]) {
            playNoteSequence(pageMusicDiademuertos[currentPageIndex]);
        }
        // Hide all popups when changing page
        if(infoPopupP1) infoPopupP1.style.opacity = '0';
        if(infoPopupP2) infoPopupP2.style.opacity = '0';
    }
    
    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        // Reset language and start over
        setLanguage('es'); // Reset to default Spanish
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html'; // Adjust path if needed
        });
    });

    // Initialize - Set initial language and show first page
    setLanguage('es'); // Set default language on load
    showPage(0); 
});