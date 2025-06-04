document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-idiom'),
        document.getElementById('page2-idiom'),
        document.getElementById('page3-idiom')
    ];
    const storyTextContainers = [ // For fade-in animation
        document.getElementById('explanation-p1'),
        document.getElementById('explanation-p2'),
        document.getElementById('explanation-p3')
    ];

    const nextPage1Btn = document.getElementById('next-page1-idiom');
    const prevPage2Btn = document.getElementById('prev-page2-idiom');
    const nextPage2Btn = document.getElementById('next-page2-idiom');
    const prevPage3Btn = document.getElementById('prev-page3-idiom');
    const restartBtn = document.getElementById('restart-story-idioms');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific
    const revealBtnP1 = document.getElementById('reveal-btn-p1');
    const literalSvgP1 = document.getElementById('literal-p1');
    const figurativeSvgP1 = document.getElementById('figurative-p1');
    const explanationP1 = document.getElementById('explanation-p1');
    let p1Revealed = false;

    // Page 2 specific
    const beanCanSvg = document.getElementById('bean-can');
    const spilledContentGroup = document.getElementById('spilled-content');
    const explanationP2 = document.getElementById('explanation-p2');
    const instructionP2 = document.getElementById('instruction-p2');
    let p2Revealed = false;

    // Page 3 specific
    const revealBtnP3 = document.getElementById('reveal-btn-p3');
    const literalSvgP3 = document.getElementById('literal-p3');
    const figurativeSvgP3 = document.getElementById('figurative-p3');
    const explanationP3 = document.getElementById('explanation-p3');
    let p3Revealed = false;

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let userInteracted = false;

    function ensureAudioContextResumed() { /* ... (same as Newton script) ... */ }
    function stopAllSounds() { /* ... (same as Newton script) ... */ }
    function playNoteSequence(notesConfig) { /* ... (same as Newton script, with noise fallback) ... */ }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; 
    const soundEffectsIdioms = {
        p1Literal: { overallVolume: 0.1, notes: [{freq: 150, duration: E, type: 'sawtooth'}, {freq:100, duration:Q, delay:E*0.8, type:'noise'}]}, // Ouch/crack
        p1Figurative: { overallVolume: 0.15, notes: [{freq: 523, duration:E},{freq: 659, duration:E, delay:E},{freq: 783, duration:Q, delay:2*E}]}, // Applause/success
        spillBeans: { overallVolume: 0.1, notes: [{freq: 200, duration:H*0.5, type:'noise', volMultiplier:0.7}, {freq:400, duration:E, delay:H*0.3, type:'triangle'}]}, // Spill + whisper
        p3Literal: { overallVolume: 0.08, notes: [{freq: 100, duration:Q, type:'sawtooth', volMultiplier:1.2}]}, // Straining
        p3Figurative: { overallVolume: 0.12, notes: [{freq: 659, duration:E},{freq: 783, duration:E, delay:E*1.1},{freq:1046, duration:Q, delay:E*2.2}]} // Easy/bright
    };
    // (Copy initAudioContext, stopAllSounds, playNoteSequence, ensureAudioContextResumed, animateText from previous script)
    function initAudioContext() { if (!userInteracted) return null; if (!audioContext) { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.error("Error creating AudioContext:", e); return null; } } if (audioContext.state === 'suspended') { audioContext.resume(); } return audioContext; }
    function stopAllSounds() { currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} }); currentOscillators = []; }
    function playNoteSequence(notesConfig) { if (!initAudioContext() || !audioContext) return; stopAllSounds(); const now = audioContext.currentTime; const overallVolume = notesConfig.overallVolume || 0.08; notesConfig.notes.forEach(note => { let sn; const gn = audioContext.createGain(); gn.connect(audioContext.destination); if (note.type === 'noise') { const bs = audioContext.sampleRate * (note.duration || 0.1); const b = audioContext.createBuffer(1, bs, audioContext.sampleRate); const o = b.getChannelData(0); for (let i = 0; i < bs; i++) { o[i] = Math.random() * 2 - 1; } sn = audioContext.createBufferSource(); sn.buffer = b; sn.connect(gn); } else { sn = audioContext.createOscillator(); sn.type = note.type || 'sine'; sn.frequency.setValueAtTime(note.freq, now + (note.delay || 0)); if(note.slideTo) sn.frequency.linearRampToValueAtTime(note.slideTo, now + (note.delay || 0) + (note.duration || 0.1) * 0.8); sn.connect(gn); } gn.gain.setValueAtTime(0, now + (note.delay || 0)); gn.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02); gn.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + (note.duration || 0.1) - 0.05); gn.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + (note.duration || 0.1)); sn.start(now + (note.delay || 0)); sn.stop(now + (note.delay || 0) + (note.duration || 0.1) + 0.05); currentOscillators.push(sn); }); }
    function ensureAudioContextResumed() { if (!userInteracted) { userInteracted = true; initAudioContext(); } else if (audioContext && audioContext.state === 'suspended') { audioContext.resume(); } return audioContext && audioContext.state === 'running'; }
    function animateText(textElement) { if(textElement) { textElement.classList.remove('text-fade-in'); void textElement.offsetWidth; textElement.classList.add('text-fade-in'); } }


    function showPage(index) { 
        if (index < 0 || index >= pages.length || !pages[index]) return;
        // ensureAudioContextResumed(); // Called by interactions
        const goingForward = index > previousPageIndex;
        if (previousPageIndex !== -1 && pages[previousPageIndex]) {
            pages[previousPageIndex].classList.remove('current-page');
            pages[previousPageIndex].classList.add(goingForward ? 'slide-out-left' : 'slide-out-right');
        }
        pages[index].classList.remove('slide-out-left', 'slide-out-right');
        pages[index].classList.add('current-page');
        currentPageIndex = index;
        previousPageIndex = index;
        animateText(storyTextContainers[currentPageIndex]);
        // No default page music, sounds are tied to interactions
        stopAllSounds(); 
        // Reset states when page loads
        if (currentPageIndex === 0) resetPage1();
        if (currentPageIndex === 1) resetPage2();
        if (currentPageIndex === 2) resetPage3();
    }
    
    // --- Page 1: Break a Leg ---
    function resetPage1() {
        if (!literalSvgP1 || !figurativeSvgP1 || !explanationP1 || !revealBtnP1) return;
        literalSvgP1.style.visibility = 'visible'; literalSvgP1.style.opacity = '1';
        figurativeSvgP1.style.visibility = 'hidden'; figurativeSvgP1.style.opacity = '0';
        explanationP1.innerHTML = "What does it mean when someone tells you to \"Break a leg!\"? It sounds painful!";
        revealBtnP1.textContent = "Reveal Meaning!";
        revealBtnP1.disabled = false;
        p1Revealed = false;
    }
    if (revealBtnP1) {
        revealBtnP1.addEventListener('click', () => {
            if (!literalSvgP1 || !figurativeSvgP1 || !explanationP1) return;
            ensureAudioContextResumed();
            if (!p1Revealed) {
                literalSvgP1.style.opacity = '0';
                setTimeout(() => { literalSvgP1.style.visibility = 'hidden'; figurativeSvgP1.style.visibility = 'visible'; figurativeSvgP1.style.opacity = '1';}, 500);
                explanationP1.innerHTML = "It actually means <strong>'Good luck!'</strong>, especially said to performers before they go on stage. It's a superstitious way to wish them well without jinxing them.";
                animateText(explanationP1);
                playNoteSequence(soundEffectsIdioms.p1Figurative);
                revealBtnP1.textContent = "Show Literal";
                p1Revealed = true;
            } else {
                figurativeSvgP1.style.opacity = '0';
                setTimeout(() => { figurativeSvgP1.style.visibility = 'hidden'; literalSvgP1.style.visibility = 'visible'; literalSvgP1.style.opacity = '1';}, 500);
                explanationP1.innerHTML = "What does it mean when someone tells you to \"Break a leg!\"? It sounds painful!";
                animateText(explanationP1);
                playNoteSequence(soundEffectsIdioms.p1Literal);
                revealBtnP1.textContent = "Reveal Meaning!";
                p1Revealed = false;
            }
        });
    }

    // --- Page 2: Spill the Beans ---
    function resetPage2() {
        if (!beanCanSvg || !spilledContentGroup || !explanationP2 || !instructionP2) return;
        spilledContentGroup.innerHTML = ''; // Clear spilled items
        beanCanSvg.style.transform = 'rotate(0deg)';
        explanationP2.innerHTML = "If you \"spill the beans,\" are you making a mess with your dinner?";
        instructionP2.textContent = "Click the can to see what happens!";
        p2Revealed = false;
    }
    if (beanCanSvg) {
        beanCanSvg.addEventListener('click', () => {
            if (currentPageIndex !== 1 || p2Revealed || !spilledContentGroup || !explanationP2) return;
            ensureAudioContextResumed();
            p2Revealed = true;
            instructionP2.textContent = "Oops!";
            beanCanSvg.style.transition = 'transform 0.5s ease-in-out';
            beanCanSvg.style.transform = 'rotate(-75deg) translateX(-10px) translateY(10px)';
            playNoteSequence(soundEffectsIdioms.spillBeans);

            // Animate spilling beans and "SECRET"
            const secret = "SECRET";
            const canRect = beanCanSvg.getBoundingClientRect(); // Relative to viewport
            const svgRect = beanCanSvg.closest('svg').getBoundingClientRect(); // SVG element itself

            // Calculate origin point for spilling relative to the SVG viewBox
            // This is approximate, assuming can's center is its SVG coordinates
            const originX = parseFloat(beanCanSvg.getAttribute('cx'));
            const originY = parseFloat(beanCanSvg.getAttribute('cy')) + parseFloat(beanCanSvg.getAttribute('ry'))/2 ; // Bottom of can

            for (let i = 0; i < 10; i++) { // Spill 10 beans
                const bean = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                bean.setAttribute('rx', '3'); bean.setAttribute('ry', '5');
                bean.setAttribute('cx', originX); bean.setAttribute('cy', originY);
                bean.classList.add('spilled-bean');
                // Random translate values for scattering
                bean.style.setProperty('--tx', (Math.random() * 60 - 30) + 'px'); // Scatter X
                bean.style.setProperty('--ty', (Math.random() * 30 + 20) + 'px'); // Scatter Y
                bean.style.setProperty('--rdeg', (Math.random() * 180 - 90));
                bean.style.animationDelay = (i * 0.05) + 's';
                spilledContentGroup.appendChild(bean);
            }
            for (let i = 0; i < secret.length; i++) {
                const letter = document.createElementNS("http://www.w3.org/2000/svg", "text");
                letter.textContent = secret[i];
                letter.setAttribute('x', originX); letter.setAttribute('y', originY);
                letter.classList.add('spilled-letter');
                letter.style.setProperty('--tx', (i * 10 - (secret.length*10/2) + Math.random()*10-5) + 'px'); // Arrange letters roughly
                letter.style.setProperty('--ty', (40 + Math.random()*10) + 'px'); // Below beans
                letter.style.setProperty('--rdeg', (Math.random() * 40 - 20));
                letter.style.animationDelay = (0.3 + i * 0.1) + 's';
                spilledContentGroup.appendChild(letter);
            }
            explanationP2.innerHTML = "To \"spill the beans\" means to <strong>reveal a secret</strong> or disclose information prematurely!";
            animateText(explanationP2);
        });
    }

    // --- Page 3: Piece of Cake ---
    function resetPage3() {
        if (!literalSvgP3 || !figurativeSvgP3 || !explanationP3 || !revealBtnP3) return;
        literalSvgP3.style.visibility = 'visible'; literalSvgP3.style.opacity = '1';
        figurativeSvgP3.style.visibility = 'hidden'; figurativeSvgP3.style.opacity = '0';
        explanationP3.innerHTML = "When something is described as \"a piece of cake,\" what does that imply about the task?";
        revealBtnP3.textContent = "What does it mean?";
        revealBtnP3.disabled = false;
        p3Revealed = false;
    }
    if (revealBtnP3) {
        revealBtnP3.addEventListener('click', () => {
            if (!literalSvgP3 || !figurativeSvgP3 || !explanationP3) return;
            ensureAudioContextResumed();
            if (!p3Revealed) {
                literalSvgP3.style.opacity = '0';
                setTimeout(() => { literalSvgP3.style.visibility = 'hidden'; figurativeSvgP3.style.visibility = 'visible'; figurativeSvgP3.style.opacity = '1';}, 500);
                explanationP3.innerHTML = "It means something is <strong>very easy to do</strong>! Like eating a delicious piece of cake.";
                animateText(explanationP3);
                playNoteSequence(soundEffectsIdioms.p3Figurative);
                revealBtnP3.textContent = "Show Literal Task";
                p3Revealed = true;
            } else {
                figurativeSvgP3.style.opacity = '0';
                setTimeout(() => { figurativeSvgP3.style.visibility = 'hidden'; literalSvgP3.style.visibility = 'visible'; literalSvgP3.style.opacity = '1';}, 500);
                explanationP3.innerHTML = "When something is described as \"a piece of cake,\" what does that imply about the task?";
                animateText(explanationP3);
                playNoteSequence(soundEffectsIdioms.p3Literal);
                revealBtnP3.textContent = "What does it mean?";
                p3Revealed = false;
            }
        });
    }

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(0); });
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(2); });
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(restartBtn) restartBtn.addEventListener('click', () => {
        ensureAudioContextResumed();
        resetPage1(); resetPage2(); resetPage3(); // Call individual reset functions
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