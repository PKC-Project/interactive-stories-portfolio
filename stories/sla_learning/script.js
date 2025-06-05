document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Overlay & Audio Start ---
    const clickToStartOverlay = document.getElementById('click-to-start-overlay-sla');
    const startAudioButton = document.getElementById('start-audio-button-sla');
    const storybookContainer = document.getElementById('storybook-container-sla');

    // --- Course Map Elements ---
    const moduleNodes = document.querySelectorAll('.module-node'); // All clickable circles on the map
    
    // --- Dynamic Content Panel Elements ---
    const moduleContents = { // Map module IDs to their content divs
        'intro': document.getElementById('module-content-intro'),
        'module0': document.getElementById('module-content-module0'),
        'module1': document.getElementById('module-content-module1'),
        'module2': document.getElementById('module-content-module2'),
        'module3': document.getElementById('module-content-module3'),
        'module4': document.getElementById('module-content-module4'),
        'module5': document.getElementById('module-content-module5'),
        'module6': document.getElementById('module-content-module6'),
        'module7': document.getElementById('module-content-module7'),
        'module8': document.getElementById('module-content-module8')
    };

    // --- Buttons & Inputs ---
    const startExplorationBtn = document.getElementById('start-exploration-btn');
    const resetCourseBtn = document.getElementById('reset-course-btn');
    const hubReturnButton = document.querySelector('.hub-return-button');
    const quizAreas = document.querySelectorAll('.quiz-area');

    // Clickable terms for info popups
    const clickableTerms = document.querySelectorAll('.clickable-term');
    const infoPopupSla = document.getElementById('info-popup-sla');


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

    const Q = 0.25; const H = 0.5; const W = 1.0; // Note durations
    const moduleMusicSLA = { // LLM to generate these based on module descriptions
        'intro': { overallVolume: 0.08, notes: [{ freq: 440, duration: H, delay: 0, type: 'sine' }, { freq: 523.25, duration: H, delay: H, type: 'sine' }, { freq: 659.25, duration: W, delay: H*2, type: 'sine' }]}, // Welcoming
        'module0': { overallVolume: 0.08, notes: [{ freq: 440, duration: H, delay: 0, type: 'sine' }, { freq: 523.25, duration: H, delay: H, type: 'sine' }, { freq: 659.25, duration: W, delay: H*2, type: 'sine' }]}, // Welcoming
        'module1': { overallVolume: 0.09, notes: [{ freq: 261.63, duration: Q, delay: 0, type: 'triangle' }, { freq: 329.63, duration: Q, delay: Q, type: 'triangle' }, { freq: 392.00, duration: H, delay: 2*Q, type: 'triangle' }]}, // Foundational
        'module2': { overallVolume: 0.1, notes: [{ freq: 196.00, duration: Q, type: 'square' }, { freq: 207.65, duration: H, delay: Q, type: 'square' }]}, // Slightly dissonant / error
        'module3': { overallVolume: 0.08, notes: [{ freq: 220.00, duration: W, type: 'sine', volMultiplier: 0.7}, { freq: 329.63, duration: W, delay: 0, type: 'sine', volMultiplier: 0.7}, { freq: 440.00, duration: W, delay: 0, type: 'sine', volMultiplier: 0.7}]}, // Abstract Chord
        'module4': { overallVolume: 0.09, notes: [{ freq: 293.66, duration: Q, delay: 0, type: 'sawtooth'}, { freq: 329.63, duration: Q, delay: Q}, { freq: 349.23, duration: H, delay: 2*Q}]}, // Evolving/Developing
        'module5': { overallVolume: 0.1, notes: [{ freq: 261.63, duration: Q, delay: 0, type: 'square'}, { freq: 293.66, duration: Q, delay: Q}, { freq: 329.63, duration: Q, delay: 2*Q}, { freq: 349.23, duration: Q, delay: 3*Q}]}, // Steps/Sequence
        'module6': { overallVolume: 0.08, notes: [{ freq: 392.00, duration: Q, delay: 0, type: 'triangle'}, { freq: 392.00, duration: Q, delay: H, type: 'triangle'}]}, // Call and response
        'module7': { overallVolume: 0.1, notes: [{ freq: 220, duration: Q, type: 'sine'}, { freq: 277.18, duration: Q, delay: Q, type: 'square'}, { freq: 329.63, duration: Q, delay: 2*Q, type: 'sawtooth'}, { freq: 369.99, duration: Q, delay: 3*Q, type: 'triangle'}]}, // Diverse textures
        'module8': { overallVolume: 0.11, notes: [{ freq: 261.63, duration: Q, delay: 0, type: 'sine'}, { freq: 329.63, duration: Q, delay: Q, type: 'sine'}, { freq: 392.00, duration: H, delay: 2*Q, type: 'sine'}]} // Resolved, practical
    };
    const quizSuccessJingle = { overallVolume: 0.15, notes: [{ freq: 659.25, duration: Q }, { freq: 783.99, duration: H, delay: Q * 1.1 }] }; // E5 G5
    const quizFailureJingle = { overallVolume: 0.1, notes: [{ freq: 130.81, duration: H, type: 'sawtooth' }] }; // C3


    // --- Content Display Logic ---
    let currentModuleId = 'intro';

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
        if (moduleMusicSLA[currentModuleId]) {
            playNoteSequence(moduleMusicSLA[currentModuleId]);
        }

        // Update active module on SVG map
        moduleNodes.forEach(node => {
            node.classList.remove('current-module');
            if (node.id === moduleIdToShow) {
                node.classList.add('current-module');
            }
        });
        // Hide any active popups
        if(infoPopupSla) infoPopupSla.style.opacity = '0';
    }

    // --- Quiz Logic ---
    const quizAnswers = {
        'quiz-area-module0': "How individuals learn a language after their native one.",
        'quiz-area-module1': "False",
        'quiz-area-module2': "False",
        'quiz-area-module3': "There's an optimal time window for language acquisition.",
        'quiz-area-module4': "False",
        'quiz-area-module5': "True",
        'quiz-area-module6': "False",
        'quiz-area-module7': "False",
        'quiz-area-module8': "False"
    };

    quizAreas.forEach(area => {
        const options = area.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.addEventListener('click', (event) => {
                const selectedOption = event.target;
                const quizAreaId = selectedOption.closest('.quiz-area').id;
                const correctAnswer = quizAnswers[quizAreaId];
                const feedbackDiv = area.querySelector('.quiz-feedback');
                
                // Disable all options in this quiz area
                area.querySelectorAll('.quiz-option').forEach(opt => opt.disabled = true);

                if (selectedOption.dataset.answer === correctAnswer) {
                    selectedOption.classList.add('correct');
                    if (feedbackDiv) feedbackDiv.textContent = "Correct! Well done.";
                    playNoteSequence(quizSuccessJingle);
                } else {
                    selectedOption.classList.add('incorrect');
                    if (feedbackDiv) feedbackDiv.textContent = "Not quite. The correct answer is highlighted.";
                    playNoteSequence(quizFailureJingle);
                    // Highlight correct answer
                    area.querySelectorAll('.quiz-option').forEach(opt => {
                        if (opt.dataset.answer === correctAnswer) {
                            opt.classList.add('correct');
                        }
                    });
                }
            });
        });
    });

    function resetQuizzes() {
        quizAreas.forEach(area => {
            area.querySelectorAll('.quiz-option').forEach(opt => {
                opt.classList.remove('correct', 'incorrect');
                opt.disabled = false;
            });
            const feedbackDiv = area.querySelector('.quiz-feedback');
            if (feedbackDiv) feedbackDiv.textContent = "";
        });
    }


    // --- SVG Clickable Terms (Info Popups) ---
    function setupClickableTerms() {
        if (!infoPopupSla) return;
        clickableTerms.forEach(term => {
            term.addEventListener('mousemove', (e) => {
                const info = term.dataset.termInfo;
                if (info) {
                    infoPopupSla.textContent = info;
                    // Position popup near mouse, relative to viewport
                    infoPopupSla.style.left = (e.clientX + 15) + 'px';
                    infoPopupSla.style.top = (e.clientY - 20) + 'px'; // Position slightly above cursor
                    infoPopupSla.style.opacity = '1';
                    infoPopupSla.style.visibility = 'visible';
                }
            });
            term.addEventListener('mouseleave', () => {
                infoPopupSla.style.opacity = '0';
                infoPopupSla.style.visibility = 'hidden';
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
                showModuleContent('intro'); // Show the initial intro content
            }, 500); // Match CSS transition
        });
    } else { // Fallback for direct load
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
            showModuleContent('intro');
            resetQuizzes();
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
});