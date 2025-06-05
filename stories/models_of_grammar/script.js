document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Overlay & Audio Start ---
    const clickToStartOverlay = document.getElementById('click-to-start-overlay-grammar');
    const startAudioButton = document.getElementById('start-audio-button-grammar');
    const storybookContainer = document.getElementById('storybook-container-grammar');

    // --- Course Map Elements ---
    const moduleNodes = document.querySelectorAll('.module-node'); // All clickable circles on the map
    const courseMapSvg = document.getElementById('course-map-svg'); // The main SVG element

    // --- Dynamic Content Panel Elements ---
    const dynamicContentPanel = document.querySelector('.dynamic-content-panel');
    const moduleContents = { // Map module IDs to their content divs
        'intro': document.getElementById('module-content-intro'),
        'module0': document.getElementById('module-content-module0'),
        'module1': document.getElementById('module-content-module1'),
        'module2': document.getElementById('module-content-module2'),
        'module3': document.getElementById('module-content-module3'),
        'module4': document.getElementById('module-content-module4'),
        'module5': document.getElementById('module-content-module5'),
        'module6': document.getElementById('module-content-module6'),
        'module7': document.getElementById('module-content-module7')
    };

    // --- Buttons & Inputs ---
    const startExplorationBtn = document.getElementById('start-exploration-btn');
    const resetCourseBtn = document.getElementById('reset-course-btn');
    const hubReturnButton = document.querySelector('.hub-return-button'); // Assuming one global return button

    // Quiz elements (common classes)
    const quizOptions = document.querySelectorAll('.quiz-option');
    const quizFeedbacks = {}; // Map quiz area IDs to their feedback divs
    document.querySelectorAll('.quiz-area').forEach(area => {
        const feedbackDiv = area.querySelector('.quiz-feedback');
        if (feedbackDiv) quizFeedbacks[area.id] = feedbackDiv;
    });

    // Clickable terms for info popups
    const clickableTerms = document.querySelectorAll('.clickable-term');
    const infoPopupGrammar = document.getElementById('info-popup-grammar');


    // --- Audio Context and Sound Playback ---
    let audioContext;
    let currentOscillators = [];

    function initAudioContext() {
        if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.1);
            currentOscillators.push(oscillator);
        });
    }

    // --- NOTE DURATION CONSTANTS (MOVED HERE TO BE IN SCOPE) ---
    const E = 0.125; // Eighth note duration
    const Q = 0.25;  // Quarter note duration
    const H = 0.5;   // Half note duration
    const W = 1.0;   // Whole note duration

    const moduleMusic = { // LLM to generate these based on module descriptions
        'intro': { overallVolume: 0.08, notes: [{ freq: 392.00, duration: H, delay: 0, type: 'sine' }, { freq: 440.00, duration: H, delay: H, type: 'sine' }, { freq: 523.25, duration: W, delay: H*2, type: 'sine' }]}, // G4 A4 C5 - Inquisitive
        'module0': { overallVolume: 0.08, notes: [{ freq: 392.00, duration: H, delay: 0, type: 'sine' }, { freq: 440.00, duration: H, delay: H, type: 'sine' }, { freq: 523.25, duration: W, delay: H*2, type: 'sine' }]}, // G4 A4 C5 - Inquisitive
        'module1': { overallVolume: 0.09, notes: [{ freq: 261.63, duration: Q, delay: 0, type: 'square' }, { freq: 329.63, duration: Q, delay: Q, type: 'square' }, { freq: 392.00, duration: H, delay: 2*Q, type: 'square' }]}, // C4 E4 G4 - Structured
        'module2': { overallVolume: 0.1, notes: [{ freq: 220.00, duration: Q, delay: 0, type: 'triangle' }, { freq: 261.63, duration: Q, delay: Q, type: 'triangle' }, { freq: 293.66, duration: H, delay: 2*Q, type: 'triangle' }]}, // A3 C4 D4 - Parallel
        'module3': { overallVolume: 0.08, notes: [{ freq: 196.00, duration: E, delay: 0, type: 'sawtooth' }, { freq: 220.00, duration: E, delay: E, type: 'sawtooth' }, { freq: 196.00, duration: E, delay: 2*E, type: 'sawtooth' }, { freq: 220.00, duration: E, delay: 3*E, type: 'sawtooth' }]}, // G3 A3 G3 A3 - Interlocking
        'module4': { overallVolume: 0.12, notes: [{ freq: 130.81, duration: Q, delay: 0, type: 'square' }, { freq: 110.00, duration: Q, delay: Q, type: 'square' }, { freq: 130.81, duration: H, delay: 2*Q, type: 'square' }]}, // C3 A2 C3 - Tension/Resolution
        'module5': { overallVolume: 0.07, notes: [{ freq: 293.66, duration: H, delay: 0, type: 'sine' }, { freq: 261.63, duration: H, delay: H, type: 'sine' }, { freq: 220.00, duration: H, delay: H*2, type: 'sine' }]}, // D4 C4 A3 - Dependency
        'module6': { overallVolume: 0.09, notes: [{ freq: 329.63, duration: Q, delay: 0, type: 'triangle' }, { freq: 392.00, duration: Q, delay: Q, type: 'triangle' }, { freq: 440.00, duration: H, delay: 2*Q, type: 'triangle' }]}, // E4 G4 A4 - Building Blocks
        'module7': { overallVolume: 0.1, notes: [{ freq: 261.63, duration: Q, delay: 0, type: 'square' }, { freq: 349.23, duration: Q, delay: Q, type: 'square' }, { freq: 392.00, duration: Q, delay: 2*Q, type: 'square' }, { freq: 523.25, duration: H, delay: 3*Q, type: 'square' }]} // C4 F4 G4 C5 - Principles
    };
    const quizSuccessJingle = { overallVolume: 0.15, notes: [{ freq: 659.25, duration: Q }, { freq: 783.99, duration: H, delay: Q * 1.1 }] }; // E5 G5
    const quizFailureJingle = { overallVolume: 0.1, notes: [{ freq: 130.81, duration: H, type: 'sawtooth' }] }; // C3


    // --- Content Display Logic ---
    let currentModuleId = 'intro'; // Start with intro content

    function animateContent(contentDiv) {
        if(contentDiv) {
            contentDiv.classList.remove('text-fade-in');
            void contentDiv.offsetWidth; // Trigger reflow
            contentDiv.classList.add('text-fade-in');
        }
    }

    function showModuleContent(moduleIdToShow) {
        if (!moduleContents[moduleIdToShow]) return;

        // Hide current content
        if (moduleContents[currentModuleId]) {
            moduleContents[currentModuleId].classList.remove('current-content');
        }

        // Show new content
        moduleContents[moduleIdToShow].classList.add('current-content');
        currentModuleId = moduleIdToShow;

        // Animate text and play music
        animateContent(moduleContents[currentModuleId]);
        if (moduleMusic[currentModuleId]) {
            playNoteSequence(moduleMusic[currentModuleId]);
        }

        // Update active module on SVG map
        moduleNodes.forEach(node => {
            node.classList.remove('current-module');
            if (node.id === moduleIdToShow) {
                node.classList.add('current-module');
            }
        });
        // Hide any active popups
        if(infoPopupGrammar) infoPopupGrammar.style.opacity = '0';
    }

    // --- Quiz Logic ---
    function setupQuiz(quizAreaId, correctAnswer) {
        const quizArea = document.getElementById(quizAreaId);
        if (!quizArea) return;

        const options = quizArea.querySelectorAll('.quiz-option');
        const feedbackDiv = quizFeedbacks[quizAreaId];

        options.forEach(option => {
            option.removeEventListener('click', handleQuizOptionClick); // Remove old listeners
            option.addEventListener('click', handleQuizOptionClick);
            option.classList.remove('correct', 'incorrect'); // Reset styles
            option.disabled = false; // Re-enable
        });

        function handleQuizOptionClick(event) {
            const selectedOption = event.target;
            const isCorrect = selectedOption.dataset.answer === correctAnswer;

            options.forEach(opt => opt.disabled = true); // Disable all options after selection

            if (isCorrect) {
                selectedOption.classList.add('correct');
                if (feedbackDiv) feedbackDiv.textContent = "Correct! Well done.";
                playNoteSequence(quizSuccessJingle);
            } else {
                selectedOption.classList.add('incorrect');
                if (feedbackDiv) feedbackDiv.textContent = "Incorrect. The correct answer is highlighted.";
                playNoteSequence(quizFailureJingle);
                // Highlight correct answer
                options.forEach(opt => {
                    if (opt.dataset.answer === correctAnswer) {
                        opt.classList.add('correct');
                    }
                });
            }
        }
    }

    // --- Setup all quizzes ---
    setupQuiz('quiz-area-module0', "Describe and explain language structure.");
    setupQuiz('quiz-area-module1', "Sentence structure.");
    setupQuiz('quiz-area-module2', "F-structure");
    setupQuiz('quiz-area-module3', "Morpheme");
    setupQuiz('quiz-area-module4', "Violable and ranked.");
    setupQuiz('quiz-area-module5', "Word-to-word relationships.");
    setupQuiz('quiz-area-module6', "Form-meaning pairings (constructions).");
    setupQuiz('quiz-area-module7', "Allows subjects to be dropped.");


    // --- SVG Clickable Terms (Info Popups) ---
    function setupClickableTerms() {
        if (!infoPopupGrammar) return;
        clickableTerms.forEach(term => {
            term.addEventListener('mousemove', (e) => {
                const info = term.dataset.termInfo;
                if (info) {
                    infoPopupGrammar.textContent = info;
                    // Position popup near mouse, relative to viewport
                    infoPopupGrammar.style.left = (e.clientX + 15) + 'px';
                    infoPopupGrammar.style.top = (e.clientY - infoPopupGrammar.offsetHeight - 5) + 'px';
                    infoPopupGrammar.style.opacity = '1';
                    infoPopupGrammar.style.visibility = 'visible';
                }
            });
            term.addEventListener('mouseleave', () => {
                infoPopupGrammar.style.opacity = '0';
                infoPopupGrammar.style.visibility = 'hidden';
            });
        });
    }


    // --- Event Listeners ---
    // Initial Audio Start Button
    if (startAudioButton && clickToStartOverlay && storybookContainer) {
        startAudioButton.addEventListener('click', () => {
            initAudioContext();
            clickToStartOverlay.style.opacity = '0';
            setTimeout(() => {
                clickToStartOverlay.style.display = 'none';
                storybookContainer.style.display = 'flex'; // Show the main storybook
                showModuleContent('intro'); // Show the initial intro content
            }, 500); // Match CSS transition
        });
    } else { // Fallback for direct load if overlay is skipped (e.g., for dev)
        storybookContainer.style.display = 'flex';
        showModuleContent('intro');
    }

    // Start Exploration Button (from intro content)
    if (startExplorationBtn) {
        startExplorationBtn.addEventListener('click', () => showModuleContent('module0'));
    }

    // Module Node Clicks on SVG Map
    moduleNodes.forEach(node => {
        node.addEventListener('click', () => {
            const moduleId = node.dataset.moduleId;
            if (moduleId) {
                showModuleContent(moduleId);
            }
        });
    });

    // Reset Course Button
    if (resetCourseBtn) {
        resetCourseBtn.addEventListener('click', () => {
            showModuleContent('intro'); // Go back to intro
            // Reset all quizzes
            Object.keys(moduleContents).forEach(moduleId => {
                const quizArea = document.getElementById(`quiz-area-${moduleId}`);
                if (quizArea) {
                    const options = quizArea.querySelectorAll('.quiz-option');
                    options.forEach(opt => {
                        opt.classList.remove('correct', 'incorrect');
                        opt.disabled = false;
                    });
                    const feedbackDiv = quizFeedbacks[`quiz-area-${moduleId}`];
                    if (feedbackDiv) feedbackDiv.textContent = "";
                }
            });
        });
    }

    // Hub Return Button
    if (hubReturnButton) {
        hubReturnButton.addEventListener('click', () => {
            window.location.href = '../../index.html'; // Adjust path if needed
        });
    }

    // Setup clickable terms after DOM is ready
    setupClickableTerms();

    // Initial state (will be handled by overlay click)
    // showModuleContent('intro'); // This is now called after overlay click
});