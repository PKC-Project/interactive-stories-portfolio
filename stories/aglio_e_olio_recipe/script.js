document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-recipe'),
        document.getElementById('page2-recipe'),
        document.getElementById('page3-recipe')
    ];
    // Navigation buttons
    const nextPage1Btn = document.getElementById('next-page1-recipe');
    const prevPage2Btn = document.getElementById('prev-page2-recipe');
    const nextPage2Btn = document.getElementById('next-page2-recipe');
    const prevPage3Btn = document.getElementById('prev-page3-recipe');
    const restartBtn = document.getElementById('restart-story-recipe');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1: Ingredients
    const ingredientSVGs = document.querySelectorAll('.ingredient-svg');
    const ingredientChecklist = document.getElementById('ingredient-checklist');

    // Page 2: Cooking Steps
    const stepTitleEl = document.getElementById('step-title');
    const stepInstructionEl = document.getElementById('step-instruction');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const boilingBubblesGroup = document.getElementById('boiling-bubbles');
    const sizzlingGarlicGroup = document.getElementById('sizzling-garlic');
    const stepProgressBar = document.getElementById('step-progress-bar');
    let currentStepIndex = 0;
    let stepInterval;

    // Page 3: Tips
    const recipeTipBtn = document.getElementById('recipe-tip-btn');
    const tipDisplayEl = document.getElementById('tip-display');

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;

    // --- LLM Task: Generate cooking steps data ---
    const cookingSteps = [
        { title: "Step 1: Boil Pasta", instruction: "Bring a large pot of salted water to a rolling boil. Add spaghetti and cook according to package directions until al dente (usually 8-10 minutes). Reserve a cup of pasta water before draining.", duration: 8000, animation: "boil" },
        { title: "Step 2: Prepare Garlic & Chili", instruction: "While pasta cooks, thinly slice garlic. If using fresh chili, slice it. If using flakes, have them ready.", duration: 3000, animation: "prep" },
        { title: "Step 3: Sauté Garlic", instruction: "In a large pan, heat olive oil over medium-low heat. Add garlic and chili flakes. Cook gently until garlic is fragrant and lightly golden (about 2-3 minutes). Do NOT burn it!", duration: 3000, animation: "sizzle" },
        { title: "Step 4: Toss with Pasta", instruction: "Add the drained spaghetti to the pan with the garlic and oil. Toss well to coat. Add a splash of the reserved pasta water to help create a light sauce.", duration: 4000, animation: "toss" },
        { title: "Step 5: Finish & Serve", instruction: "Remove from heat. Stir in fresh chopped parsley. Taste and adjust salt if needed. Serve immediately!", duration: 2000, animation: "finish" }
    ];
    // --- LLM Task: Generate tips ---
    const recipeTips = [
        "For extra flavor, add a splash of white wine with the garlic.",
        "A squeeze of lemon juice at the end brightens the dish.",
        "Don't overcrowd the pan when cooking pasta.",
        "Good quality olive oil makes a big difference!",
        "Save more pasta water than you think you need; it's key for the sauce."
    ];

    function initAudioContext() { /* ... (same) ... */ }
    function stopAllSounds() { /* ... (same) ... */ }
    function playSoundEffect(effectConfig) { /* ... (similar to playNoteSequence, but for effects) ... */
        if (!initAudioContext()) return;
        // For simplicity, we'll use playNoteSequence for basic sounds
        playNoteSequence(effectConfig);
    }
     function playNoteSequence(notesConfig) { // Re-pasting for completeness
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

    const soundEffectsRecipe = {
        ingredientCheck: { overallVolume: 0.1, notes: [{ freq: 800, duration: 0.05, type: 'triangle' }] },
        boiling: { overallVolume: 0.03, notes: [{ freq: 100, duration: 0.8, type: 'noise', sustain: true, volMultiplier: 0.5 }] }, // Noise needs proper Web Audio setup
        sizzling: { overallVolume: 0.04, notes: [{ freq: 2000, duration: 0.1, type: 'noise', volMultiplier: 0.7, delay: 0 }, { freq: 2200, duration: 0.1, type: 'noise', volMultiplier: 0.6, delay: 0.05 }] },
        stepComplete: { overallVolume: 0.15, notes: [{ freq: 600, duration: 0.1, type: 'sine' }, { freq: 900, duration: 0.15, delay: 0.1, type: 'sine' }] },
        finalDing: { overallVolume: 0.2, notes: [{ freq: 1200, duration: 0.5, type: 'triangle' }] }
    };
     // Fallback for 'noise' type if full Web Audio noise node isn't implemented by LLM
    function playSoundEffect(effectConfig) {
        if (!initAudioContext()) return;
        stopAllSounds(); // Usually stop other sounds for a distinct effect
        const now = audioContext.currentTime;
        const overallVolume = effectConfig.overallVolume || 0.1;

        effectConfig.notes.forEach(note => {
            let sourceNode;
            const gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);

            if (note.type === 'noise') {
                // Simple white noise approximation
                const bufferSize = audioContext.sampleRate * note.duration; // duration in seconds
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const output = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1; // White noise
                }
                sourceNode = audioContext.createBufferSource();
                sourceNode.buffer = buffer;
                sourceNode.connect(gainNode);
            } else {
                sourceNode = audioContext.createOscillator();
                sourceNode.type = note.type || 'sine';
                sourceNode.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
                sourceNode.connect(gainNode);
            }
            
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            
            sourceNode.start(now + (note.delay || 0));
            sourceNode.stop(now + (note.delay || 0) + note.duration + 0.1); // Allow for release
            currentOscillators.push(sourceNode); // Store to stop later if needed
        });
    }


    function showPage(index) { /* ... (same as previous, adapt music object if needed) ... */
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
        // No general page music for recipe, sounds are per action
        stopAllSounds(); 
        if (currentPageIndex === 1) { // Cooking page
            currentStepIndex = 0;
            displayCurrentStep();
        }
    }
    
    // --- Page 1: Ingredient Checklist ---
    ingredientSVGs.forEach(svgEl => {
        svgEl.addEventListener('click', () => {
            if (currentPageIndex !== 0) return;
            const ingredientName = svgEl.dataset.ingredient;
            const checkbox = document.getElementById(`check-${ingredientName}`);
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                svgEl.classList.add('gathered');
                playSoundEffect(soundEffectsRecipe.ingredientCheck);
            } else if (checkbox && checkbox.checked) {
                // Optional: allow unchecking
                // checkbox.checked = false;
                // svgEl.classList.remove('gathered');
            }
        });
    });

    // --- Page 2: Cooking Steps Logic ---
    function displayCurrentStep() {
        if (currentStepIndex < 0 || currentStepIndex >= cookingSteps.length) return;
        const step = cookingSteps[currentStepIndex];
        stepTitleEl.textContent = step.title;
        stepInstructionEl.textContent = step.instruction;

        prevStepBtn.disabled = currentStepIndex === 0;
        nextStepBtn.textContent = (currentStepIndex === cookingSteps.length - 1) ? "Finish Steps!" : "Next Step \u2192";
        
        // Stop previous animations/sounds
        if(boilingBubblesGroup) boilingBubblesGroup.innerHTML = '';
        if(sizzlingGarlicGroup) sizzlingGarlicGroup.innerHTML = '';
        stopAllSounds();
        if(stepInterval) clearInterval(stepInterval);

        // Start animation/sound for current step
        if (step.animation === "boil" && boilingBubblesGroup) animateBoiling();
        if (step.animation === "sizzle" && sizzlingGarlicGroup) animateSizzling();
        
        // Progress bar
        let progress = 0;
        stepProgressBar.style.width = '0%';
        if (step.duration > 0) {
            const increment = 100 / (step.duration / 100); // Update every 100ms
            stepInterval = setInterval(() => {
                progress += increment;
                if (progress <= 100) {
                    stepProgressBar.style.width = progress + '%';
                } else {
                    clearInterval(stepInterval);
                    stepProgressBar.style.width = '100%';
                    playSoundEffect(soundEffectsRecipe.stepComplete);
                }
            }, 100);
        } else {
             stepProgressBar.style.width = '100%'; // Instant for 0 duration steps
        }
    }

    function animateBoiling() {
        playSoundEffect(soundEffectsRecipe.boiling);
        for (let i = 0; i < 10; i++) {
            const bubble = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bubble.setAttribute('cx', 20 + Math.random() * 40); // Inside pot area
            bubble.setAttribute('cy', 75); // Bottom of pot
            bubble.setAttribute('r', Math.random() * 2 + 1);
            bubble.classList.add('bubble'); // CSS handles animation
            bubble.style.animationDelay = Math.random() * 0.5 + 's';
            if(boilingBubblesGroup) boilingBubblesGroup.appendChild(bubble);
        }
    }
    function animateSizzling() {
        playSoundEffect(soundEffectsRecipe.sizzling);
        for (let i = 0; i < 15; i++) {
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            // Pan center approx cx="110", cy="70", rx="35", ry="15"
            dot.setAttribute('cx', 110 + (Math.random() - 0.5) * 50); 
            dot.setAttribute('cy', 70 + (Math.random() - 0.5) * 20); 
            dot.setAttribute('r', Math.random() * 1.5 + 0.5);
            dot.classList.add('sizzle-dot'); // CSS handles animation
            dot.style.animationDelay = Math.random() * 0.2 + 's';
            if(sizzlingGarlicGroup) sizzlingGarlicGroup.appendChild(dot);
        }
    }

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', () => {
            if (currentStepIndex < cookingSteps.length - 1) {
                currentStepIndex++;
                displayCurrentStep();
            } else {
                // Last step was finished, effectively go to next page
                playSoundEffect(soundEffectsRecipe.finalDing);
                showPage(2); // Go to plating page
            }
        });
    }
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                displayCurrentStep();
            }
        });
    }

    // --- Page 3: Recipe Tip ---
    if (recipeTipBtn && tipDisplayEl) {
        recipeTipBtn.addEventListener('click', () => {
            tipDisplayEl.textContent = recipeTips[Math.floor(Math.random() * recipeTips.length)];
        });
    }

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => {
         playSoundEffect(soundEffectsRecipe.finalDing);
         showPage(2);
    });
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => showPage(1));
    if(restartBtn) restartBtn.addEventListener('click', () => {
        // Reset recipe state
        ingredientSVGs.forEach(svg => svg.classList.remove('gathered'));
        const checkboxes = ingredientChecklist.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((cb, index) => {
            if(index < checkboxes.length -2) cb.checked = false; // Don't uncheck salt/water
        });
        currentStepIndex = 0;
        if(stepProgressBar) stepProgressBar.style.width = '0%';
        if(tipDisplayEl) tipDisplayEl.textContent = '';
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    showPage(0); // Initialize
});