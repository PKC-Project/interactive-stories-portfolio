document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Overlay & Audio Start ---
    const clickToStartOverlay = document.getElementById('click-to-start-overlay');
    const startAudioButton = document.getElementById('start-audio-button');
    const storybookContainer = document.getElementById('storybook-container-eldoria');

    // --- Page Elements ---
    const pages = {
        scene1_1: document.getElementById('scene1_1'),
        scene1_2: document.getElementById('scene1_2'),
        scene2A_1: document.getElementById('scene2A_1'), // Riddle
        scene2A_2: document.getElementById('scene2A_2'), // Riddle Success
        scene2A_3: document.getElementById('scene2A_3'), // Riddle Failure
        scene2B_1: document.getElementById('scene2B_1'), // Rune Game
        scene2B_2: document.getElementById('scene2B_2'), // Rune Success
        scene2B_3: document.getElementById('scene2B_3'), // Rune Failure
        scene3_1: document.getElementById('scene3_1'), // Guardian
        scene_good_ending: document.getElementById('scene_good_ending'),
        scene_bad_ending: document.getElementById('scene_bad_ending')
    };
    const storyTextElements = {}; // For text animation
    Object.keys(pages).forEach(key => {
        const textEl = document.getElementById(`text-${key}`); // Assumes text p has id like text-scene1_1
        if (textEl) storyTextElements[key] = textEl;
    });


    // --- Buttons ---
    const btnAcceptQuest = document.getElementById('btn-accept-quest');
    const btnDarkThicket = document.getElementById('btn-dark-thicket');
    const btnShrinePath = document.getElementById('btn-shrine-path');
    const btnSubmitRiddle = document.getElementById('btn-submit-riddle');
    const riddleAnswerInput = document.getElementById('riddle-answer');
    const btnContinueSwiftness = document.getElementById('btn-continue-swiftness');
    const btnPressOnwardLost = document.getElementById('btn-press-onward-lost');
    const btnResetRunes = document.getElementById('btn-reset-runes');
    const btnContinueInsight = document.getElementById('btn-continue-insight');
    const btnProceedCautiously = document.getElementById('btn-proceed-cautiously');
    const choicesScene3_1Container = document.getElementById('choices-scene3_1');
    const btnPlayAgainGood = document.getElementById('btn-play-again-good');
    const btnPlayAgainBad = document.getElementById('btn-play-again-bad');
    // Hub return buttons removed from JS logic as they are removed from HTML story pages

    // --- Game State ---
    let currentPageId = 'scene1_1'; // Will be set after start
    let previousPageId = null;
    let playerFlags = {
        hasSwiftnessCharm: false,
        hasInsightMedallion: false,
        heardCrypticWhisper: false
    };

    // --- Audio ---
    let audioContext;
    let currentOscillators = []; // To manage multiple oscillators for chords/sequences

    function initAudioContext() {
        if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Resume context if it was suspended due to autoplay policy
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
        return audioContext;
    }

    function stopAllSounds() {
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
        currentOscillators = [];
    }

    function playNoteSequence(notesConfig) {
        if (!audioContext || audioContext.state !== 'running') {
            console.warn("AudioContext not running. User interaction might be needed.");
            return;
        }
        stopAllSounds();
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.08;

        notesConfig.notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
            oscillator.type = note.type || 'sine';
            oscillator.frequency.setValueAtTime(note.freq, now + (note.delay || 0));
            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.1); // Allow for release
            currentOscillators.push(oscillator);
        });
    }

    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;
    const sceneMusic = { // LLM to generate these based on scene descriptions
        scene1_1: { overallVolume: 0.07, notes: [{ freq: 110, duration: W*1.5, delay:0.1, type: 'triangle'}]},
        scene1_2: { overallVolume: 0.06, notes: [{ freq: 146.83, duration: W*1.2, delay:0.1, type: 'sine'}]},
        scene2A_1: { overallVolume: 0.09, notes: [{ freq: 87.31, duration: W, type: 'sawtooth'}, { freq: 98, duration: W, delay: W, type: 'sawtooth'}]},
        scene2A_2: { overallVolume: 0.1, notes: [{ freq: 392, duration: H, type: 'sine'}, { freq: 493.88, duration: H, delay: H, type: 'sine'}]},
        scene2A_3: { overallVolume: 0.05, notes: [{ freq: 73.42, duration: W*1.8, type: 'square'}]},
        scene2B_1: { overallVolume: 0.07, notes: [{ freq: 329.63, duration: W, type: 'triangle'}, { freq: 493.88, duration: W, delay: W*0.8, type: 'triangle'}]},
        scene2B_2: { overallVolume: 0.12, notes: [{ freq: 523.25, duration: H, type: 'sine'}, { freq: 659.25, duration: H, delay: H, type: 'sine'}, { freq: 783.99, duration: H, delay: H*2, type: 'sine'}]},
        scene2B_3: { overallVolume: 0.06, notes: [{ freq: 164.81, duration: W*1.5, type: 'sine', volMultiplier: 0.8}]},
        scene3_1: { overallVolume: 0.1, notes: [{ freq: 130.81, duration: Q, type: 'sawtooth'}, { freq: 123.47, duration: Q, delay: Q, type: 'sawtooth'}, { freq: 130.81, duration: H, delay: Q*2, type: 'sawtooth'}]},
        scene_good_ending: { overallVolume: 0.15, notes: [{ freq: 523.25, duration: W, type: 'sine'}, { freq: 659.25, duration: W, delay: W*0.8, type: 'sine'}, { freq: 783.99, duration: W, delay: W*1.6, type: 'sine'}]},
        scene_bad_ending: { overallVolume: 0.07, notes: [{ freq: 110, duration: W*2, type: 'triangle'}, { freq: 103.83, duration: W*2, delay: W*1.5, type: 'triangle'}]}
    };
    const successJingle = { overallVolume:0.15, notes: [{freq:659.25, duration:Q},{freq:783.99, duration:H, delay:Q*1.1}]};
    const failureJingle = { overallVolume:0.1, notes: [{freq:130.81, duration:H, type:'sawtooth'}]};


    // --- Page Navigation & Text Animation ---
    function animateText(sceneId) {
        const textElement = storyTextElements[sceneId];
        if(textElement) {
            textElement.classList.remove('text-fade-in');
            void textElement.offsetWidth; // Trigger reflow
            textElement.classList.add('text-fade-in');
        }
    }

    function showPage(pageIdToShow) {
        if (!pages[pageIdToShow] || !storybookContainer || storybookContainer.style.display === 'none') return; // Don't navigate if story hasn't started

        const goingForward = determineDirection(previousPageId, pageIdToShow);
        
        if (previousPageId && pages[previousPageId]) {
            pages[previousPageId].classList.remove('current-page');
            pages[previousPageId].classList.add(goingForward ? 'slide-out-left' : 'slide-out-right');
        }
        
        // Ensure all pages are correctly hidden before showing the new one
        Object.values(pages).forEach(p => {
            if(p && p !== pages[pageIdToShow]) {
                 p.classList.remove('current-page', 'slide-out-left', 'slide-out-right');
            }
        });

        pages[pageIdToShow].classList.remove('slide-out-left', 'slide-out-right'); // Remove any lingering slide-out classes
        pages[pageIdToShow].classList.add('current-page');
        
        currentPageId = pageIdToShow;
        previousPageId = pageIdToShow; 

        animateText(currentPageId);
        if (sceneMusic[currentPageId]) {
            playNoteSequence(sceneMusic[currentPageId]);
        }

        // Special setup for scenes
        if (currentPageId === 'scene3_1') {
            setupGuardianChoices();
        }
        if (currentPageId === 'scene2B_1') {
            resetRuneGame(); 
        }
    }

    function determineDirection(prevPageKey, nextPageKey) {
        const pageKeys = Object.keys(pages);
        const prevIndex = pageKeys.indexOf(prevPageKey);
        const nextIndex = pageKeys.indexOf(nextPageKey);
        if (prevIndex === -1 || nextIndex === -1) return true; // Default to forward if unknown
        return nextIndex >= prevIndex;
    }

    // --- Event Listeners for Navigation ---
    if(btnAcceptQuest) btnAcceptQuest.addEventListener('click', () => showPage('scene1_2'));
    if(btnDarkThicket) btnDarkThicket.addEventListener('click', () => showPage('scene2A_1'));
    if(btnShrinePath) btnShrinePath.addEventListener('click', () => showPage('scene2B_1'));
    
    if(btnContinueSwiftness) btnContinueSwiftness.addEventListener('click', () => {
        playerFlags.hasSwiftnessCharm = true;
        showPage('scene3_1');
    });
    if(btnPressOnwardLost) btnPressOnwardLost.addEventListener('click', () => showPage('scene3_1'));
    
    if(btnContinueInsight) btnContinueInsight.addEventListener('click', () => {
        playerFlags.hasInsightMedallion = true;
        showPage('scene3_1');
    });
    if(btnProceedCautiously) btnProceedCautiously.addEventListener('click', () => {
        playerFlags.heardCrypticWhisper = true;
        showPage('scene3_1');
    });

    if(btnPlayAgainGood) btnPlayAgainGood.addEventListener('click', resetStory);
    if(btnPlayAgainBad) btnPlayAgainBad.addEventListener('click', resetStory);
    
    // Removed hubReturnButtons logic from here

    function resetStory() {
        playerFlags = { hasSwiftnessCharm: false, hasInsightMedallion: false, heardCrypticWhisper: false };
        resetRuneGame();
        if(riddleAnswerInput) riddleAnswerInput.value = "";
        showPage('scene1_1');
    }

    // --- Riddle Logic (Scene 2A.1) ---
    if (btnSubmitRiddle && riddleAnswerInput) {
        btnSubmitRiddle.addEventListener('click', () => {
            const answer = riddleAnswerInput.value.trim().toLowerCase();
            if (answer === "a map" || answer === "map") {
                playNoteSequence(successJingle);
                showPage('scene2A_2');
            } else {
                playNoteSequence(failureJingle);
                showPage('scene2A_3');
            }
        });
    }

    // --- Rune Mini-Game Logic (Scene 2B.1) - Click-to-Select, Click-to-Place ---
    const clickableRunes = document.querySelectorAll('.clickable-rune'); // These are the SVGs in #rune-choices-container
    const runeSlotsInSVG = document.querySelectorAll('#svg-art-scene2B_1 .rune-slot'); // Slots within the main SVG
    const runeGameFeedback = document.getElementById('rune-game-feedback');
    
    let selectedRuneId = null;
    let placedRunesInSlots = {}; // slotId: runeId
    const correctRuneOrder = { slot1: "runeC_shape", slot2: "runeA_shape", slot3: "runeB_shape" }; // Triangle, Circle, Square

    function resetRuneGame() {
        selectedRuneId = null;
        placedRunesInSlots = {};
        if(runeGameFeedback) runeGameFeedback.textContent = "Select a rune, then click an empty slot. Order: Triangle, Circle, Square.";
        
        clickableRunes.forEach(rune => {
            rune.classList.remove('selected-rune');
            rune.style.opacity = '1'; // Make all choice runes visible
        });
        runeSlotsInSVG.forEach(slot => {
            slot.innerHTML = ''; // Clear any SVG content from slots
            slot.classList.remove('filled');
            slot.style.fill = '#777'; // Reset slot fill
        });
    }

    if (clickableRunes.length > 0 && runeSlotsInSVG.length > 0) {
        clickableRunes.forEach(rune => {
            rune.addEventListener('click', () => {
                if (rune.style.opacity === '0.3') return; // Already placed

                if (selectedRuneId === rune.dataset.runeId) { // Deselect if clicking the same rune
                    rune.classList.remove('selected-rune');
                    selectedRuneId = null;
                } else { // Select new rune
                    clickableRunes.forEach(r => r.classList.remove('selected-rune'));
                    rune.classList.add('selected-rune');
                    selectedRuneId = rune.dataset.runeId;
                }
            });
        });

        runeSlotsInSVG.forEach(slot => {
            slot.addEventListener('click', () => {
                if (!selectedRuneId || slot.classList.contains('filled')) {
                    if (slot.classList.contains('filled')) {
                        if(runeGameFeedback) runeGameFeedback.textContent = "Slot already filled. Reset to change.";
                    } else if (!selectedRuneId) {
                        if(runeGameFeedback) runeGameFeedback.textContent = "Select a rune from below first!";
                    }
                    return;
                }

                const runeToPlaceSVG = document.getElementById(selectedRuneId); // Get the SVG element of the selected rune
                if (runeToPlaceSVG) {
                    // Place a CLONE of the rune SVG into the slot
                    const clone = runeToPlaceSVG.cloneNode(true);
                    clone.removeAttribute('id'); // Clones shouldn't have same ID
                    clone.classList.remove('selected-rune', 'clickable-rune');
                    clone.classList.add('placed-rune-svg');
                    // Adjust viewBox and size to fit the slot (slot is 20x25)
                    clone.setAttribute('viewBox', '0 0 20 20'); 
                    clone.setAttribute('width', '20');
                    clone.setAttribute('height', '20'); // Make it slightly smaller than slot height
                    clone.style.transform = 'translateY(2.5px)'; // Center vertically in slot

                    slot.innerHTML = ''; // Clear previous content
                    slot.appendChild(clone);
                    slot.classList.add('filled');
                    slot.style.fill = '#666'; // Darken filled slot

                    placedRunesInSlots[slot.id] = selectedRuneId;
                    runeToPlaceSVG.style.opacity = '0.3'; // Visually indicate it's used
                    runeToPlaceSVG.classList.remove('selected-rune');
                    selectedRuneId = null; // Deselect after placing

                    checkRuneSolution();
                }
            });
        });

        if(btnResetRunes) btnResetRunes.addEventListener('click', resetRuneGame);
    }

    function checkRuneSolution() {
        if (Object.keys(placedRunesInSlots).length === runeSlotsInSVG.length) {
            let correct = true;
            for (const slotId in correctRuneOrder) {
                if (placedRunesInSlots[slotId] !== correctRuneOrder[slotId]) {
                    correct = false;
                    break;
                }
            }
            if (correct) {
                if(runeGameFeedback) runeGameFeedback.textContent = "Correct! The altar glows!";
                playNoteSequence(successJingle);
                setTimeout(() => showPage('scene2B_2'), 1500);
            } else {
                if(runeGameFeedback) runeGameFeedback.textContent = "Incorrect sequence. Reset and try again.";
                playNoteSequence(failureJingle);
            }
        }
    }

    // --- Guardian Choices (Scene 3.1) ---
    function setupGuardianChoices() { /* ... (same as previous, ensure text IDs are correct) ... */
        if (!choicesScene3_1Container) return;
        choicesScene3_1Container.innerHTML = ''; 
        let challengeText = "You stand before the Guardian. 'You seek the Light of Eldoria?' it hisses. 'Many have tried. None have been worthy.' What is your approach?";
        const guardianChallengeP = document.getElementById('text-scene3_1_challenge');
        
        addChoiceButton("Reason with it", "reason");
        addChoiceButton("Look for a weakness", "observe");

        if (playerFlags.hasSwiftnessCharm) {
            addChoiceButton("Attempt a Quick Maneuver (Swiftness Charm)", "swiftness");
            challengeText = "Your Charm of Swiftness hums. The Guardian seems momentarily distracted by your agile presence. How do you proceed?";
        }
        if (playerFlags.hasInsightMedallion) {
            addChoiceButton("Use Insight (Medallion)", "insight");
            challengeText = "Your Medallion of Insight reveals patterns in the Guardian's shadowy form. An idea sparks. What is your choice?";
        }
        if (playerFlags.heardCrypticWhisper) {
            addChoiceButton("Recall the whisper: 'Shadows feed on doubt'", "whisper_confront");
            challengeText = "The whisper 'Shadows feed on doubt' echoes in your mind as you face the Guardian. How will you use this?";
        }
        if(document.getElementById('text-scene3_1_intro') && guardianChallengeP) document.getElementById('text-scene3_1_intro').textContent = challengeText;
        if(guardianChallengeP && choicesScene3_1Container.children.length <= 2) { // If no special flags, use default challenge text
             guardianChallengeP.textContent = "'You seek the Light of Eldoria?' it hisses. 'Many have tried. None have been worthy.' What do you do?";
        }
    }
    function addChoiceButton(text, choiceValue) { /* ... (same as previous) ... */
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = text;
        button.dataset.choice = choiceValue;
        button.addEventListener('click', handleGuardianChoice);
        choicesScene3_1Container.appendChild(button);
    }
    function handleGuardianChoice(event) { /* ... (same as previous, with success/failure jingles) ... */
        const choice = event.target.dataset.choice;
        let success = false;
        if (choice === "insight" && playerFlags.hasInsightMedallion) {
            const guardianRiddle = prompt("The Guardian tests your insight: 'I have no voice, yet I tell of all things, past, present, and future. What am I?' (Hint: time, history, a story, a book)");
            if (guardianRiddle && (guardianRiddle.toLowerCase().includes("book") || guardianRiddle.toLowerCase().includes("story") || guardianRiddle.toLowerCase().includes("time") || guardianRiddle.toLowerCase().includes("history"))) {
                success = true;
            }
        } else if (choice === "swiftness" && playerFlags.hasSwiftnessCharm) { success = Math.random() > 0.3; } 
        else if (choice === "whisper_confront" && playerFlags.heardCrypticWhisper) { success = Math.random() > 0.4; } 
        else if (choice === "reason") { success = Math.random() > 0.8; } // Harder to reason
        else { success = Math.random() > 0.85; } // Observe is passive

        if (success) { playNoteSequence(successJingle); showPage('scene_good_ending'); } 
        else { playNoteSequence(failureJingle); showPage('scene_bad_ending'); }
    }

    // --- Initial Setup ---
    if (startAudioButton && clickToStartOverlay && storybookContainer) {
        startAudioButton.addEventListener('click', () => {
            initAudioContext(); // Initialize audio context on first user gesture
            clickToStartOverlay.style.opacity = '0';
            setTimeout(() => {
                clickToStartOverlay.style.display = 'none';
                storybookContainer.style.display = 'flex'; // Show the storybook
                showPage('scene1_1'); // Show the first actual page
            }, 500); // Match CSS transition
        });
    } else { // Fallback if overlay isn't used or for testing
        storybookContainer.style.display = 'flex';
        showPage('scene1_1');
    }
});