document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Overlay & Audio Start ---
    const clickToStartOverlay = document.getElementById('click-to-start-overlay-lf');
    const startAudioButton = document.getElementById('start-audio-button-lf');
    const storybookContainer = document.getElementById('storybook-container-lf');

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
        'module6': document.getElementById('module-content-module6')
    };

    // --- Buttons & Inputs ---
    const startExplorationBtn = document.getElementById('start-exploration-btn');
    const resetCourseBtn = document.getElementById('reset-course-btn');
    const lfExampleInput = document.getElementById('lf-example-input');
    const digitalLfInput = document.getElementById('digital-lf-input');

    // Quiz elements (common classes)
    const quizOptions = document.querySelectorAll('.quiz-option');
    const quizFeedbacks = {}; // Map quiz area IDs to their feedback divs
    document.querySelectorAll('.quiz-area').forEach(area => {
        const feedbackDiv = area.querySelector('.quiz-feedback');
        if (feedbackDiv) quizFeedbacks[area.id] = feedbackDiv;
    });

    // Clickable terms for info popups
    const clickableTerms = document.querySelectorAll('.clickable-term');
    const infoPopupLf = document.getElementById('info-popup-lf');


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

    // LLM to generate these music sequences based on module descriptions
    const Q = 0.25; const H = 0.5; const W = 1.0; // Note durations
    const moduleMusic = {
        'intro': { overallVolume: 0.08, notes: [{ freq: 440, duration: H, delay: 0, type: 'sine' }, { freq: 523.25, duration: H, delay: H, type: 'sine' }, { freq: 659.25, duration: W, delay: H*2, type: 'sine' }]}, // A4 C5 E5 - Welcoming
        'module0': { overallVolume: 0.08, notes: [{ freq: 440, duration: H, delay: 0, type: 'sine' }, { freq: 523.25, duration: H, delay: H, type: 'sine' }, { freq: 659.25, duration: W, delay: H*2, type: 'sine' }]}, // A4 C5 E5 - Welcoming
        'module1': { overallVolume: 0.1, notes: [{ freq: 261.63, duration: Q, delay: 0, type: 'sine' }, { freq: 293.66, duration: Q, delay: Q, type: 'sine' }, { freq: 329.63, duration: H, delay: 2*Q, type: 'sine' }, { freq: 392.00, duration: Q, delay: 2*Q + H, type: 'sine' }, { freq: 523.25, duration: W, delay: 2*Q + H + Q, type: 'sine' }]}, // Inquisitive, resolving
        'module2': { overallVolume: 0.09, notes: [{ freq: 196.00, duration: Q, delay: 0, type: 'sawtooth' }, { freq: 261.63, duration: Q, delay: Q, type: 'sawtooth' }, { freq: 329.63, duration: Q, delay: 2*Q, type: 'sawtooth' }, { freq: 392.00, duration: H, delay: 3*Q, type: 'sawtooth' }, { freq: 440.00, duration: Q, delay: 3*Q + H, type: 'sawtooth' }, { freq: 523.25, duration: H, delay: 3*Q + H + Q, type: 'sawtooth' }]}, // Epic, flowing, historical
        'module3': { overallVolume: 0.1, notes: [{ freq: 220.00, duration: Q, delay: 0, type: 'square' }, { freq: 277.18, duration: Q, delay: Q, type: 'square' }, { freq: 369.99, duration: Q, delay: 2*Q, type: 'square' }, { freq: 440.00, duration: H, delay: 3*Q, type: 'square' }, { freq: 554.37, duration: Q, delay: 3*Q + H, type: 'square' }, { freq: 739.99, duration: H, delay: 3*Q + H + Q, type: 'square' }]}, // Modern, slightly digital
        'module4': { overallVolume: 0.08, notes: [{ freq: 130.81, duration: H, delay: 0, type: 'sawtooth' }, { freq: 110.00, duration: H, delay: H, type: 'sawtooth' }, { freq: 130.81, duration: H, delay: H*2, type: 'sawtooth' }, { freq: 110.00, duration: H, delay: H*3, type: 'sawtooth' }]}, // Somber, slightly dissonant
        'module5': { overallVolume: 0.07, notes: [{ freq: 261.63, duration: Q, delay: 0, type: 'sine' }, { freq: 329.63, duration: Q, delay: Q, type: 'sine' }, { freq: 392.00, duration: Q, delay: 2*Q, type: 'sine' }, { freq: 440.00, duration: Q, delay: 3*Q, type: 'sine' }, { freq: 493.88, duration: Q, delay: 4*Q, type: 'sine' }, { freq: 523.25, duration: Q, delay: 5*Q, type: 'sine' }]}, // Flowing, interconnected
        'module6': { overallVolume: 0.1, notes: [{ freq: 220.00, duration: Q, delay: 0, type: 'square' }, { freq: 440.00, duration: Q, delay: Q, type: 'square' }, { freq: 880.00, duration: Q, delay: 2*Q, type: 'square' }, { freq: 440.00, duration: Q, delay: 3*Q, type: 'square' }]} // Digital, ascending/descending
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
    }

    // --- Quiz Logic ---
    function setupQuiz(quizAreaId, correctAnswer) {
        const quizArea = document.getElementById(quizAreaId);
        if (!quizArea) return;

        const options = quizArea.querySelectorAll('.quiz-option');
        const feedbackDiv = quizFeedbacks[quizAreaId];

        options.forEach(option => {
            // Remove previous listeners to prevent multiple triggers
            option.removeEventListener('click', handleQuizOptionClick);
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
                if (feedbackDiv) feedbackDiv.textContent = "Incorrect. Try again or move on.";
                playNoteSequence(quizFailureJingle);
                // Optionally highlight correct answer
                options.forEach(opt => {
                    if (opt.dataset.answer === correctAnswer) {
                        opt.classList.add('correct');
                    }
                });
            }
        }
    }

    // --- Setup all quizzes ---
    setupQuiz('module-content-module1', "A language used for communication between speakers of different native languages.");
    setupQuiz('module-content-module2', "Roman Empire");
    setupQuiz('module-content-module3', "False");
    setupQuiz('module-content-module4', "False");
    setupQuiz('module-content-module5', "False");


    // --- SVG Clickable Terms (Info Popups) ---
    function setupClickableTerms() {
        if (!infoPopupLf) return;
        clickableTerms.forEach(term => {
            term.addEventListener('mousemove', (e) => {
                const info = term.dataset.termInfo;
                if (info) {
                    infoPopupLf.textContent = info;
                    // Position popup near mouse, relative to viewport
                    infoPopupLf.style.left = (e.clientX + 15) + 'px';
                    infoPopupLf.style.top = (e.clientY - infoPopupLf.offsetHeight - 5) + 'px';
                    infoPopupLf.style.opacity = '1';
                    infoPopupLf.style.visibility = 'visible';
                }
            });
            term.addEventListener('mouseleave', () => {
                infoPopupLf.style.opacity = '0';
                infoPopupLf.style.visibility = 'hidden';
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
            // Reset any quiz states if needed (setupQuiz already handles this on re-setup)
        });
    }

    // Setup clickable terms after DOM is ready
    setupClickableTerms();

    // Initial state (will be handled by overlay click)
    // showModuleContent('intro'); // This is now called after overlay click
});