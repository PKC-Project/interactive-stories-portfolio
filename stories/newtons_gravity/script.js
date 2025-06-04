document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-gravity'),
        document.getElementById('page2-gravity'),
        document.getElementById('page3-gravity')
    ];
    const storyTexts = [
        document.getElementById('text-page1-gravity'),
        document.getElementById('text-page2-gravity'),
        document.getElementById('text-page3-gravity')
    ];

    const nextPage1Btn = document.getElementById('next-page1-gravity');
    const prevPage2Btn = document.getElementById('prev-page2-gravity');
    const nextPage2Btn = document.getElementById('next-page2-gravity');
    const prevPage3Btn = document.getElementById('prev-page3-gravity');
    const restartBtn = document.getElementById('restart-story-gravity');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1: Apple Fall
    const releaseAppleBtn = document.getElementById('release-apple-btn');
    const fallingApple = document.getElementById('falling-apple');
    const gravityArrowP1 = document.getElementById('gravity-arrow-p1');
    const initialAppleCY = 35;

    // Page 2: Gravity Adjuster
    const mass1ValEl = document.getElementById('m1-value');
    const mass2ValEl = document.getElementById('m2-value');
    const distValEl = document.getElementById('dist-value');
    const forceValEl = document.getElementById('force-value');
    const mass1SVG = document.getElementById('mass1-p2');
    const mass2SVG = document.getElementById('mass2-p2');
    const gravityArrowP2 = document.getElementById('gravity-arrow-p2');
    let mass1 = 15, mass2 = 10, distance = 70;

    // Page 3: Cannonball Orbit
    const powerSlider = document.getElementById('power-slider');
    const launchCannonBtn = document.getElementById('launch-cannon-btn');
    const cannonballPath = document.getElementById('cannonball-path');
    const cannonball = document.getElementById('cannonball');
    const launchStatusEl = document.getElementById('launch-status');
    const earthP3 = document.getElementById('earth-p3');

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let userInteracted = false; // Flag for AudioContext resume

    // --- Audio Functions ---
    function ensureAudioContextResumed() {
        if (!userInteracted) {
            userInteracted = true;
            if (!audioContext) {
                try {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log("AudioContext created after user gesture.");
                } catch (e) {
                    console.error("Error creating AudioContext:", e);
                    return false; // Indicate failure
                }
            }
            // If context exists but is suspended, resume it.
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log("AudioContext resumed successfully.");
                }).catch(e => console.error("Error resuming AudioContext:", e));
            }
        }
        return audioContext && audioContext.state === 'running'; // Return true if ready
    }

    function stopAllSounds() {
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
        currentOscillators = [];
    }

    function playNoteSequence(notesConfig) {
        if (!ensureAudioContextResumed() || !audioContext) { // Ensure context is active
             console.warn("AudioContext not ready or not allowed to start for playNoteSequence.");
             return; 
        }
        stopAllSounds();
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.08;
        notesConfig.notes.forEach(note => {
            let sourceNode; const gainNode = audioContext.createGain(); gainNode.connect(audioContext.destination);
            if (note.type === 'noise') {
                const bufferSize = audioContext.sampleRate * (note.duration || 0.1); 
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const output = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
                sourceNode = audioContext.createBufferSource(); sourceNode.buffer = buffer; sourceNode.connect(gainNode);
            } else {
                sourceNode = audioContext.createOscillator(); sourceNode.type = note.type || 'sine';
                sourceNode.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
                if(note.slideTo) sourceNode.frequency.linearRampToValueAtTime(note.slideTo, now + (note.delay || 0) + (note.duration || 0.1) * 0.8);
                sourceNode.connect(gainNode);
            }
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + (note.duration || 0.1) - 0.05);
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + (note.duration || 0.1));
            sourceNode.start(now + (note.delay || 0)); 
            sourceNode.stop(now + (note.delay || 0) + (note.duration || 0.1) + 0.05); // Allow for release
            currentOscillators.push(sourceNode);
        });
    }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;
    const pageMusicGravity = {
        0: { overallVolume: 0.07, notes: [ { freq: 196.00, duration: W, delay: 0, type: 'sine'}, { freq: 246.94, duration: H, delay: W*0.7, type: 'triangle'}, { freq: 261.63, duration: H, delay: W*0.7+H*0.9, type: 'triangle'} ] },
        1: { overallVolume: 0.08, notes: [ { freq: 220.00, duration: Q, delay: 0, type: 'square'}, { freq: 277.18, duration: Q, delay: Q, type: 'square'}, { freq: 329.63, duration: H, delay: 2*Q, type: 'square'} ] },
        2: { overallVolume: 0.09, notes: [ { freq: 130.81, duration: H, delay: 0, type: 'sawtooth'}, { freq: 196.00, duration: H, delay: H, type: 'sawtooth'}, { freq: 261.63, duration: W, delay: 2*H, type: 'sine'} ] }
    };
    const soundEffectsGravity = {
        appleThud: { overallVolume: 0.15, notes: [{freq: 80, duration: Q*0.8, type: 'sawtooth', volMultiplier: 1.5}, {freq: 60, duration:Q*0.5, delay: Q*0.5, type:'noise'}]},
        forceChange: { overallVolume: 0.05, notes: [{freq: 300 + Math.random()*100, duration: E*0.5, type: 'triangle'}]},
        cannonLaunch: { overallVolume: 0.2, notes: [{freq: 150, duration: Q, type: 'noise', volMultiplier:1.8, slideTo: 50}]}, // slideTo for noise is conceptual, won't work with buffer
        orbitAchieved: { overallVolume: 0.1, notes: [{freq: 523.25, duration: W, type: 'sine'}, {freq: 783.99, duration: W, delay: W*0.5, type: 'sine'}]}
    };
    // For noise with slideTo, it's better to use a pitch-shifted noise or a series of noise bursts.
    // For simplicity, the 'noise' type in playNoteSequence is now a basic white noise buffer.

    function animateText(textElement) { if(textElement) { textElement.classList.remove('text-fade-in'); void textElement.offsetWidth; textElement.classList.add('text-fade-in'); } }

    function showPage(index) { 
        if (index < 0 || index >= pages.length || !pages[index]) return;
        // ensureAudioContextResumed(); // Call this on user interaction, not just page load
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
        if (pageMusicGravity[currentPageIndex] && userInteracted) { // Only play music if user has interacted
            playNoteSequence(pageMusicGravity[currentPageIndex]);
        }
        if (currentPageIndex === 0) resetAppleFall();
        if (currentPageIndex === 1) updateGravityVisuals();
        if (currentPageIndex === 2) resetCannonLaunch();
    }
    
    // --- Page 1: Apple Fall ---
    function resetAppleFall() {
        if (!fallingApple || !gravityArrowP1 || !releaseAppleBtn) return;
        fallingApple.classList.remove('fall'); // If using CSS animation
        // fallingApple.style.transform = `translateY(0px)`; // If using JS transform
        fallingApple.setAttribute('cy', String(initialAppleCY)); // Reset SVG attribute
        gravityArrowP1.style.visibility = 'hidden';
        releaseAppleBtn.disabled = false;
    }
    function animateAppleFall() {
        if (!fallingApple || !gravityArrowP1 || !releaseAppleBtn) return;
        if (!ensureAudioContextResumed()) return; // Check and resume audio context
        
        releaseAppleBtn.disabled = true;
        gravityArrowP1.style.visibility = 'visible';
        
        let currentY = initialAppleCY;
        const groundY = initialAppleCY + 45; 
        const duration = 1000; 
        let startTime = null;

        function fallStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const newY = initialAppleCY + (groundY - initialAppleCY) * (progress * progress);
            fallingApple.setAttribute('cy', newY.toFixed(2));

            if (progress < 1) {
                requestAnimationFrame(fallStep);
            } else {
                playNoteSequence(soundEffectsGravity.appleThud);
            }
        }
        requestAnimationFrame(fallStep);
    }
    if (releaseAppleBtn) releaseAppleBtn.addEventListener('click', animateAppleFall);
    if (fallingApple) fallingApple.addEventListener('click', animateAppleFall);

    // --- Page 2: Gravity Adjuster ---
    function updateGravityVisuals() {
        // ... (keep this function as is from previous correct version) ...
        if (!mass1SVG || !mass2SVG || !gravityArrowP2 || !mass1ValEl || !mass2ValEl || !distValEl || !forceValEl) return;
        mass1SVG.setAttribute('r', String(mass1));
        mass2SVG.setAttribute('r', String(mass2));
        mass1ValEl.textContent = mass1;
        mass2ValEl.textContent = mass2;
        const baseDist = 70; 
        const mass1CX = 40;
        const newMass2CX = mass1CX + distance;
        mass2SVG.setAttribute('cx', String(newMass2CX));
        distValEl.textContent = distance;
        gravityArrowP2.setAttribute('x1', String(mass1CX + mass1)); 
        gravityArrowP2.setAttribute('x2', String(newMass2CX - mass2)); 
        const arrowHead1 = gravityArrowP2.nextElementSibling; 
        const arrowHead2 = arrowHead1 ? arrowHead1.nextElementSibling : null;
        if(arrowHead1) {
            arrowHead1.setAttribute('d', `M${mass1CX + mass1 + 5} ${45-3} L${mass1CX + mass1} 45 L${mass1CX + mass1 + 5} ${45+3}`);
        }
        if(arrowHead2) {
            arrowHead2.setAttribute('d', `M${newMass2CX - mass2 - 5} ${45-3} L${newMass2CX - mass2} 45 L${newMass2CX - mass2 - 5} ${45+3}`);
        }
        const force = (mass1 * mass2) / (distance * distance) * 100; 
        let forceStrength = "Medium";
        let arrowThickness = 2;
        if (force > 15) { forceStrength = "Strong!"; arrowThickness = 4; }
        else if (force < 5) { forceStrength = "Weak"; arrowThickness = 1; }
        forceValEl.textContent = forceStrength;
        gravityArrowP2.setAttribute('stroke-width', String(arrowThickness));
    }

    document.getElementById('m1-increase')?.addEventListener('click', () => { if(!ensureAudioContextResumed()) return; mass1 = Math.min(30, mass1 + 2); updateGravityVisuals(); playNoteSequence(soundEffectsGravity.forceChange); });
    document.getElementById('m1-decrease')?.addEventListener('click', () => { if(!ensureAudioContextResumed()) return; mass1 = Math.max(5, mass1 - 2); updateGravityVisuals(); playNoteSequence(soundEffectsGravity.forceChange); });
    document.getElementById('m2-increase')?.addEventListener('click', () => { if(!ensureAudioContextResumed()) return; mass2 = Math.min(25, mass2 + 2); updateGravityVisuals(); playNoteSequence(soundEffectsGravity.forceChange); });
    document.getElementById('m2-decrease')?.addEventListener('click', () => { if(!ensureAudioContextResumed()) return; mass2 = Math.max(5, mass2 - 2); updateGravityVisuals(); playNoteSequence(soundEffectsGravity.forceChange); });
    document.getElementById('dist-increase')?.addEventListener('click', () => { if(!ensureAudioContextResumed()) return; distance = Math.min(100, distance + 10); updateGravityVisuals(); playNoteSequence(soundEffectsGravity.forceChange); });
    document.getElementById('dist-decrease')?.addEventListener('click', () => { if(!ensureAudioContextResumed()) return; distance = Math.max(30, distance - 10); updateGravityVisuals(); playNoteSequence(soundEffectsGravity.forceChange); });


    // --- Page 3: Cannonball Orbit ---
    function resetCannonLaunch() { /* ... (keep as is) ... */ 
        if (!cannonballPath || !cannonball || !launchStatusEl || !powerSlider || !launchCannonBtn) return;
        cannonballPath.setAttribute('d', '');
        cannonballPath.classList.remove('fire');
        cannonball.style.visibility = 'hidden';
        launchStatusEl.textContent = "Ready";
        powerSlider.value = "1"; // Ensure it's a string for input value
        launchCannonBtn.disabled = false;
    }

    function animateCannonLaunch() { /* ... (keep as is, but ensure ensureAudioContextResumed is called) ... */
        if (!cannonballPath || !cannonball || !launchStatusEl || !powerSlider || !earthP3 || !launchCannonBtn) return;
        if (!ensureAudioContextResumed()) return;
        launchCannonBtn.disabled = true;
        playNoteSequence(soundEffectsGravity.cannonLaunch);
        const power = parseInt(powerSlider.value); 
        const earthCX = parseFloat(earthP3.getAttribute('cx'));
        const earthCY = parseFloat(earthP3.getAttribute('cy'));
        const earthR = parseFloat(earthP3.getAttribute('r'));
        const launchX = 75, launchY = 10; 
        cannonball.setAttribute('cx', String(launchX));
        cannonball.setAttribute('cy', String(launchY));
        cannonball.style.visibility = 'visible';
        cannonballPath.setAttribute('d', `M${launchX},${launchY}`);
        cannonballPath.classList.remove('fire'); 
        void cannonballPath.offsetWidth; 
        let pathData = `M${launchX},${launchY} `;
        let currentX = launchX; let currentY = launchY;
        let velocityX = power * 5; let velocityY = 0;
        const gravity = 0.1 * (power < 4 ? 1 : 0.3 / power); 
        let steps = 0; const maxSteps = 200; let hasHitGround = false;
        function launchStep() {
            if (steps >= maxSteps || hasHitGround) {
                launchCannonBtn.disabled = false;
                if (!hasHitGround && power === 4) { 
                    launchStatusEl.textContent = "Orbit Achieved (Conceptual)!";
                    cannonballPath.setAttribute('d', `M${launchX},${launchY} A${earthR + launchY + 5},${earthR + launchY + 5} 0 1 0 ${launchX-0.1},${launchY}`); 
                    cannonball.style.visibility = 'hidden'; 
                    playNoteSequence(soundEffectsGravity.orbitAchieved);
                } else if (hasHitGround) {
                    launchStatusEl.textContent = "Impact!";
                } else {
                    launchStatusEl.textContent = "Lost in space!";
                }
                cannonballPath.classList.add('fire'); 
                return;
            }
            const dxToEarth = earthCX - currentX; const dyToEarth = earthCY - currentY;
            const distToEarthSq = dxToEarth * dxToEarth + dyToEarth * dyToEarth;
            const distToEarth = Math.sqrt(distToEarthSq);
            if (distToEarth < earthR) { 
                hasHitGround = true;
                currentX = earthCX - (dxToEarth / distToEarth) * earthR;
                currentY = earthCY - (dyToEarth / distToEarth) * earthR;
                pathData += `L${currentX.toFixed(1)},${currentY.toFixed(1)}`;
                cannonball.setAttribute('cx', String(currentX));
                cannonball.setAttribute('cy', String(currentY));
                cannonballPath.setAttribute('d', pathData);
                playNoteSequence(soundEffectsGravity.appleThud); 
                requestAnimationFrame(launchStep); 
                return;
            }
            if (power < 4 || distToEarthSq > 0.01) { 
                 const forceX = (gravity * dxToEarth) / distToEarth; 
                 const forceY = (gravity * dyToEarth) / distToEarth;
                 velocityX += forceX * 0.1; 
                 velocityY += forceY * 0.1;
            }
            currentX += velocityX * 0.2; 
            currentY += velocityY * 0.2;
            pathData += `L${currentX.toFixed(1)},${currentY.toFixed(1)} `;
            cannonball.setAttribute('cx', String(currentX));
            cannonball.setAttribute('cy', String(currentY));
            cannonballPath.setAttribute('d', pathData); 
            steps++;
            requestAnimationFrame(launchStep);
        }
        requestAnimationFrame(launchStep);
    }
    if (launchCannonBtn) launchCannonBtn.addEventListener('click', animateCannonLaunch);

    // Navigation
    // Add ensureAudioContextResumed() to all navigation button clicks
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(0); });
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(2); });
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(restartBtn) restartBtn.addEventListener('click', () => {
        ensureAudioContextResumed();
        resetAppleFall();
        mass1 = 15; mass2 = 10; distance = 70; 
        updateGravityVisuals();
        resetCannonLaunch();
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            // No audio context needed for simple navigation
            window.location.href = '../../index.html';
        });
    });

    // Initialize
    showPage(0); 
});