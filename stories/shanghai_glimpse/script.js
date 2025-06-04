document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-shanghai'),
        document.getElementById('page2-shanghai'),
        document.getElementById('page3-shanghai')
    ];
    const storyTexts = [ // For fade-in animation
        document.getElementById('text-page1-shanghai'),
        document.getElementById('text-page2-shanghai'),
        document.getElementById('text-page3-shanghai')
    ];

    const nextPage1Btn = document.getElementById('next-page1-shanghai');
    const prevPage2Btn = document.getElementById('prev-page2-shanghai');
    const nextPage2Btn = document.getElementById('next-page2-shanghai');
    const prevPage3Btn = document.getElementById('prev-page3-shanghai');
    const restartBtn = document.getElementById('restart-story-shanghai');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Popups for each page
    const infoPopups = {
        p1: document.getElementById('info-popup-shanghai-p1'),
        p2: document.getElementById('info-popup-shanghai-p2'),
        p3: document.getElementById('info-popup-shanghai-p3')
    };
    
    const svgAreas = {
        p1: document.getElementById('svg-page1-shanghai-art'),
        p2: document.getElementById('svg-page2-shanghai-art'),
        p3: document.getElementById('svg-page3-shanghai-art')
    };


    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;

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

    const pageMusicShanghai = {
        0: { // Page 1: The Bund - Slightly grand, hint of traditional Chinese + modern bustle
            overallVolume: 0.07,
            notes: [ // Pentatonic feel
                { freq: 293.66, duration: H, delay: 0, type: 'triangle', volMultiplier: 1},    // D4
                { freq: 329.63, duration: Q, delay: H*0.8, type: 'triangle', volMultiplier: 0.9}, // E4
                { freq: 440.00, duration: H, delay: H*0.8+Q, type: 'sine', volMultiplier: 1.1},   // A4
                { freq: 392.00, duration: Q, delay: H*0.8+Q+H*0.7, type: 'triangle', volMultiplier: 0.8} // G4
            ]
        },
        1: { // Page 2: Pudong - Futuristic, slightly electronic, ascending
            overallVolume: 0.09,
            notes: [
                { freq: 440.00, duration: Q, delay: 0, type: 'square', volMultiplier: 1},   // A4
                { freq: 523.25, duration: Q, delay: Q*1.1, type: 'square', volMultiplier: 1.1}, // C5
                { freq: 587.33, duration: Q, delay: Q*2.2, type: 'square', volMultiplier: 1.2}, // D5
                { freq: 698.46, duration: H, delay: Q*3.3, type: 'sawtooth', volMultiplier: 1.3} // F5
            ]
        },
        2: { // Page 3: Yu Garden/Flavors - Peaceful, traditional, then slightly lively
            overallVolume: 0.08,
            notes: [ // Garden part
                { freq: 349.23, duration: H, delay: 0, type: 'sine', volMultiplier: 1},   // F4
                { freq: 392.00, duration: H, delay: H*0.9, type: 'sine', volMultiplier: 0.9}, // G4
                { freq: 293.66, duration: W, delay: H*1.8, type: 'triangle', volMultiplier: 1.1}, // D4
                // Food part - slightly more upbeat
                { freq: 523.25, duration: E, delay: W*1.5, type: 'square', volMultiplier: 1.2},
                { freq: 587.33, duration: E, delay: W*1.5+E*1.2, type: 'square', volMultiplier: 1.2},
                { freq: 659.25, duration: Q, delay: W*1.5+E*2.4, type: 'square', volMultiplier: 1.2}
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
        if (pageMusicShanghai[currentPageIndex]) {
            playNoteSequence(pageMusicShanghai[currentPageIndex]);
        }
        
        // Hide all popups when changing page
        Object.values(infoPopups).forEach(popup => { if(popup) popup.style.opacity = '0'; });

        if (currentPageIndex === 1) { // Pudong page
            animatePudongLights();
        } else {
            const lightsContainer = svgAreas.p2 ? svgAreas.p2.getElementById('twinkling-lights') : null;
            if (lightsContainer) lightsContainer.innerHTML = ''; // Clear lights if not on page 2
        }
    }
    
    // --- Generic SVG Clickable Element with Popup ---
    function setupClickableSVGElements(pageKey) {
        const svgArtElement = svgAreas[pageKey];
        const popupElement = infoPopups[pageKey];

        if (!svgArtElement || !popupElement) return;

        const clickables = svgArtElement.querySelectorAll('.clickable-svg-element');
        
        clickables.forEach(el => {
             const info = el.dataset.info;
             if (info) {
                el.addEventListener('mousemove', (e) => {
                    popupElement.textContent = info;
                    const svgRect = svgArtElement.getBoundingClientRect(); // Get SVG's current position
                    const storybookRect = svgArtElement.closest('.page').getBoundingClientRect(); // Storybook container

                    // Calculate position relative to the page, then adjust for fixed positioning
                    let x = e.clientX - storybookRect.left + 10;
                    let y = e.clientY - storybookRect.top - popupElement.offsetHeight - 10; // Above cursor

                    popupElement.style.left = x + 'px'; 
                    popupElement.style.top = y + 'px';
                    popupElement.style.opacity = '1';
                    popupElement.style.position = 'absolute'; // Position relative to the page div
                });
                el.addEventListener('mouseleave', () => {
                    popupElement.style.opacity = '0';
                });
                el.addEventListener('click', () => { // Simple sound on click
                     playNoteSequence({overallVolume: 0.05, notes: [{freq: 700 + Math.random()*100, duration: E*0.5, type:'sine'}]});
                 });
            }
        });
    }
    
    setupClickableSVGElements('p1');
    setupClickableSVGElements('p2'); // For Pudong landmarks if they have data-info
    setupClickableSVGElements('p3');


    // --- Page 2: Pudong Twinkling Lights Animation ---
    function animatePudongLights() {
        const lightsContainer = svgAreas.p2 ? svgAreas.p2.getElementById('twinkling-lights') : null;
        if (!lightsContainer) return;
        lightsContainer.innerHTML = ''; // Clear previous lights
        const numLights = 15;
        const colors = ['#FFFFE0', '#FFFACD', '#FAFAD2']; // Light yellows

        for (let i = 0; i < numLights; i++) {
            const light = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            // Position lights randomly on the Pudong skyline area (approx x: 20-150, y: 10-75)
            light.setAttribute('cx', 20 + Math.random() * 130);
            light.setAttribute('cy', 10 + Math.random() * 65);
            light.setAttribute('r', Math.random() * 1 + 0.5); // Radius 0.5 to 1.5
            light.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)]);
            light.classList.add('pudong-light'); // CSS handles animation
            light.style.animationDelay = Math.random() * 1.5 + 's'; // Stagger animation
            lightsContainer.appendChild(light);
        }
    }
    
    // --- Term Highlighting (Simple Tooltip) ---
    // This is a basic version. A more robust solution might use a dedicated tooltip library.
    document.querySelectorAll('.term').forEach(term => {
        const tooltipText = term.title; // Use the title attribute for the English explanation
        if (tooltipText) {
            term.addEventListener('mouseover', (e) => {
                const popup = infoPopups.p1 || infoPopups.p2 || infoPopups.p3; // Use any available popup
                if (popup) {
                    popup.textContent = `${term.textContent.trim()}: ${tooltipText}`;
                    const termRect = term.getBoundingClientRect();
                    const storybookRect = term.closest('.page').getBoundingClientRect();
                    
                    popup.style.left = (termRect.left - storybookRect.left + termRect.width / 2 - popup.offsetWidth / 2) + 'px';
                    popup.style.top = (termRect.top - storybookRect.top - popup.offsetHeight - 5) + 'px';
                    popup.style.opacity = '1';
                    popup.style.position = 'absolute';
                }
            });
            term.addEventListener('mouseout', () => {
                const popup = infoPopups.p1 || infoPopups.p2 || infoPopups.p3;
                if (popup) popup.style.opacity = '0';
            });
        }
    });


    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    showPage(0); // Initialize
});