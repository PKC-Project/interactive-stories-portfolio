document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-momotaro'),
        document.getElementById('page2-momotaro'),
        document.getElementById('page3-momotaro')
    ];
    const storyTextContainers = [ // To find .lang spans within
        document.getElementById('text-page1-momo'),
        document.getElementById('text-page2-momo'),
        document.getElementById('text-page3-momo')
    ];

    const nextPage1Btn = document.getElementById('next-page1-momo');
    const prevPage2Btn = document.getElementById('prev-page2-momo');
    const nextPage2Btn = document.getElementById('next-page2-momo');
    const prevPage3Btn = document.getElementById('prev-page3-momo');
    const restartBtn = document.getElementById('restart-story-momo');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');
    const languageToggleButtons = document.querySelectorAll('.language-toggle-button');

    // Page 1 specific
    const clickablePeach = document.getElementById('clickable-peach');
    const peachText = document.getElementById('peach-text');
    let peachClicked = false;

    // Page 2 specific
    const animalCompanions = document.querySelectorAll('.animal-companion');
    const animalNameDisplay = document.getElementById('animal-name-display');

    // Page 3 specific
    const oniElements = document.querySelectorAll('.oni');
    const battleActionText = document.getElementById('battle-action-text');
    let defeatedOniCount = 0;

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let currentLanguage = 'en'; // Start in English

    function initAudioContext() { /* ... (same) ... */ 
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return audioContext;
    }
    function stopAllSounds() { /* ... (same) ... */ 
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
        currentOscillators = [];
    }
    function playNoteSequence(notesConfig) { /* ... (same as previous, with envelope) ... */
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

    const pageMusicMomotaro = {
        0: { // Page 1: Gentle, koto-like, mysterious
            overallVolume: 0.07,
            notes: [
                { freq: 440.00, duration: H, delay: 0, type: 'triangle', volMultiplier: 0.8}, // A4
                { freq: 493.88, duration: H, delay: H*0.5, type: 'triangle', volMultiplier: 0.8}, // B4
                { freq: 329.63, duration: W, delay: H, type: 'sine', volMultiplier: 1},   // E4
            ]
        },
        1: { // Page 2: Adventurous, meeting companions
            overallVolume: 0.08,
            notes: [
                { freq: 392.00, duration: Q, delay: 0, type: 'square', volMultiplier: 1}, // G4
                { freq: 440.00, duration: Q, delay: Q, type: 'square', volMultiplier: 1}, // A4
                { freq: 523.25, duration: H, delay: 2*Q, type: 'square', volMultiplier: 1.2}, // C5
                { freq: 493.88, duration: Q, delay: 2*Q+H, type: 'sine', volMultiplier: 0.9} // B4
            ]
        },
        2: { // Page 3: Battle, then triumphant/peaceful
            overallVolume: 0.1,
            notes: [ // Initial tension
                { freq: 130.81, duration: E, delay: 0, type: 'sawtooth', volMultiplier: 1.2}, { freq: 130.81, duration: E, delay: E*1.2, type: 'sawtooth', volMultiplier: 1.2},
                { freq: 146.83, duration: Q, delay: E*2.4, type: 'sawtooth', volMultiplier: 1.3},
                // Victory/Peace (placeholder - LLM to make more thematic)
                { freq: 523.25, duration: H, delay: Q*2, type: 'sine', volMultiplier: 1.1},
                { freq: 659.25, duration: W, delay: Q*2+H, type: 'sine', volMultiplier: 1.3}
            ]
        }
    };
    const soundEffects = {
        peachOpen: { overallVolume: 0.1, notes: [{freq: 600, duration:E*0.5, type:'triangle'}, {freq: 800, duration:E*0.8, delay: E*0.3, type:'sine'}]},
        animalClick: { overallVolume: 0.08, notes: [{freq: 700 + Math.random()*200, duration:E*0.6, type:'square'}]},
        oniHit: { overallVolume: 0.15, notes: [{freq: 100, duration:E, type:'sawtooth', volMultiplier:1.5}, {freq: 80, duration:E*1.5, delay: E*0.5, type:'noise'}]}, // Noise needs specific Web Audio setup
        victory: { overallVolume: 0.12, notes: [{freq:523.25, duration:Q},{freq:659.25,duration:Q, delay:Q},{freq:783.99,duration:H, delay:2*Q}]}
    };


    function animateText(textContainer) {
        if(textContainer) {
            const currentLangSpan = textContainer.querySelector('.lang.current');
            if (currentLangSpan) {
                currentLangSpan.classList.remove('text-fade-in');
                void currentLangSpan.offsetWidth; 
                currentLangSpan.classList.add('text-fade-in');
            }
        }
    }

    function setLanguage(lang) {
        document.querySelectorAll('.page').forEach(page => {
            const langSpans = page.querySelectorAll('.lang');
            langSpans.forEach(span => {
                span.classList.remove('current');
                if (span.classList.contains(lang)) {
                    span.classList.add('current');
                }
            });
        });
        currentLanguage = lang;
        languageToggleButtons.forEach(btn => {
            btn.textContent = lang === 'en' ? '日本語で読む' : 'Read in English';
        });
        // Re-trigger fade-in for current page's text
        if(storyTextContainers[currentPageIndex]) {
            animateText(storyTextContainers[currentPageIndex]);
        }
    }

    languageToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLanguage(currentLanguage === 'en' ? 'ja' : 'en');
        });
    });

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

        setLanguage(currentLanguage); // Ensures correct language is shown and animated
        if (pageMusicMomotaro[currentPageIndex]) {
            playNoteSequence(pageMusicMomotaro[currentPageIndex]);
        }
        if (currentPageIndex === 2) { // Page 3 - Ogre battle
            if(battleActionText) battleActionText.textContent = '';
            oniElements.forEach(oni => oni.classList.remove('defeated'));
            defeatedOniCount = 0;
        }
    }
    
    // --- Page 1: Peach Click ---
    if (clickablePeach && peachText) {
        clickablePeach.addEventListener('click', () => {
            if (currentPageIndex === 0 && !peachClicked) {
                peachText.style.visibility = 'visible';
                peachText.textContent = currentLanguage === 'ja' ? 'パカッ！' : 'Crack!'; // Pakah! (sound of splitting)
                clickablePeach.style.fill = '#FFC0CB'; // Change color slightly
                playNoteSequence(soundEffects.peachOpen);
                peachClicked = true; // Prevent multiple clicks from re-triggering full animation
                setTimeout(() => { if(peachText) peachText.style.visibility = 'hidden';}, 1500);
            }
        });
    }

    // --- Page 2: Animal Companion Clicks ---
    animalCompanions.forEach(animal => {
        animal.addEventListener('click', () => {
            if (currentPageIndex === 1 && animalNameDisplay) {
                const nameEn = animal.dataset.nameEn;
                const nameJa = animal.dataset.nameJa;
                animalNameDisplay.textContent = currentLanguage === 'en' ? nameEn : nameJa;
                playNoteSequence(soundEffects.animalClick); // Generic click, LLM could make specific
                setTimeout(() => { if(animalNameDisplay) animalNameDisplay.textContent = ''; }, 2000);
            }
        });
    });

    // --- Page 3: Oni Battle ---
    oniElements.forEach(oni => {
        oni.addEventListener('click', () => {
            if (currentPageIndex === 2 && !oni.classList.contains('defeated')) {
                oni.classList.add('defeated');
                playNoteSequence(soundEffects.oniHit); // Simplified hit sound
                defeatedOniCount++;
                if (battleActionText) battleActionText.textContent = `Oni ${defeatedOniCount} defeated!`;
                if (defeatedOniCount === oniElements.length) {
                    if(battleActionText) battleActionText.textContent = currentLanguage === 'ja' ? '鬼を全部倒した！やった！' : 'All ogres defeated! Victory!';
                    playNoteSequence(soundEffects.victory);
                }
            }
        });
    });

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        peachClicked = false;
        if(peachText) peachText.style.visibility = 'hidden';
        if(clickablePeach) clickablePeach.style.fill = '#FFB6C1';
        if(animalNameDisplay) animalNameDisplay.textContent = '';
        oniElements.forEach(oni => oni.classList.remove('defeated'));
        defeatedOniCount = 0;
        if(battleActionText) battleActionText.textContent = '';
        setLanguage('en'); // Reset to default English
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    // Initialize
    setLanguage('en'); // Set initial language
    showPage(0); 
});