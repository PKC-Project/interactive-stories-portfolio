document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-molecules'),
        document.getElementById('page2-molecules'),
        document.getElementById('page3-molecules')
    ];
    const storyTexts = [
        document.getElementById('text-page1-molecules'),
        document.getElementById('text-page2-molecules'),
        document.getElementById('text-page3-molecules')
    ];

    const nextPage1Btn = document.getElementById('next-page1-molecules');
    const prevPage2Btn = document.getElementById('prev-page2-molecules');
    const nextPage2Btn = document.getElementById('next-page2-molecules');
    const prevPage3Btn = document.getElementById('prev-page3-molecules');
    const restartBtn = document.getElementById('restart-story-molecules');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific
    const atomsP1 = document.querySelectorAll('#atoms-svg-p1 .clickable-atom');
    const infoPopupP1 = document.getElementById('info-popup-molecules-p1');

    // Page 2 specific (Water H₂O)
    const combineWaterBtn = document.getElementById('combine-water-btn');
    const h1Water = document.getElementById('h1-water');
    const h2Water = document.getElementById('h2-water');
    const oWater = document.getElementById('o-water');
    const bond1Water = document.getElementById('bond1-water');
    const bond2Water = document.getElementById('bond2-water');
    const waterFormulaText = document.getElementById('water-formula-text');
    const initialPositionsWater = {
        h1: { x: 30, y: 30 }, h2: { x: 120, y: 30 }, o: { x: 75, y: 60 }
    };

    // Page 3 specific (Carbon Dioxide CO₂)
    const combineCO2Btn = document.getElementById('combine-co2-btn');
    const cCO2 = document.getElementById('c-co2');
    const o1CO2 = document.getElementById('o1-co2');
    const o2CO2 = document.getElementById('o2-co2');
    const bond1CO2 = document.getElementById('bond1-co2');
    const bond2CO2 = document.getElementById('bond2-co2');
    const co2FormulaText = document.getElementById('co2-formula-text');
    const initialPositionsCO2 = {
        c: { x: 75, y: 45 }, o1: { x: 30, y: 45 }, o2: { x: 120, y: 45 }
    };


    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let userInteracted = false;

    function ensureAudioContextResumed() { /* ... (same as Newton script) ... */ }
    function stopAllSounds() { /* ... (same as Newton script) ... */ }
    function playNoteSequence(notesConfig) { /* ... (same as Newton script, with noise fallback) ... */ }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;
    const pageMusicMolecules = {
        0: { overallVolume: 0.06, notes: [ { freq: 440, duration: Q, type: 'triangle' }, { freq: 554.37, duration: Q, delay: Q*1.1, type: 'triangle' }, { freq: 659.25, duration: H, delay: Q*2.2, type: 'sine' } ] }, // A4, C#5, E5 - inquisitive
        1: { overallVolume: 0.07, notes: [ { freq: 523.25, duration: E, delay: 0, type: 'square' }, { freq: 659.25, duration: E, delay: E, type: 'square' }, { freq: 783.99, duration: Q, delay: 2*E, type: 'square' } ] }, // C E G - building
        2: { overallVolume: 0.08, notes: [ { freq: 261.63, duration: H, type: 'sine' }, { freq: 392.00, duration: H, delay: H*0.8, type: 'sine' }, { freq: 523.25, duration: W, delay: H*1.6, type: 'sine' } ] } // C G C - stable
    };
    const soundEffectsMolecules = {
        atomClick: { overallVolume: 0.08, notes: [{freq: 800 + Math.random()*200, duration: E*0.3, type: 'sine'}]},
        bondForm: { overallVolume: 0.12, notes: [{freq: 600, duration: E*0.5, type: 'triangle'}, {freq: 900, duration: E*0.8, delay: E*0.4, type: 'sine'}]},
        moleculeComplete: { overallVolume: 0.15, notes: [{freq: 523.25, duration:Q},{freq:659.25,duration:Q,delay:Q},{freq:783.99,duration:H,delay:2*Q}]} // C E G - success
    };
    // (Copy initAudioContext, stopAllSounds, playNoteSequence, ensureAudioContextResumed, animateText from previous script)
    function initAudioContext() { if (!userInteracted) return null; if (!audioContext) { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.error("Error creating AudioContext:", e); return null; } } if (audioContext.state === 'suspended') { audioContext.resume(); } return audioContext; }
    function stopAllSounds() { currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} }); currentOscillators = []; }
    function playNoteSequence(notesConfig) { if (!initAudioContext() || !audioContext) return; stopAllSounds(); const now = audioContext.currentTime; const overallVolume = notesConfig.overallVolume || 0.08; notesConfig.notes.forEach(note => { let sn; const gn = audioContext.createGain(); gn.connect(audioContext.destination); if (note.type === 'noise') { const bs = audioContext.sampleRate * (note.duration || 0.1); const b = audioContext.createBuffer(1, bs, audioContext.sampleRate); const o = b.getChannelData(0); for (let i = 0; i < bs; i++) { o[i] = Math.random() * 2 - 1; } sn = audioContext.createBufferSource(); sn.buffer = b; sn.connect(gn); } else { sn = audioContext.createOscillator(); sn.type = note.type || 'sine'; sn.frequency.setValueAtTime(note.freq, now + (note.delay || 0)); if(note.slideTo) sn.frequency.linearRampToValueAtTime(note.slideTo, now + (note.delay || 0) + (note.duration || 0.1) * 0.8); sn.connect(gn); } gn.gain.setValueAtTime(0, now + (note.delay || 0)); gn.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02); gn.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + (note.duration || 0.1) - 0.05); gn.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + (note.duration || 0.1)); sn.start(now + (note.delay || 0)); sn.stop(now + (note.delay || 0) + (note.duration || 0.1) + 0.05); currentOscillators.push(sn); }); }
    function ensureAudioContextResumed() { if (!userInteracted) { userInteracted = true; initAudioContext(); } else if (audioContext && audioContext.state === 'suspended') { audioContext.resume(); } return audioContext && audioContext.state === 'running'; }
    function animateText(textElement) { if(textElement) { textElement.classList.remove('text-fade-in'); void textElement.offsetWidth; textElement.classList.add('text-fade-in'); } }


    function showPage(index) { 
        if (index < 0 || index >= pages.length || !pages[index]) return;
        // ensureAudioContextResumed(); // Called by interactions now
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
        if (pageMusicMolecules[currentPageIndex] && userInteracted) {
            playNoteSequence(pageMusicMolecules[currentPageIndex]);
        }
        if (currentPageIndex === 0 && infoPopupP1) infoPopupP1.style.opacity = '0';
        if (currentPageIndex === 1) resetWaterBuilder();
        if (currentPageIndex === 2) resetCO2Builder();
    }
    
    // --- Page 1: Atom Info Popups ---
    if (atomsP1.length && infoPopupP1) {
        atomsP1.forEach(atomEl => {
            atomEl.addEventListener('mousemove', (e) => {
                ensureAudioContextResumed();
                const info = atomEl.dataset.info;
                infoPopupP1.textContent = info;
                const containerRect = atomEl.closest('.page').getBoundingClientRect();
                infoPopupP1.style.left = (e.clientX - containerRect.left + 10) + 'px';
                infoPopupP1.style.top = (e.clientY - containerRect.top - infoPopupP1.offsetHeight - 5) + 'px';
                infoPopupP1.style.opacity = '1';
            });
            atomEl.addEventListener('mouseleave', () => {
                infoPopupP1.style.opacity = '0';
            });
            atomEl.addEventListener('click', () => {
                ensureAudioContextResumed();
                playNoteSequence(soundEffectsMolecules.atomClick);
            });
        });
    }

    // --- Page 2: Build Water ---
    function resetWaterBuilder() {
        if(!h1Water || !h2Water || !oWater || !bond1Water || !bond2Water || !waterFormulaText || !combineWaterBtn) return;
        h1Water.setAttribute('transform', `translate(${initialPositionsWater.h1.x} ${initialPositionsWater.h1.y})`);
        h2Water.setAttribute('transform', `translate(${initialPositionsWater.h2.x} ${initialPositionsWater.h2.y})`);
        oWater.setAttribute('transform', `translate(${initialPositionsWater.o.x} ${initialPositionsWater.o.y})`);
        bond1Water.style.visibility = 'hidden'; bond1Water.classList.remove('visible');
        bond2Water.style.visibility = 'hidden'; bond2Water.classList.remove('visible');
        waterFormulaText.style.visibility = 'hidden';
        combineWaterBtn.disabled = false;
    }
    if (combineWaterBtn) {
        combineWaterBtn.addEventListener('click', () => {
            if(!h1Water || !h2Water || !oWater || !bond1Water || !bond2Water || !waterFormulaText) return;
            ensureAudioContextResumed();
            combineWaterBtn.disabled = true;
            playNoteSequence(soundEffectsMolecules.bondForm);

            // Target positions for H2O (bent shape)
            const oFinalX = 75, oFinalY = 40;
            const h1FinalX = oFinalX - 15, h1FinalY = oFinalY + 15; // Angled down-left
            const h2FinalX = oFinalX + 15, h2FinalY = oFinalY + 15; // Angled down-right

            oWater.setAttribute('transform', `translate(${oFinalX} ${oFinalY})`);
            h1Water.setAttribute('transform', `translate(${h1FinalX} ${h1FinalY})`);
            h2Water.setAttribute('transform', `translate(${h2FinalX} ${h2FinalY})`);

            // Position and show bonds (after atoms move)
            setTimeout(() => {
                bond1Water.setAttribute('x1', oFinalX); bond1Water.setAttribute('y1', oFinalY);
                bond1Water.setAttribute('x2', h1FinalX); bond1Water.setAttribute('y2', h1FinalY);
                bond1Water.classList.add('visible');

                bond2Water.setAttribute('x1', oFinalX); bond2Water.setAttribute('y1', oFinalY);
                bond2Water.setAttribute('x2', h2FinalX); bond2Water.setAttribute('y2', h2FinalY);
                bond2Water.classList.add('visible');
                
                waterFormulaText.style.visibility = 'visible';
                playNoteSequence(soundEffectsMolecules.moleculeComplete);
            }, 800); // Delay for atom movement transition
        });
    }

    // --- Page 3: Build CO2 ---
    function resetCO2Builder() {
        if(!cCO2 || !o1CO2 || !o2CO2 || !bond1CO2 || !bond2CO2 || !co2FormulaText || !combineCO2Btn) return;
        cCO2.setAttribute('transform', `translate(${initialPositionsCO2.c.x} ${initialPositionsCO2.c.y})`);
        o1CO2.setAttribute('transform', `translate(${initialPositionsCO2.o1.x} ${initialPositionsCO2.o1.y})`);
        o2CO2.setAttribute('transform', `translate(${initialPositionsCO2.o2.x} ${initialPositionsCO2.o2.y})`);
        bond1CO2.style.visibility = 'hidden'; bond1CO2.classList.remove('visible');
        bond2CO2.style.visibility = 'hidden'; bond2CO2.classList.remove('visible');
        co2FormulaText.style.visibility = 'hidden';
        combineCO2Btn.disabled = false;
    }
    if (combineCO2Btn) {
        combineCO2Btn.addEventListener('click', () => {
            if(!cCO2 || !o1CO2 || !o2CO2 || !bond1CO2 || !bond2CO2 || !co2FormulaText) return;
            ensureAudioContextResumed();
            combineCO2Btn.disabled = true;
            playNoteSequence(soundEffectsMolecules.bondForm);

            // Target positions for CO2 (linear O=C=O)
            const cFinalX = 75, cFinalY = 45;
            const o1FinalX = cFinalX - 25, o1FinalY = cFinalY;
            const o2FinalX = cFinalX + 25, o2FinalY = cFinalY;

            cCO2.setAttribute('transform', `translate(${cFinalX} ${cFinalY})`);
            o1CO2.setAttribute('transform', `translate(${o1FinalX} ${o1FinalY})`);
            o2CO2.setAttribute('transform', `translate(${o2FinalX} ${o2FinalY})`);

            setTimeout(() => {
                bond1CO2.setAttribute('x1', cFinalX); bond1CO2.setAttribute('y1', cFinalY);
                bond1CO2.setAttribute('x2', o1FinalX); bond1CO2.setAttribute('y2', o1FinalY);
                bond1CO2.classList.add('visible');

                bond2CO2.setAttribute('x1', cFinalX); bond2CO2.setAttribute('y1', cFinalY);
                bond2CO2.setAttribute('x2', o2FinalX); bond2CO2.setAttribute('y2', o2FinalY);
                bond2CO2.classList.add('visible');
                
                // For double bonds, you'd add two more lines slightly offset, e.g.
                // bond3CO2.setAttribute('y1', cFinalY-2); bond3CO2.setAttribute('y2', o1FinalY-2); etc.

                co2FormulaText.style.visibility = 'visible';
                playNoteSequence(soundEffectsMolecules.moleculeComplete);
            }, 800);
        });
    }

    // Navigation
    // Add ensureAudioContextResumed() to all navigation button clicks
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(0); });
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(2); });
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(restartBtn) restartBtn.addEventListener('click', () => {
        ensureAudioContextResumed();
        resetWaterBuilder();
        resetCO2Builder();
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