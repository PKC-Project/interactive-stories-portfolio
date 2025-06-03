document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-bach'),
        document.getElementById('page2-bach'),
        document.getElementById('page3-bach')
    ];
    const storyTexts = [
        document.getElementById('text-page1-bach'),
        document.getElementById('text-page2-bach'),
        document.getElementById('text-page3-bach')
    ];

    const nextPage1Btn = document.getElementById('next-page1-bach');
    const prevPage2Btn = document.getElementById('prev-page2-bach');
    const nextPage2Btn = document.getElementById('next-page2-bach');
    const prevPage3Btn = document.getElementById('prev-page3-bach');
    const restartBtn = document.getElementById('restart-story-bach');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    const infoPopups = { // Popups for pages that have them
        1: document.getElementById('info-popup-bach-p2'), // Page 2
        2: document.getElementById('info-popup-bach-p3')  // Page 3
    };
     // Page 1 has organ pipes that play sound, no separate text popup needed in this structure
    const organPipes = document.querySelectorAll('#svg-page1-bach-art .clickable-svg-element.organ-pipe');


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

    function playNoteSequence(notesConfig, onEndedCallback) {
        if (!initAudioContext()) {
            if (onEndedCallback) onEndedCallback();
            return;
        }
        stopAllSounds();
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.09;
        let longestDuration = 0;

        notesConfig.notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = note.type || 'organ'; // Default to organ-like for Bach
            if (oscillator.type === 'organ') { // Custom organ-like sound
                oscillator.type = 'sawtooth'; // Base for organ
                const LFO = audioContext.createOscillator();
                const LFOGain = audioContext.createGain();
                LFO.frequency.value = 5 + Math.random() * 5; // Vibrato
                LFOGain.gain.value = 3 + Math.random() * 3; // Vibrato depth
                LFO.connect(LFOGain);
                LFOGain.connect(oscillator.frequency); // Modulate frequency
                LFO.start(now + (note.delay || 0));
                LFO.stop(now + (note.delay || 0) + note.duration + 0.2);
                currentOscillators.push(LFO); // Manage LFO too
            }


            oscillator.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + (note.attack || 0.03));
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - (note.release || 0.1));
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            
            oscillator.start(now + (note.delay || 0));
            const stopTime = now + (note.delay || 0) + note.duration + 0.1;
            oscillator.stop(stopTime);
            currentOscillators.push(oscillator);
            if (stopTime > longestDuration) longestDuration = stopTime;
        });
        if (onEndedCallback) {
            const timeUntilEnd = (longestDuration - now + 0.1) * 1000; // Add small buffer
            setTimeout(onEndedCallback, Math.max(0, timeUntilEnd));
        }
    }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0; // Durations

    // Frequencies for Bach - he often used well-tempered tuning
    const noteFreqs = { C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, Bb3:233.08, B3:246.94,
                        C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, Bb4:466.16, B4:493.88, C5:523.25 };

    const pageMusicBach = {
        0: { // Page 1: Baroque organ, contrapuntal hint
            overallVolume: 0.07,
            notes: [ // Simple two-part invention start idea
                { freq: noteFreqs.C4, duration: Q, delay: 0*E, type: 'organ', attack:0.05, release: 0.15},
                { freq: noteFreqs.D4, duration: E, delay: 2*E, type: 'organ'},
                { freq: noteFreqs.E4, duration: E, delay: 3*E, type: 'organ'},
                { freq: noteFreqs.F4, duration: Q, delay: 4*E, type: 'organ'},
                // Lower voice
                { freq: noteFreqs.G3, duration: H, delay: 1*E, type: 'organ', volMultiplier:0.8, attack:0.08},
            ]
        },
        1: { // Page 2: Complex Polyphony, Fugue idea
            overallVolume: 0.08,
            notes: [ // Fugue subject (simplified) - Voice 1
                { freq: noteFreqs.A3, duration: Q, delay: 0, type: 'organ', volMultiplier:1.1, attack:0.04},
                { freq: noteFreqs.E4, duration: Q, delay: Q, type: 'organ', volMultiplier:1.1},
                { freq: noteFreqs.D4, duration: E, delay: 2*Q, type: 'organ', volMultiplier:1.1},
                { freq: noteFreqs.C4, duration: E, delay: 2*Q+E, type: 'organ', volMultiplier:1.1},
                // Answer (Voice 2, starts later)
                { freq: noteFreqs.E3, duration: Q, delay: 2*Q, type: 'organ', volMultiplier:0.9, attack:0.05},
                { freq: noteFreqs.B3, duration: Q, delay: 3*Q, type: 'organ', volMultiplier:0.9},
                { freq: noteFreqs.A3, duration: E, delay: 4*Q, type: 'organ', volMultiplier:0.9},
                { freq: noteFreqs.G3, duration: E, delay: 4*Q+E, type: 'organ', volMultiplier:0.9},
            ]
        },
        2: { // Page 3: Majestic Chorale / Resolved
            overallVolume: 0.1,
            notes: [ // Simple chorale-like progression (C-G-Am-F-C)
                { freq: noteFreqs.C4, duration: H, delay: 0, type: 'organ', attack:0.1, release:0.2, volMultiplier:1.2},
                { freq: noteFreqs.E3, duration: H, delay: 0, type: 'organ', volMultiplier:0.8},
                { freq: noteFreqs.G3, duration: H, delay: 0, type: 'organ', volMultiplier:1.0},

                { freq: noteFreqs.G3, duration: H, delay: H, type: 'organ', volMultiplier:1.2},
                { freq: noteFreqs.B3, duration: H, delay: H, type: 'organ', volMultiplier:0.8},
                { freq: noteFreqs.D4, duration: H, delay: H, type: 'organ', volMultiplier:1.0},
                
                { freq: noteFreqs.A3, duration: H, delay: 2*H, type: 'organ', volMultiplier:1.2},
                { freq: noteFreqs.C4, duration: H, delay: 2*H, type: 'organ', volMultiplier:0.8},
                { freq: noteFreqs.E4, duration: H, delay: 2*H, type: 'organ', volMultiplier:1.0},

                { freq: noteFreqs.C4, duration: W, delay: 3*H, type: 'organ', volMultiplier:1.4, attack:0.15, release:0.3},
                { freq: noteFreqs.E3, duration: W, delay: 3*H, type: 'organ', volMultiplier:0.9},
                { freq: noteFreqs.G3, duration: W, delay: 3*H, type: 'organ', volMultiplier:1.1},
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
        if (pageMusicBach[currentPageIndex]) {
            playNoteSequence(pageMusicBach[currentPageIndex]);
        }
        Object.values(infoPopups).forEach(popup => { if(popup) popup.style.opacity = '0'; });
    }
    
    // --- SVG Click Interactions & Popups ---
    function setupClickableSVGElementsForPage(pageIndex) {
        const svgArtElement = document.getElementById(`svg-page${pageIndex + 1}-bach-art`);
        const popupElement = infoPopups[pageIndex]; // May be undefined if page has no popup div
        
        if (!svgArtElement) return;
        const clickables = svgArtElement.querySelectorAll('.clickable-svg-element');
        
        clickables.forEach(el => {
            const info = el.dataset.info;
            if (info && popupElement) { // Only add hover for info if popupElement exists for this page
                el.addEventListener('mousemove', (e) => {
                    const storybookContainer = document.getElementById('storybook-container-bach'); // Or common class
                    if (!storybookContainer) return;
                    const storybookRect = storybookContainer.getBoundingClientRect();
                    
                    let x = e.clientX - storybookRect.left + 15;
                    let y = e.clientY - storybookRect.top - popupElement.offsetHeight - 10; 
                    if (x + popupElement.offsetWidth > storybookRect.width - 10) {
                        x = e.clientX - storybookRect.left - popupElement.offsetWidth - 15;
                    }
                    if (y < 10) { y = e.clientY - storybookRect.top + 15; }

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

    // Page 1 Organ Pipe Clicks
    if(organPipes) {
        organPipes.forEach(pipe => {
            pipe.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentPageIndex === 0) {
                    const note = pipe.dataset.note; // Should be C3, G3, C4 etc.
                    if (note && noteFreqs[note]) {
                         playNoteSequence({ overallVolume: 0.15, notes: [{freq: noteFreqs[note], duration: H, type:'organ', attack:0.05, release:0.2}] });
                    }
                }
            });
        });
    }
    
    setupClickableSVGElementsForPage(1); // Page 2 (Polyphony)
    setupClickableSVGElementsForPage(2); // Page 3 (Legacy)

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