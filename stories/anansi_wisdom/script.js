document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-anansi'),
        document.getElementById('page2-anansi'),
        document.getElementById('page3-anansi')
    ];
    const storyTexts = [
        document.getElementById('text-page1-anansi'),
        document.getElementById('text-page2-anansi'),
        document.getElementById('text-page3-anansi')
    ];

    const nextPage1Btn = document.getElementById('next-page1-anansi');
    const prevPage2Btn = document.getElementById('prev-page2-anansi');
    const nextPage2Btn = document.getElementById('next-page2-anansi');
    const prevPage3Btn = document.getElementById('prev-page3-anansi');
    const restartBtn = document.getElementById('restart-story-anansi');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific
    const anansiBodyP1 = document.getElementById('anansi-body-p1');
    const anansiThoughtBubble = document.getElementById('anansi-thought');

    // Page 2 specific
    const tryNtikumaIdeaBtn = document.getElementById('try-ntikuma-idea');
    const anansiClimbingFront = document.getElementById('anansi-climbing-front');
    const anansiClimbingBack = document.getElementById('anansi-climbing-back');

    // Page 3 specific
    const wisdomSparksContainer = document.getElementById('wisdom-sparks-container'); // In SVG
    const svgPage3Art = document.getElementById('svg-page3-anansi-art');


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
    function playNoteSequence(notesConfig) { /* ... (same) ... */
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

    const pageMusicAnansi = {
        0: { // Page 1: Playful, mischievous, rhythmic
            overallVolume: 0.07,
            notes: [
                { freq: 392.00, duration: E, delay: 0*E, type: 'square', volMultiplier: 1.1}, // G4
                { freq: 440.00, duration: E, delay: 1*E, type: 'square', volMultiplier: 1.1}, // A4
                { freq: 392.00, duration: E, delay: 2*E, type: 'square', volMultiplier: 1.1}, // G4
                { freq: 349.23, duration: Q, delay: 3*E, type: 'sawtooth', volMultiplier: 0.9}, // F4
                { freq: 293.66, duration: E, delay: 3*E+Q, type: 'square', volMultiplier: 1.0}  // D4
            ]
        },
        1: { // Page 2: Struggle, then a clear idea
            overallVolume: 0.06,
            notes: [ // Initial struggle
                { freq: 196.00, duration: Q*0.7, delay: 0, type: 'sawtooth', volMultiplier: 1}, { freq: 185.00, duration: Q*0.7, delay: Q*0.7, type: 'sawtooth', volMultiplier: 1},
                // Ntikuma's idea - clearer, simpler
                { freq: 523.25, duration: Q, delay: Q*1.8, type: 'triangle', volMultiplier: 1.3},
                { freq: 587.33, duration: H, delay: Q*2.8, type: 'triangle', volMultiplier: 1.3}
            ]
        },
        2: { // Page 3: Pot breaking, wisdom scattering - joyful, widespread
            overallVolume: 0.09,
            notes: [
                // Pot break sound (LLM: simple percussive noise)
                { freq: 100, duration: E*0.5, delay: 0, type: 'noise', volMultiplier: 1.5}, // (Noise type needs Web Audio API setup not included here for simplicity, use sawtooth)
                { freq: 100, duration: E*0.5, delay: 0, type: 'sawtooth', volMultiplier: 1.5},
                // Scattering wisdom - ascending, bright
                { freq: 523.25, duration: E, delay: Q*0.5, type: 'sine', volMultiplier: 1}, { freq: 659.25, duration: E, delay: Q*0.5+E, type: 'sine', volMultiplier: 1.1},
                { freq: 783.99, duration: E, delay: Q*0.5+2*E, type: 'sine', volMultiplier: 1.2}, { freq: 880.00, duration: Q, delay: Q*0.5+3*E, type: 'sine', volMultiplier: 1.3},
                { freq: 1046.50, duration: H, delay: Q*0.5+3*E+Q, type: 'sine', volMultiplier: 1.4}
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

    function showPage(index) { /* ... (same, using pageMusicAnansi) ... */ 
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
        if (pageMusicAnansi[currentPageIndex]) {
            playNoteSequence(pageMusicAnansi[currentPageIndex]);
        }
        if (currentPageIndex === 2) { // Page 3 - Wisdom Scattering
            scatterWisdomSparks();
        } else {
            if(wisdomSparksContainer) wisdomSparksContainer.innerHTML = ''; // Clear sparks if not on page 3
        }
        // Reset page 2 SVG if navigating away or restarting
        if (currentPageIndex !== 1 && anansiClimbingFront && anansiClimbingBack) {
            anansiClimbingFront.style.visibility = 'visible';
            anansiClimbingBack.style.visibility = 'hidden';
            if(tryNtikumaIdeaBtn) tryNtikumaIdeaBtn.disabled = false;
        }
    }
    
    // --- Page 1: Anansi Thought Bubble ---
    if (anansiBodyP1 && anansiThoughtBubble) {
        anansiBodyP1.addEventListener('click', () => {
            if (currentPageIndex === 0) {
                anansiThoughtBubble.style.visibility = 'visible';
                anansiThoughtBubble.style.opacity = '1'; // Assuming CSS handles transition
                playNoteSequence({overallVolume: 0.05, notes: [{freq: 600, duration:E*0.8, type:'square'}]});
                setTimeout(() => {
                    anansiThoughtBubble.style.visibility = 'hidden';
                    anansiThoughtBubble.style.opacity = '0';
                }, 2000);
            }
        });
    }

    // --- Page 2: Try Ntikuma's Idea ---
    if (tryNtikumaIdeaBtn && anansiClimbingFront && anansiClimbingBack) {
        tryNtikumaIdeaBtn.addEventListener('click', () => {
            if (currentPageIndex === 1) {
                anansiClimbingFront.style.visibility = 'hidden';
                anansiClimbingBack.style.visibility = 'visible';
                tryNtikumaIdeaBtn.disabled = true; // Prevent multiple clicks
                playNoteSequence({overallVolume: 0.1, notes: [{freq: 523.25, duration: Q},{freq: 659.25, duration: Q, delay:Q},{freq:783.99, duration:H, delay:2*Q}]}); // Success sound
            }
        });
    }

    // --- Page 3: Scatter Wisdom Sparks ---
    function scatterWisdomSparks() {
        if (!wisdomSparksContainer || !svgPage3Art) return;
        wisdomSparksContainer.innerHTML = ''; // Clear previous sparks
        const numSparks = 30;
        const colors = ['#FFD700', '#FFA500', '#FF4500', '#FFFFE0', '#FF6347'];
        const svgRect = svgPage3Art.getBoundingClientRect(); // Get SVG position for relative positioning

        for (let i = 0; i < numSparks; i++) {
            const spark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const startX = 75; // Center of broken pot (approx)
            const startY = 80; // Bottom of broken pot (approx)

            spark.setAttribute('cx', startX);
            spark.setAttribute('cy', startY);
            spark.setAttribute('r', Math.random() * 3 + 1); // Radius 1 to 4
            spark.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)]);
            spark.style.opacity = '1';
            
            wisdomSparksContainer.appendChild(spark);

            // Animate scattering
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 60 + 20; // Scatter 20 to 80 units away
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance - (Math.random() * 30); // Tend to float up a bit
            const duration = Math.random() * 1500 + 1000; // 1s to 2.5s

            let startTime = null;
            function animateSpark(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);

                const currentX = startX + (endX - startX) * progress;
                const currentY = startY + (endY - startY) * progress;
                spark.setAttribute('cx', currentX);
                spark.setAttribute('cy', currentY);
                spark.style.opacity = 1 - progress;

                if (progress < 1) {
                    requestAnimationFrame(animateSpark);
                } else {
                    if (spark.parentNode) spark.parentNode.removeChild(spark); // Clean up
                }
            }
            requestAnimationFrame(animateSpark);
        }
    }


    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        // Reset specific states for Anansi story
        if (anansiClimbingFront && anansiClimbingBack) {
            anansiClimbingFront.style.visibility = 'visible';
            anansiClimbingBack.style.visibility = 'hidden';
        }
        if(tryNtikumaIdeaBtn) tryNtikumaIdeaBtn.disabled = false;
        if(wisdomSparksContainer) wisdomSparksContainer.innerHTML = '';

        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    showPage(0); // Initialize
});