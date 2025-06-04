document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-galileo'),
        document.getElementById('page2-galileo'),
        document.getElementById('page3-galileo')
    ];
    const storyTexts = [
        document.getElementById('text-page1-galileo'),
        document.getElementById('text-page2-galileo'),
        document.getElementById('text-page3-galileo')
    ];

    const nextPage1Btn = document.getElementById('next-page1-galileo');
    const prevPage2Btn = document.getElementById('prev-page2-galileo');
    const nextPage2Btn = document.getElementById('next-page2-galileo');
    const prevPage3Btn = document.getElementById('prev-page3-galileo');
    const restartBtn = document.getElementById('restart-story-galileo');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific - Focus Game
    const focusInBtn = document.getElementById('focus-in-btn');
    const focusOutBtn = document.getElementById('focus-out-btn');
    const celestialViewObjects = document.querySelectorAll('#celestial-view > circle'); 
    const focusFeedbackText = document.getElementById('focus-feedback-text'); 
    
    let currentFocusLevel = 2; // START BLURRY (e.g., max blur out: range -2 to +2, 0 is optimal)
    const optimalFocusLevel = 0;

    // Page 2 specific - Drag and Drop
    const draggableMoons = document.querySelectorAll('.draggable-moon');
    const dropTargets = document.querySelectorAll('.drop-target');
    let draggedItem = null;
    let placedMoons = {};

    // Page 3 specific
    const ptolemaicModelSVGElement = document.getElementById('earth-ptolemaic'); 
    const copernicanModelSVGElement = document.getElementById('sun-copernican'); 
    const infoPopupP3 = document.getElementById('info-popup-galileo-p3');

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
    function playNoteSequence(notesConfig) {
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
    const pageMusicGalileo = { 
        0: { overallVolume: 0.06, notes: [ { freq: 261.63, duration: H, delay: 0, type: 'triangle'}, { freq: 329.63, duration: H, delay: H*0.8, type: 'triangle'}, { freq: 392.00, duration: W, delay: H*1.6, type: 'sine'}, ] },
        1: { overallVolume: 0.05, notes: [ { freq: 196.00, duration: W, delay: 0, type: 'sine', volMultiplier: 0.8}, { freq: 293.66, duration: Q, delay: W*0.3, type: 'triangle', volMultiplier: 1.2}, { freq: 349.23, duration: Q, delay: W*0.3+Q, type: 'triangle', volMultiplier: 1.2}, { freq: 440.00, duration: H, delay: W*0.3+2*Q, type: 'triangle', volMultiplier: 1.2}, ] },
        2: { overallVolume: 0.07, notes: [ { freq: 174.61, duration: H, delay: 0, type: 'sawtooth', volMultiplier: 1}, { freq: 220.00, duration: H, delay: H*0.9, type: 'sawtooth', volMultiplier: 1.1}, { freq: 261.63, duration: W*1.5, delay: H*1.8, type: 'sine', volMultiplier: 1.3}, ] }
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
        if (pageMusicGalileo[currentPageIndex]) {
            playNoteSequence(pageMusicGalileo[currentPageIndex]);
        }
        if(infoPopupP3) infoPopupP3.style.opacity = '0'; 
        
        // Update focus visual specifically when page 1 (index 0) becomes current
        if (currentPageIndex === 0) {
            updateFocusVisual(); 
        }
    }
    
    // --- Page 1: Telescope Focus Game ---
    function updateFocusVisual() {
        const maxBlur = 2; 
        const minOpacity = 0.15; 
        const maxOpacity = 1.0;

        celestialViewObjects.forEach(obj => {
            const focusDifference = Math.abs(currentFocusLevel - optimalFocusLevel); 
            const blurAmount = focusDifference * (maxBlur / 2); 
            const opacityAmount = maxOpacity - (focusDifference * ((maxOpacity - minOpacity) / 2));
            
            obj.style.filter = `blur(${blurAmount}px)`;
            obj.style.opacity = opacityAmount;
        });

        if (currentFocusLevel === optimalFocusLevel) {
            focusFeedbackText.textContent = "Perfectly Focused!";
            focusFeedbackText.style.visibility = 'visible';
            focusFeedbackText.style.fill = 'lightgreen';
            if (!focusFeedbackText.dataset.focused) {
                 playNoteSequence({overallVolume: 0.15, notes: [{freq: 783.99, duration: Q*0.4, type:'sine'}, {freq: 1046.50, duration: Q*0.6, delay: Q*0.4, type:'sine'}]});
                 focusFeedbackText.dataset.focused = "true";
            }
        } else {
            focusFeedbackText.style.visibility = 'hidden';
            delete focusFeedbackText.dataset.focused;
        }
    }

    if (focusInBtn) {
        focusInBtn.addEventListener('click', () => {
            if (currentFocusLevel < 2) currentFocusLevel++;
            updateFocusVisual();
        });
    }
    if (focusOutBtn) {
        focusOutBtn.addEventListener('click', () => {
            if (currentFocusLevel > -2) currentFocusLevel--;
            updateFocusVisual();
        });
    }

    // --- Page 2: Drag and Drop Jupiter Moons ---
    draggableMoons.forEach(moon => {
        moon.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            setTimeout(() => { if(e.target) e.target.style.opacity = '0.5'; }, 0);
        });
        moon.addEventListener('dragend', (e) => {
            setTimeout(() => {
                if(e.target) e.target.style.opacity = '1';
                draggedItem = null;
            }, 0);
        });
    });
    dropTargets.forEach(target => {
        target.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            target.classList.add('over');
        });
        target.addEventListener('dragleave', () => {
            target.classList.remove('over');
        });
        target.addEventListener('drop', (e) => {
            e.preventDefault();
            target.classList.remove('over');
            if (draggedItem && !target.hasChildNodes()) { 
                const moonName = draggedItem.textContent;
                target.appendChild(draggedItem); 
                draggedItem.style.cursor = 'default';
                draggedItem.setAttribute('draggable', 'false'); 
                target.classList.add('dropped');
                target.textContent = moonName; 
                placedMoons[target.dataset.moonId] = moonName;
                if (Object.keys(placedMoons).length === draggableMoons.length) {
                    if(storyTexts[1]) storyTexts[1].innerHTML += "<br><strong>All moons placed! Galileo would be proud.</strong>";
                    playNoteSequence({overallVolume: 0.1, notes: [{freq: 523.25, duration: Q},{freq: 659.25, duration: Q, delay: Q},{freq: 783.99, duration: H, delay: 2*Q}]});
                }
            }
        });
    });

    // --- Page 3: Clickable Cosmological Models ---
    function showModelInfo(modelName, event) {
        if (!infoPopupP3) return;
        let infoText = "";
        if (modelName === 'ptolemaic') {
            infoText = "Geocentric Model: Earth at the center, with the Sun, Moon, and stars orbiting it. Dominant ancient theory.";
        } else if (modelName === 'copernican') {
            infoText = "Heliocentric Model: Sun at the center, with Earth and other planets orbiting it. Revolutionized astronomy.";
        }
        infoPopupP3.textContent = infoText;
        const containerRect = document.getElementById('storybook-container-galileo').getBoundingClientRect();
        infoPopupP3.style.left = (event.clientX - containerRect.left + 10) + 'px';
        infoPopupP3.style.top = (event.clientY - containerRect.top - infoPopupP3.offsetHeight - 10) + 'px';
        infoPopupP3.style.opacity = '1';
        setTimeout(() => { if(infoPopupP3) infoPopupP3.style.opacity = '0'; }, 4000);
    }
    if (ptolemaicModelSVGElement) ptolemaicModelSVGElement.addEventListener('click', (e) => showModelInfo('ptolemaic', e));
    if (copernicanModelSVGElement) copernicanModelSVGElement.addEventListener('click', (e) => showModelInfo('copernican', e));

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => showPage(2));
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        currentFocusLevel = 2; // Reset to initial blurry state
        // updateFocusVisual(); // showPage(0) will call this
        
        placedMoons = {};
        dropTargets.forEach(dt => {
            dt.innerHTML = ''; 
            dt.classList.remove('dropped');
        });
        const moonNameContainer = document.getElementById('moon-names-container');
        if (moonNameContainer) { // Check if container exists
            draggableMoons.forEach(dm => { 
                moonNameContainer.appendChild(dm); 
                dm.style.opacity = '1'; 
                dm.setAttribute('draggable', 'true');
                dm.style.cursor = 'grab';
            });
        }
        if (storyTexts[1]) storyTexts[1].innerHTML = "Galileo observed that the Moon was not a perfect sphere... Drag the names to the correct moons (conceptual)!";
        
        showPage(0); // This will also call updateFocusVisual for page 0
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    // Initialize
    showPage(0); // This will call updateFocusVisual for page 0 when it's first displayed
});