document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-pi'),
        document.getElementById('page2-pi'),
        document.getElementById('page3-pi')
    ];
    const storyTexts = [ 
        document.getElementById('text-page1-pi'),
        document.getElementById('text-page2-pi'),
        document.getElementById('text-page3-pi')
    ];

    const nextPage1Btn = document.getElementById('next-page1-pi');
    const prevPage2Btn = document.getElementById('prev-page2-pi');
    const nextPage2Btn = document.getElementById('next-page2-pi');
    const prevPage3Btn = document.getElementById('prev-page3-pi');
    const restartBtn = document.getElementById('restart-story-pi');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific
    const radiusSlider = document.getElementById('radius-slider');
    const radiusValueEl = document.getElementById('radius-value');
    const diameterValueEl = document.getElementById('diameter-value');
    const mainCircleP1 = document.getElementById('main-circle-p1');
    const centerDotP1 = document.getElementById('center-dot-p1');
    const radiusLineP1 = document.getElementById('radius-line-p1');
    const diameterLineP1 = document.getElementById('diameter-line-p1');
    const svgP1 = document.getElementById('circle-diagram-svg');
    const svgP1ViewBox = { width: 125, height: 75 }; 

    // Page 2 specific
    const unrollBtn = document.getElementById('unroll-btn');
    const unrollSVG = document.getElementById('unroll-svg');
    const unrollCircle = document.getElementById('unroll-circle');
    const unrollLine = document.getElementById('unroll-line');
    const diameterMarkersP2 = document.getElementById('diameter-markers-p2');
    const piRevealText = document.getElementById('pi-reveal-text');
    let page1Radius = 30; 
    let unrollAnimationId;

    // Page 3 specific
    const rearrangeBtn = document.getElementById('rearrange-btn');
    const circleWedgesGroup = document.getElementById('circle-wedges');
    const rearrangedWedgesGroup = document.getElementById('rearranged-wedges');
    const areaFormulaText = document.getElementById('area-formula-text');
    const svgP3 = document.getElementById('area-svg');
    const numWedges = 16; 
    let rearrangeAnimationId;

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let userInteracted = false; // Flag for AudioContext resume

    // --- Audio Functions ---
    function initAudioContext() { 
        if (!audioContext && userInteracted) { // Create only after user interaction
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } else if (audioContext && audioContext.state === 'suspended' && userInteracted) {
            audioContext.resume();
        }
        return audioContext; 
    }

    // Call this on the first user gesture (e.g., first button click)
    function ensureAudioContextResumed() {
        if (!userInteracted) {
            userInteracted = true; // Mark that user has interacted
            if (!audioContext) { // If not yet created, try creating now
                initAudioContext();
            } else if (audioContext.state === 'suspended') { // If created but suspended, resume
                audioContext.resume().then(() => {
                    console.log("AudioContext resumed successfully after user gesture.");
                }).catch(e => console.error("Error resuming AudioContext:", e));
            }
        }
    }


    function stopAllSounds() { 
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} }); 
        currentOscillators = []; 
    }

    function playNoteSequence(notesConfig) {
        if (!initAudioContext() || !audioContext) { // Check if audioContext is available
             console.warn("AudioContext not ready or not allowed to start.");
             return; 
        }
        stopAllSounds(); 
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.08;
        notesConfig.notes.forEach(note => {
            const o = audioContext.createOscillator(); 
            const g = audioContext.createGain(); 
            o.connect(g); g.connect(audioContext.destination);
            o.type = note.type || 'sine'; 
            o.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
            g.gain.setValueAtTime(0, now + (note.delay || 0));
            g.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            g.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05);
            g.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            o.start(now + (note.delay || 0)); 
            o.stop(now + (note.delay || 0) + note.duration + 0.1); 
            currentOscillators.push(o);
        });
    }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;
    const pageMusicPi = {
        0: { overallVolume: 0.06, notes: [ { freq: 261.63, duration: W, delay: 0, type: 'sine', volMultiplier: 0.8}, { freq: 329.63, duration: H, delay: W*0.8, type: 'triangle', volMultiplier: 1}, { freq: 392.00, duration: H, delay: W*0.8+H, type: 'triangle', volMultiplier: 1} ] },
        1: { overallVolume: 0.07, notes: [ { freq: 349.23, duration: Q, delay: 0, type: 'square', volMultiplier: 1}, { freq: 440.00, duration: Q, delay: Q, type: 'square', volMultiplier: 1.1}, { freq: 523.25, duration: H, delay: 2*Q, type: 'square', volMultiplier: 1.2}, { freq: 587.33, duration: Q, delay: 2*Q+H, type: 'sine', volMultiplier: 1} ] },
        2: { overallVolume: 0.08, notes: [ { freq: 261.63, duration: H, delay: 0, type: 'sine', volMultiplier: 1}, { freq: 392.00, duration: H, delay: H*0.9, type: 'sine', volMultiplier: 1.1}, { freq: 523.25, duration: W, delay: H*1.8, type: 'sine', volMultiplier: 1.3} ] }
    };
    // Sound effects now use playNoteSequence with appropriate note configs
    const soundEffectsPi = {
        sliderChange: { overallVolume: 0.05, notes: [{freq: 440 + Math.random()*100 - 50, duration: E*0.2, type: 'triangle'}]}, // Random pitch slightly
        unroll: { overallVolume: 0.1, notes: [{freq: 300, duration: H*0.7, type: 'sawtooth', volMultiplier: 1.2}, {freq: 150, duration:H*0.3, delay: H*0.6, type:'sawtooth'}]}, // Simpler slide
        rearrange: { overallVolume: 0.1, notes: [{freq: 200, duration: Q*0.6, type: 'square'}, {freq: 400, duration: Q*0.6, delay: Q*0.5, type: 'square'}]},
        successChime: {overallVolume: 0.15, notes: [{freq: 783.99, duration: Q*0.4, type:'sine'}, {freq: 1046.50, duration: Q*0.6, delay: Q*0.4, type:'sine'}]}
    };

    function animateText(textElement) { if(textElement) { textElement.classList.remove('text-fade-in'); void textElement.offsetWidth; textElement.classList.add('text-fade-in'); } }

    function showPage(index) { 
        if (index < 0 || index >= pages.length || !pages[index]) return;
        ensureAudioContextResumed(); // Try to resume/create AudioContext on page change (triggered by button)
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
        if (pageMusicPi[currentPageIndex]) {
            playNoteSequence(pageMusicPi[currentPageIndex]);
        }
        if (currentPageIndex === 0 && radiusSlider) updateCircleDiagram(parseFloat(radiusSlider.value));
        if (currentPageIndex === 1) resetUnrollAnimation();
        if (currentPageIndex === 2) { createInitialCircleWedges(); resetRearrangeAnimation(); }
    }
    
    // --- Page 1: Dynamic Circle Diagram ---
    function updateCircleDiagram(radius) {
        if (!mainCircleP1 || !svgP1 || !centerDotP1 || !radiusLineP1 || !diameterLineP1 || !radiusValueEl || !diameterValueEl) return;
        page1Radius = parseFloat(radius); 
        const centerX = svgP1ViewBox.width / 2;
        const centerY = svgP1ViewBox.height / 2;
        mainCircleP1.setAttribute('r', page1Radius);
        mainCircleP1.setAttribute('cx', centerX);
        mainCircleP1.setAttribute('cy', centerY);
        centerDotP1.setAttribute('cx', centerX);
        centerDotP1.setAttribute('cy', centerY);
        radiusLineP1.setAttribute('x1', centerX);
        radiusLineP1.setAttribute('y1', centerY);
        radiusLineP1.setAttribute('x2', centerX + page1Radius);
        radiusLineP1.setAttribute('y2', centerY);
        const diameter = page1Radius * 2;
        diameterLineP1.setAttribute('x1', centerX - page1Radius);
        diameterLineP1.setAttribute('y1', centerY);
        diameterLineP1.setAttribute('x2', centerX + page1Radius);
        diameterLineP1.setAttribute('y2', centerY);
        diameterLineP1.style.visibility = page1Radius > 5 ? 'visible' : 'hidden';
        radiusValueEl.textContent = page1Radius.toFixed(1);
        diameterValueEl.textContent = diameter.toFixed(1);
    }
    if (radiusSlider) {
        radiusSlider.addEventListener('input', (e) => {
            ensureAudioContextResumed(); // User gesture
            updateCircleDiagram(e.target.value);
            playNoteSequence(soundEffectsPi.sliderChange); // Use playNoteSequence
        });
        // Initial call will be handled by showPage(0)
    }

    // --- Page 2: Unroll Circumference ---
    function resetUnrollAnimation() {
        if(!unrollCircle || !unrollLine || !diameterMarkersP2 || !piRevealText || !unrollBtn) return;
        cancelAnimationFrame(unrollAnimationId);
        unrollCircle.style.visibility = 'visible';
        unrollCircle.setAttribute('r', page1Radius); 
        unrollCircle.setAttribute('cx', 30); 
        unrollCircle.setAttribute('cy', 37.5);
        unrollLine.style.visibility = 'hidden';
        unrollLine.setAttribute('x1', '30'); 
        unrollLine.setAttribute('y1', '37.5');
        unrollLine.setAttribute('x2', '30'); 
        unrollLine.setAttribute('y2', '37.5');
        diameterMarkersP2.innerHTML = ''; 
        diameterMarkersP2.style.visibility = 'hidden';
        piRevealText.textContent = '';
        unrollBtn.disabled = false;
    }

    function animateUnroll() {
        if (!unrollCircle || !unrollLine || !diameterMarkersP2 || !piRevealText || !unrollBtn) return;
        ensureAudioContextResumed(); // User gesture
        unrollBtn.disabled = true;
        playNoteSequence(soundEffectsPi.unroll); // Use playNoteSequence

        const radius = page1Radius; 
        const circumference = 2 * Math.PI * radius;
        const diameter = 2 * radius;
        const startX = 10; // Give some padding from left edge
        const startY = 37.5;
        const lineEndY = startY;
        // const finalLineEndX = startX + circumference; // This might go off screen

        unrollCircle.style.visibility = 'hidden'; 
        unrollLine.style.visibility = 'visible';
        unrollLine.setAttribute('x1', startX);
        unrollLine.setAttribute('y1', lineEndY);
        unrollLine.setAttribute('x2', startX); 
        unrollLine.setAttribute('y2', lineEndY);

        let currentLength = 0;
        const animationDuration = 2000; 
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / animationDuration, 1);
            currentLength = progress * circumference;
            unrollLine.setAttribute('x2', startX + currentLength);

            if (progress < 1) {
                unrollAnimationId = requestAnimationFrame(step);
            } else {
                diameterMarkersP2.innerHTML = ''; 
                diameterMarkersP2.style.visibility = 'visible';
                const numDiametersFull = Math.floor(circumference / diameter);
                
                // Adjust starting point of markers to align with the unrolled line
                let markerStartX = startX; 
                for (let i = 0; i < numDiametersFull + 1 ; i++) { 
                    const dX = markerStartX + i * diameter;
                    if (dX <= startX + circumference + 5) { 
                        const markerLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        markerLine.setAttribute('x1', dX);
                        markerLine.setAttribute('y1', lineEndY - 5);
                        markerLine.setAttribute('x2', dX);
                        markerLine.setAttribute('y2', lineEndY + 5);
                        markerLine.setAttribute('stroke', '#004D40');
                        markerLine.setAttribute('stroke-width', '1');
                        diameterMarkersP2.appendChild(markerLine);
                        if (i < numDiametersFull) {
                             const dText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                             dText.setAttribute('x', dX + diameter/2);
                             dText.setAttribute('y', lineEndY - 8);
                             dText.setAttribute('font-size', '6');
                             dText.setAttribute('text-anchor', 'middle');
                             dText.setAttribute('fill', '#004D40');
                             dText.textContent = `d`;
                             diameterMarkersP2.appendChild(dText);
                        }
                    }
                }
                piRevealText.textContent = `C ≈ ${Math.PI.toFixed(2)} × d ≈ ${numDiametersFull} diameters + a bit!`;
            }
        }
        unrollAnimationId = requestAnimationFrame(step);
    }
    if (unrollBtn) unrollBtn.addEventListener('click', animateUnroll);

    // --- Page 3: Rearrange Wedges for Area ---
    function createWedgePath(cx, cy, r, startAngleDeg, endAngleDeg) {
        const start = polarToCartesian(cx, cy, r, endAngleDeg);
        const end = polarToCartesian(cx, cy, r, startAngleDeg);
        const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";
        return `M ${cx},${cy} L ${start.x},${start.y} A ${r},${r} 0 ${largeArcFlag} 0 ${end.x},${end.y} Z`;
    }
    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    function createInitialCircleWedges() {
        if (!circleWedgesGroup || !svgP3) return;
        circleWedgesGroup.innerHTML = ''; 
        rearrangedWedgesGroup.innerHTML = ''; 
        rearrangedWedgesGroup.style.visibility = 'hidden';
        circleWedgesGroup.style.visibility = 'visible';
        areaFormulaText.textContent = '';

        const radius = page1Radius || 30; 
        const centerX = 75; 
        const centerY = 40; // Adjusted centerY for wedges to fit better
        const angleStep = 360 / numWedges;
        const colors = ["#4DB6AC", "#80CBC4"]; 

        for (let i = 0; i < numWedges; i++) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', createWedgePath(centerX, centerY, radius, i * angleStep, (i + 1) * angleStep));
            path.setAttribute('fill', colors[i % 2]);
            path.style.transformOrigin = `${centerX}px ${centerY}px`; 
            circleWedgesGroup.appendChild(path);
        }
    }

    function resetRearrangeAnimation() {
        if(rearrangeBtn) rearrangeBtn.disabled = false;
        createInitialCircleWedges(); 
    }

    function animateRearrangeWedges() {
        if (!circleWedgesGroup || !rearrangedWedgesGroup || !areaFormulaText || !rearrangeBtn) return;
        ensureAudioContextResumed(); // User gesture
        rearrangeBtn.disabled = true;
        playNoteSequence(soundEffectsPi.rearrange); // Use playNoteSequence

        const wedges = Array.from(circleWedgesGroup.children);
        circleWedgesGroup.style.visibility = 'hidden';
        rearrangedWedgesGroup.innerHTML = ''; 
        rearrangedWedgesGroup.style.visibility = 'visible';

        const radius = page1Radius || 30;
        const approxWedgeBase = (Math.PI * radius) / (numWedges / 2) ; // Base of one wedge when laid out
        const parallelogramHeight = radius;
        const totalWidth = approxWedgeBase * (numWedges / 2);
        
        const startX = (svgP3.viewBox.baseVal.width - totalWidth) / 2; // Center the parallelogram
        const topY = 15;
        const bottomY = topY + parallelogramHeight;

        wedges.forEach((wedge, i) => {
            const newWedge = wedge.cloneNode(true);
            rearrangedWedgesGroup.appendChild(newWedge);
            
            let targetX, targetY, rotation;
            if (i < numWedges / 2) { // Top row, pointing down
                targetX = startX + i * approxWedgeBase + approxWedgeBase / 2;
                targetY = topY + parallelogramHeight / 2; // Center of wedge
                rotation = 0; // Or slight angle to fit
            } else { // Bottom row, pointing up
                targetX = startX + (i - numWedges / 2) * approxWedgeBase + approxWedgeBase / 2;
                targetY = bottomY - parallelogramHeight / 2; // Center of wedge
                rotation = 180;
            }
            
            // Original center of wedges was (75, 40)
            const originalCX = 75;
            const originalCY = 40;

            newWedge.style.transition = `transform ${0.5 + i*0.05}s ease-out`;
            // Translate to new position, then rotate around its own tip (which was originally cx,cy)
            // This requires careful calculation of translate relative to original position and new rotation point
            // Simpler: translate the group, then apply rotation around the original center for each wedge
            // For this demo, we'll simplify the transform. A true geometric rearrangement is more complex.
            newWedge.setAttribute('transform', `translate(${targetX - originalCX}, ${targetY - originalCY}) rotate(${rotation} ${originalCX} ${originalCY})`);
        });
        areaFormulaText.textContent = `Area ≈ (πr) × r = πr²`;
    }
    if (rearrangeBtn) rearrangeBtn.addEventListener('click', animateRearrangeWedges);

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(0); });
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(2); });
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(restartBtn) restartBtn.addEventListener('click', () => {
        ensureAudioContextResumed();
        if(radiusSlider) radiusSlider.value = 30;
        // updateCircleDiagram(30); // showPage(0) will call this
        resetUnrollAnimation();
        // createInitialCircleWedges(); // showPage(0) will call this via its own logic
        resetRearrangeAnimation(); // Call this to ensure button is enabled
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    // Initialize
    showPage(0); 
});