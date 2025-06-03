document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const pages = [
        document.getElementById('page1'),
        document.getElementById('page2'),
        document.getElementById('page3')
    ];

    // Navigation buttons
    const nextPage1Btn = document.getElementById('next-page1');
    const prevPage2Btn = document.getElementById('prev-page2');
    const nextPage2Btn = document.getElementById('next-page2');
    const prevPage3Btn = document.getElementById('prev-page3');
    const restartBtn = document.getElementById('restart-story');

    // Page 2 specific elements
    const toggleArtBtn = document.getElementById('toggle-art-style');
    const artPage2SVG = document.getElementById('svg-page2-art'); // The SVG element itself

    let currentPageIndex = 0;
    let audioContext; // For Web Audio API
    let currentOscillators = []; // To manage multiple oscillators for chords/sequences

    // --- Helper: Initialize Audio Context ---
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    // --- Helper: Stop all current sounds ---
    function stopAllSounds() {
        currentOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) { /* ignore if already stopped */ }
        });
        currentOscillators = [];
    }

    // --- Helper: Play a sequence of notes ---
    function playNoteSequence(notes) { // notes = [{freq, duration, delay, type, volume}, ...]
        if (!initAudioContext()) {
            console.error("Web Audio API not supported.");
            return;
        }
        stopAllSounds(); // Stop previous sounds before starting new ones

        const now = audioContext.currentTime;
        
        notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = note.type || 'sine';
            oscillator.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
            gainNode.gain.setValueAtTime(note.volume || 0.1, now + (note.delay || 0));
            gainNode.gain.exponentialRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration);
            currentOscillators.push(oscillator);
        });
    }

    // --- Music/Sound Definitions for Each Page (LLM would generate these note sequences) ---
    const pageMusic = {
        0: [ // Page 1: Early Life - Somber, simple
            { freq: 220.00, duration: 1.0, delay: 0.0, type: 'triangle', volume: 0.08 }, // A3
            { freq: 261.63, duration: 0.8, delay: 1.1, type: 'triangle', volume: 0.07 }, // C4
            { freq: 246.94, duration: 1.2, delay: 2.0, type: 'triangle', volume: 0.06 }  // B3
        ],
        1: { // Page 2: Arles - Brighter, two styles
            sunflowers: [
                { freq: 392.00, duration: 0.5, delay: 0.0, type: 'sawtooth', volume: 0.1 }, // G4
                { freq: 440.00, duration: 0.5, delay: 0.5, type: 'sawtooth', volume: 0.1 }, // A4
                { freq: 523.25, duration: 0.7, delay: 1.0, type: 'sawtooth', volume: 0.12 } // C5
            ],
            starryNight: [
                { freq: 293.66, duration: 0.8, delay: 0.0, type: 'square', volume: 0.09 },  // D4
                { freq: 440.00, duration: 0.6, delay: 0.8, type: 'square', volume: 0.08 },  // A4
                { freq: 587.33, duration: 1.0, delay: 1.5, type: 'square', volume: 0.1 }   // D5 (swirling feel)
            ]
        },
        2: [ // Page 3: Legacy - Reflective, slightly hopeful
            { freq: 523.25, duration: 1.0, delay: 0.0, type: 'sine', volume: 0.1 },   // C5
            { freq: 493.88, duration: 0.8, delay: 1.1, type: 'sine', volume: 0.09 },  // B4
            { freq: 392.00, duration: 1.5, delay: 2.0, type: 'sine', volume: 0.12 }   // G4 (resolving feel)
        ]
    };

    let isStarryNightStyle = false; // For page 2 SVG toggle

    // --- Page Navigation Logic ---
    function showPage(index) {
        if (index < 0 || index >= pages.length) return;

        pages.forEach((page, i) => {
            if (page) { // Check if page element exists
                 page.classList.remove('current-page');
            }
        });
        if (pages[index]) {
            pages[index].classList.add('current-page');
            currentPageIndex = index;
            
            // Play music for the current page
            if (pageMusic[currentPageIndex]) {
                if (currentPageIndex === 1) { // Page 2 has two styles
                    playNoteSequence(isStarryNightStyle ? pageMusic[1].starryNight : pageMusic[1].sunflowers);
                } else {
                    playNoteSequence(pageMusic[currentPageIndex]);
                }
            }
        }
    }

    // --- SVG Manipulation for Page 2 Art Style Toggle ---
    if (toggleArtBtn && artPage2SVG) {
        toggleArtBtn.addEventListener('click', () => {
            isStarryNightStyle = !isStarryNightStyle;
            
            // LLM would generate more sophisticated SVG manipulations.
            // This is a VERY simplified example changing a background rect and text.
            const backgroundRect = artPage2SVG.querySelector('rect:first-of-type'); // Assuming first rect is background
            const centralCircle = artPage2SVG.querySelector('circle'); // Assuming a circle for sunflower center
            let textElement = artPage2SVG.querySelector('text');

            if (isStarryNightStyle) {
                if (backgroundRect) backgroundRect.setAttribute('fill', '#001f74'); // Deep blue
                if (centralCircle) centralCircle.setAttribute('fill', '#FFFFE0'); // Moon/Star color
                if (textElement) {
                    textElement.textContent = 'Starry Night!';
                    textElement.setAttribute('fill', 'white');
                } else { // Create text if it doesn't exist
                    textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    textElement.setAttribute('x', '75');
                    textElement.setAttribute('y', '60'); // Adjust as needed
                    textElement.setAttribute('text-anchor', 'middle');
                    textElement.setAttribute('font-size', '10');
                    textElement.setAttribute('fill', 'white');
                    textElement.textContent = 'Starry Night!';
                    artPage2SVG.appendChild(textElement);
                }
                // LLM: Add swirling paths or star elements here
                // Example: Add a simple star
                let star = artPage2SVG.getElementById('dynamic-star');
                if (!star) {
                    star = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                    star.setAttribute('id', 'dynamic-star');
                    star.setAttribute('points', '75,10 80,30 100,30 85,40 90,60 75,50 60,60 65,40 50,30 70,30');
                    star.setAttribute('fill', 'yellow');
                    artPage2SVG.appendChild(star);
                }


                toggleArtBtn.textContent = "Evoke Sunflowers";
                playNoteSequence(pageMusic[1].starryNight);
            } else {
                if (backgroundRect) backgroundRect.setAttribute('fill', '#FFD700'); // Yellow
                if (centralCircle) centralCircle.setAttribute('fill', '#A0522D');
                if (textElement) {
                    textElement.textContent = 'Sunflowers';
                    textElement.setAttribute('fill', '#5C4033');
                }
                 // LLM: Remove Starry Night specific elements, restore Sunflowers
                let star = artPage2SVG.getElementById('dynamic-star');
                if (star) {
                    artPage2SVG.removeChild(star);
                }

                toggleArtBtn.textContent = "Evoke Starry Night";
                playNoteSequence(pageMusic[1].sunflowers);
            }
        });
    }

    // --- Attach Event Listeners for Navigation ---
    if (nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if (prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if (nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if (prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if (restartBtn) restartBtn.addEventListener('click', () => {
        isStarryNightStyle = false; // Reset style for page 2 if restarting
        // Reset page 2 SVG to sunflowers (assuming this is the default for page 2)
        const backgroundRect = artPage2SVG.querySelector('rect:first-of-type');
        const centralCircle = artPage2SVG.querySelector('circle');
        let textElement = artPage2SVG.querySelector('text');
        if (backgroundRect) backgroundRect.setAttribute('fill', '#FFD700');
        if (centralCircle) centralCircle.setAttribute('fill', '#A0522D');
        if (textElement) {
            textElement.textContent = 'Sunflowers';
            textElement.setAttribute('fill', '#5C4033');
        }
        let star = artPage2SVG.getElementById('dynamic-star');
        if (star) artPage2SVG.removeChild(star);
        toggleArtBtn.textContent = "Evoke Starry Night";

        showPage(0);
    });

    // --- Initial Page Load ---
    showPage(0); // Show the first page and play its music
});