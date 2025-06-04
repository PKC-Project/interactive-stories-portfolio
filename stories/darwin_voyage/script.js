document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-darwin'),
        document.getElementById('page2-darwin'),
        document.getElementById('page3-darwin')
    ];
    const storyTexts = [
        document.getElementById('text-page1-darwin'),
        document.getElementById('text-page2-darwin'),
        document.getElementById('text-page3-darwin')
    ];

    const nextPage1Btn = document.getElementById('next-page1-darwin');
    const prevPage2Btn = document.getElementById('prev-page2-darwin');
    const nextPage2Btn = document.getElementById('next-page2-darwin');
    const prevPage3Btn = document.getElementById('prev-page3-darwin');
    const restartBtn = document.getElementById('restart-story-darwin');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific
    const infoPopupP1 = document.getElementById('info-popup-darwin-p1');
    const svgPage1Art = document.getElementById('svg-page1-darwin-art');

    // Page 2 specific
    const finchBeaks = document.querySelectorAll('.finch-beak');
    const foodTypes = document.querySelectorAll('.food-type');
    const matchFeedbackEl = document.getElementById('match-feedback');
    let selectedBeakType = null;
    let correctMatches = 0;
    const totalMatchesNeeded = 3;

    // Page 3 specific
    const evolveBtn = document.getElementById('evolve-btn');
    const branchesContainer = document.getElementById('branches-container');
    const trunkLine = document.getElementById('trunk');
    let evolutionStep = 0;

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
        const overallVolume = notesConfig.overallVolume || 0.07;
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

    const pageMusicDarwin = {
        0: { // Page 1: Voyage, sea shanty hint, wonder
            overallVolume: 0.06,
            notes: [
                { freq: 293.66, duration: H, delay: 0, type: 'triangle'}, // D4
                { freq: 329.63, duration: Q, delay: H*0.8, type: 'triangle'}, // E4
                { freq: 349.23, duration: Q, delay: H*0.8+Q, type: 'triangle'}, // F4
                { freq: 392.00, duration: H, delay: H*0.8+2*Q, type: 'sine'},   // G4
            ]
        },
        1: { // Page 2: Nature, observation, birdsong hint
            overallVolume: 0.05,
            notes: [
                { freq: 659.25, duration: E, delay: 0, type: 'sine', volMultiplier: 1.2}, // E5
                { freq: 783.99, duration: E, delay: E*1.5, type: 'sine', volMultiplier: 1.2}, // G5
                { freq: 698.46, duration: Q, delay: E*3, type: 'sine', volMultiplier: 1},   // F5
                { freq: 587.33, duration: E, delay: E*3+Q, type: 'triangle', volMultiplier: 0.8}, // D5
            ]
        },
        2: { // Page 3: Thoughtful, gradual unfolding, sense of scale
            overallVolume: 0.07,
            notes: [
                { freq: 130.81, duration: W, delay: 0, type: 'sawtooth', volMultiplier: 0.7}, // C3
                { freq: 164.81, duration: H, delay: W*0.8, type: 'sine', volMultiplier: 1},   // E3
                { freq: 196.00, duration: H, delay: W*0.8+H*0.9, type: 'sine', volMultiplier: 1.2}, // G3
                { freq: 261.63, duration: W*1.5, delay: W*0.8+H*1.8, type: 'sine', volMultiplier: 1.4}, // C4
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
    function showPage(index) { /* ... (same, using pageMusicDarwin) ... */ 
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
        if (pageMusicDarwin[currentPageIndex]) {
            playNoteSequence(pageMusicDarwin[currentPageIndex]);
        }
        if(infoPopupP1) infoPopupP1.style.opacity = '0';
        if(currentPageIndex === 2) resetTreeAnimation(); // Reset tree when going to page 3
    }
    
    // --- Page 1: Map Point Interactions ---
    if (svgPage1Art) {
        const mapPoints = svgPage1Art.querySelectorAll('.map-point');
        mapPoints.forEach(point => {
            point.addEventListener('mousemove', (e) => {
                const info = point.dataset.info;
                if (info && infoPopupP1) {
                    infoPopupP1.textContent = info;
                    const svgRect = svgPage1Art.getBoundingClientRect();
                    infoPopupP1.style.left = (e.clientX - svgRect.left + 10) + 'px';
                    infoPopupP1.style.top = (e.clientY - svgRect.top - infoPopupP1.offsetHeight - 5) + 'px';
                    infoPopupP1.style.opacity = '1';
                }
            });
            point.addEventListener('mouseleave', () => {
                if (infoPopupP1) infoPopupP1.style.opacity = '0';
            });
            point.addEventListener('click', () => { // Simple sound on click
                 playNoteSequence({overallVolume: 0.1, notes: [{freq: 600 + Math.random()*200, duration: E*0.5, type:'triangle'}]});
            });
        });
    }

    // --- Page 2: Finch Beak Matching Game ---
    finchBeaks.forEach(beak => {
        beak.addEventListener('click', () => {
            if (beak.classList.contains('matched')) return; // Already matched
            finchBeaks.forEach(b => b.classList.remove('selected'));
            beak.classList.add('selected');
            selectedBeakType = beak.dataset.beaktype;
            matchFeedbackEl.textContent = `Selected: ${selectedBeakType.replace('-',' ')}. Now click a food type.`;
            matchFeedbackEl.className = '';
        });
    });

    foodTypes.forEach(food => {
        food.addEventListener('click', () => {
            if (!selectedBeakType || food.classList.contains('matched')) return;
            const foodType = food.dataset.foodtype;
            if (selectedBeakType === foodType) {
                matchFeedbackEl.textContent = `Correct! ${selectedBeakType.replace('-',' ')} is good for ${foodType.replace('-',' ')}.`;
                matchFeedbackEl.className = 'correct';
                const selectedBeakEl = document.querySelector(`.finch-beak[data-beaktype="${selectedBeakType}"]`);
                if(selectedBeakEl) selectedBeakEl.classList.add('matched');
                food.classList.add('matched'); // Visually mark as matched
                selectedBeakEl.style.opacity = 0.3; // Dim matched items
                food.style.opacity = 0.3;
                selectedBeakType = null; // Reset selection
                correctMatches++;
                 playNoteSequence({overallVolume: 0.15, notes: [{freq: 783.99, duration: Q*0.5, type:'sine'}]}); // Success chime
                if (correctMatches === totalMatchesNeeded) {
                    matchFeedbackEl.textContent = "All matched! Darwin noted such adaptations.";
                }
            } else {
                matchFeedbackEl.textContent = `Not quite. Try matching the ${selectedBeakType.replace('-',' ')} again.`;
                matchFeedbackEl.className = 'incorrect';
                 playNoteSequence({overallVolume: 0.1, notes: [{freq: 100, duration: Q, type:'sawtooth'}]}); // Incorrect sound
            }
        });
    });

    // --- Page 3: Tree of Life Animation ---
    const branchData = [ // x1, y1, x2, y2, delay (ms), duration (ms)
        { x1: 75, y1: 80, x2: 55, y2: 50, delay: 100, duration: 1000 },
        { x1: 75, y1: 80, x2: 95, y2: 50, delay: 300, duration: 1000 },
        { x1: 55, y1: 50, x2: 40, y2: 20, delay: 600, duration: 800 },
        { x1: 55, y1: 50, x2: 70, y2: 25, delay: 800, duration: 800 },
        { x1: 95, y1: 50, x2: 80, y2: 20, delay: 700, duration: 800 },
        { x1: 95, y1: 50, x2: 110, y2: 30, delay: 900, duration: 800 }
    ];

    function drawBranch(data) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', data.x1);
        line.setAttribute('y1', data.y1);
        line.setAttribute('x2', data.x1); // Start with x2,y2 same as x1,y1 for drawing effect
        line.setAttribute('y2', data.y1);
        branchesContainer.appendChild(line);

        // Animate drawing using stroke-dasharray and stroke-dashoffset (more complex)
        // Or simpler: animate x2, y2 attributes with JS (less smooth)
        // For this example, let's use a simpler JS animation of x2, y2
        let progress = 0;
        const steps = data.duration / 20; // 20ms per step
        const dx = (data.x2 - data.x1) / steps;
        const dy = (data.y2 - data.y1) / steps;
        
        setTimeout(() => {
            function animate() {
                if (progress < steps) {
                    line.setAttribute('x2', data.x1 + dx * progress);
                    line.setAttribute('y2', data.y1 + dy * progress);
                    progress++;
                    requestAnimationFrame(animate);
                } else {
                    line.setAttribute('x2', data.x2);
                    line.setAttribute('y2', data.y2);
                }
            }
            animate();
        }, data.delay);
    }
    
    function resetTreeAnimation(){
        if(branchesContainer) branchesContainer.innerHTML = ''; // Clear old branches
        evolutionStep = 0;
        if(evolveBtn) evolveBtn.disabled = false;
    }

    if (evolveBtn) {
        evolveBtn.addEventListener('click', () => {
            if (evolutionStep < branchData.length) {
                drawBranch(branchData[evolutionStep]);
                evolutionStep++;
                if (evolutionStep === branchData.length) {
                    evolveBtn.disabled = true; // All branches drawn
                    playNoteSequence({overallVolume: 0.1, notes: [{freq: 261.63, duration: Q},{freq: 329.63, duration: Q, delay:Q},{freq:392.00, duration:H, delay:2*Q}]});
                }
            }
        });
    }

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        // Reset game states
        selectedBeakType = null; correctMatches = 0;
        finchBeaks.forEach(b => {b.classList.remove('selected', 'matched'); b.style.opacity=1;});
        foodTypes.forEach(f => {f.classList.remove('matched'); f.style.opacity=1;});
        if(matchFeedbackEl) matchFeedbackEl.textContent = '';
        resetTreeAnimation();
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    showPage(0); // Initialize
});