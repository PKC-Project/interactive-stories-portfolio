document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-curie'),
        document.getElementById('page2-curie'),
        document.getElementById('page3-curie')
    ];
    const storyTexts = [
        document.getElementById('text-page1-curie'),
        document.getElementById('text-page2-curie'),
        document.getElementById('text-page3-curie')
    ];

    const nextPage1Btn = document.getElementById('next-page1-curie');
    const prevPage2Btn = document.getElementById('prev-page2-curie');
    const nextPage2Btn = document.getElementById('next-page2-curie');
    const prevPage3Btn = document.getElementById('prev-page3-curie');
    const restartBtn = document.getElementById('restart-story-curie');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    const infoPopupP1 = document.getElementById('info-popup-curie-p1');
    const processOreBtn = document.getElementById('process-ore-button');
    const progressBar = document.getElementById('progress-bar-curie');
    const beakerLiquids = [ // For simple animation
        document.getElementById('beaker1-liquid'),
        document.getElementById('beaker2-liquid'),
        document.getElementById('beaker3-liquid')
    ];


    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let oreProcessedCount = 0;
    const oreNeededToProceed = 5; // How many clicks to fill the bar

    function initAudioContext() { /* ... (same as Beethoven script) ... */ 
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }
    function stopAllSounds() { /* ... (same as Beethoven script) ... */
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
        currentOscillators = [];
    }
    function playNoteSequence(notesConfig) { /* ... (same as Beethoven script) ... */
        if (!initAudioContext() || !notesConfig || !notesConfig.notes) return;
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
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;

    // LLM Task: Generate these musical motifs
    const pageMusicCurie = {
        0: { // Page 1: Inquiry, slight mystery
            overallVolume: 0.07,
            notes: [
                { freq: 174.61, duration: H, delay: 0, type: 'triangle', volMultiplier: 1}, // F3
                { freq: 220.00, duration: Q, delay: H, type: 'triangle', volMultiplier: 0.9}, // A3
                { freq: 207.65, duration: H + E, delay: H + Q, type: 'sine', volMultiplier: 1.1}, // G#3
            ]
        },
        1: { // Page 2: Laborious process - repetitive, building
            overallVolume: 0.06,
            notes: [ // Short, slightly tense, repetitive clicks/sounds
                { freq: 100, duration: E*0.5, delay: 0, type: 'square', volMultiplier: 0.8}, 
                { freq: 110, duration: E*0.5, delay: Q, type: 'square', volMultiplier: 0.8},
                { freq: 90,  duration: E*0.5, delay: Q*1.8, type: 'square', volMultiplier: 0.8},
            ]
        },
        geigerClick: { // Sound for processing ore
             overallVolume: 0.1,
             notes: [{ freq: 1500 + Math.random()*500, duration: E*0.2, type: 'square', volMultiplier:0.5}]
        },
        processCompleteSound: {
            overallVolume: 0.15,
            notes: [{ freq: 600, duration: Q, delay: 0, type: 'sine'}, { freq: 800, duration: H, delay: Q*0.8, type: 'sine'}]
        },
        2: { // Page 3: Discovery, legacy - clearer, slightly triumphant
            overallVolume: 0.09,
            notes: [
                { freq: 329.63, duration: H, delay: 0, type: 'sine', volMultiplier: 1}, // E4
                { freq: 392.00, duration: H, delay: H*0.9, type: 'sine', volMultiplier: 1.1},   // G4
                { freq: 523.25, duration: W, delay: H*0.9 + H*0.8, type: 'sine', volMultiplier: 1.3}  // C5
            ]
        }
    };

    function animateText(textElement) { /* ... (same as Beethoven script) ... */
        if(textElement) {
            textElement.classList.remove('text-fade-in');
            void textElement.offsetWidth; 
            textElement.classList.add('text-fade-in');
        }
    }

    function showPage(index) { /* ... (same as Beethoven script, but use pageMusicCurie) ... */
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
        if (pageMusicCurie[currentPageIndex]) {
            playNoteSequence(pageMusicCurie[currentPageIndex]);
        }
        if(infoPopupP1) infoPopupP1.classList.remove('visible'); // Hide popups
    }
    
    // --- Page 1: SVG Click Interactions & Popups ---
    const svgPage1ArtEl = document.getElementById('svg-page1-curie-art');
    if (svgPage1ArtEl && infoPopupP1) {
        const clickablesP1 = svgPage1ArtEl.querySelectorAll('.clickable-svg-element');
        clickablesP1.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const info = el.dataset.info;
                if (info) {
                    infoPopupP1.textContent = info;
                    const svgRect = svgPage1ArtEl.getBoundingClientRect();
                    const storybookRect = document.getElementById('storybook-container-curie').getBoundingClientRect();
                    // Position relative to the storybook container for consistency
                    infoPopupP1.style.left = (e.clientX - storybookRect.left + 10) + 'px';
                    infoPopupP1.style.top = (e.clientY - storybookRect.top - infoPopupP1.offsetHeight - 10) + 'px';
                    infoPopupP1.classList.add('visible');
                }
            });
            el.addEventListener('mouseleave', () => {
                infoPopupP1.classList.remove('visible');
            });

            if (el.id === 'pitchblende-sample') {
                el.addEventListener('click', () => {
                    if (currentPageIndex === 0) {
                        document.getElementById('page1-instruction').textContent = "Correct! Pitchblende was key.";
                        el.setAttribute('fill', '#222'); // Darken it
                        if(nextPage1Btn) nextPage1Btn.disabled = false;
                        playNoteSequence({overallVolume:0.1, notes: [{freq:440, duration:Q, type:'sine'}]}); // Success sound
                    }
                });
            }
        });
    }

    // --- Page 2: Process Ore Interaction ---
    if (processOreBtn && progressBar && nextPage2Btn) {
        processOreBtn.addEventListener('click', () => {
            if (oreProcessedCount < oreNeededToProceed) {
                oreProcessedCount++;
                const progress = (oreProcessedCount / oreNeededToProceed) * 67;
                progressBar.style.width = progress + '%';
                if(pageMusicCurie.geigerClick) playNoteSequence(pageMusicCurie.geigerClick);

                // Animate beakers (simple color change)
                beakerLiquids.forEach((liquid, index) => {
                    if(liquid) liquid.style.fill = `hsl(${180 + oreProcessedCount * 10}, 70%, ${60 + index*6}%)`;
                });

                if (oreProcessedCount >= oreNeededToProceed) {
                    processOreBtn.textContent = "Processing Complete!";
                    processOreBtn.disabled = true;
                    nextPage2Btn.disabled = false;
                    if(pageMusicCurie.processCompleteSound) playNoteSequence(pageMusicCurie.processCompleteSound);
                } else {
                     processOreBtn.textContent = `Process Ore (${oreNeededToProceed - oreProcessedCount} left)`;
                }
            }
        });
    }


    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => {
        oreProcessedCount = 0; // Reset game state for page 2 if going back
        if(progressBar) progressBar.style.width = '0%';
        if(processOreBtn) {
            processOreBtn.textContent = "Process Ore Batch";
            processOreBtn.disabled = false;
        }
        if(nextPage2Btn) nextPage2Btn.disabled = true;
        showPage(0);
    });
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        oreProcessedCount = 0;
        if(progressBar) progressBar.style.width = '0%';
        if(processOreBtn) {
            processOreBtn.textContent = "Process Ore Batch";
            processOreBtn.disabled = false;
        }
        if(nextPage1Btn) nextPage1Btn.disabled = true; // Re-disable if restarting to page 1
        if(nextPage2Btn) nextPage2Btn.disabled = true;
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html'; 
        });
    });

    // Initial Page Load
    if(nextPage1Btn) nextPage1Btn.disabled = true; // Page 1 next button initially disabled
    showPage(0);
});