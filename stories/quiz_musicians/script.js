document.addEventListener('DOMContentLoaded', () => {
    const questionNumberEl = document.getElementById('question-number');
    const mediaDisplayArea = document.getElementById('media-display-area');
    const mediaPlaceholderTextEl = document.getElementById('media-placeholder-text');
    const questionTextEl = document.getElementById('question-text');
    const answerOptionsEl = document.getElementById('answer-options');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackTextEl = document.getElementById('feedback-text');
    const scoreEl = document.getElementById('score');
    
    const resultsArea = document.getElementById('results-area');
    const finalScoreEl = document.getElementById('final-score');
    const totalQuestionsEl = document.getElementById('total-questions');
    const resultMessageEl = document.getElementById('result-message');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const backToHubBtn = document.getElementById('back-to-hub-btn');
    const questionArea = document.getElementById('question-area');

    let audioContext;
    let currentOscillators = [];
    let currentQuestionIndex = 0;
    let score = 0;
    
    const E = 0.125; const Q = 0.25; const H = 0.5; // Durations

    // --- LLM TASK: Generate this questions array - FOCUS ON MUSICIANS & AUDIO ---
    const questions = [
        {
            composerFocus: 'mozart',
            questionText: "This playful and elegant motif is characteristic of which composer's style?",
            mediaType: 'audio',
            mediaContent: { 
                overallVolume: 0.1,
                notes: [ // Simple Alberti-like figuration + melody
                    { freq: 261.63, duration: E, delay: 0*E, type: 'triangle'}, { freq: 392.00, duration: E, delay: 1*E, type: 'triangle'},
                    { freq: 329.63, duration: E, delay: 2*E, type: 'triangle'}, { freq: 392.00, duration: E, delay: 3*E, type: 'triangle'},
                    { freq: 523.25, duration: Q, delay: 0*E, type: 'sine', volMultiplier: 1.3}, 
                    { freq: 493.88, duration: Q, delay: 2*E, type: 'sine', volMultiplier: 1.3}
                ]
            },
            options: ["Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "Ludwig van Beethoven"],
            correctAnswer: "Wolfgang Amadeus Mozart",
            feedbackCorrect: "Correct! Mozart is known for his graceful and clear melodies.",
            feedbackIncorrect: "Not quite. This style is more typical of the Classical period's elegance."
        },
        {
            composerFocus: 'bach',
            questionText: "Listen to this short contrapuntal excerpt. Which Baroque master is renowned for such intricate polyphony?",
            mediaType: 'audio',
            mediaContent: {
                overallVolume: 0.08,
                notes: [ // Two simple independent lines
                    // Line 1
                    { freq: 261.63, duration: Q, delay: 0*Q, type: 'square', volMultiplier: 1},    // C4
                    { freq: 293.66, duration: Q, delay: 1*Q, type: 'square', volMultiplier: 1},    // D4
                    { freq: 329.63, duration: H, delay: 2*Q, type: 'square', volMultiplier: 1},    // E4
                    // Line 2 (starts slightly later)
                    { freq: 196.00, duration: Q, delay: 0.5*Q, type: 'sawtooth', volMultiplier: 0.8}, // G3
                    { freq: 174.61, duration: Q, delay: 1.5*Q, type: 'sawtooth', volMultiplier: 0.8}, // F3
                    { freq: 164.81, duration: H, delay: 2.5*Q, type: 'sawtooth', volMultiplier: 0.8}  // E3
                ]
            },
            options: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach"],
            correctAnswer: "Johann Sebastian Bach",
            feedbackCorrect: "Exactly! Bach was the ultimate master of counterpoint and polyphony.",
            feedbackIncorrect: "Incorrect. This interwoven melodic style is a hallmark of the Baroque era, particularly one composer."
        },
        {
            composerFocus: 'beethoven',
            questionText: "This motif, with its strong rhythmic drive and dynamic contrasts, is reminiscent of which composer's 'heroic' period?",
            mediaType: 'audio',
            mediaContent: { // Hint of 5th symphony opening
                overallVolume: 0.15, // Louder
                notes: [
                    { freq: 196.00, duration: E*0.7, delay: 0, type: 'sawtooth', volMultiplier: 1.5},     // G3
                    { freq: 196.00, duration: E*0.7, delay: E*0.8, type: 'sawtooth', volMultiplier: 1.5}, // G3
                    { freq: 196.00, duration: E*0.7, delay: E*1.6, type: 'sawtooth', volMultiplier: 1.5}, // G3
                    { freq: 155.56, duration: H * 1.1, delay: E*2.4, type: 'sawtooth', volMultiplier: 1.8}  // Eb3 (long, accented)
                ]
            },
            options: ["Johann Sebastian Bach", "Ludwig van Beethoven", "Wolfgang Amadeus Mozart"],
            correctAnswer: "Ludwig van Beethoven",
            feedbackCorrect: "Correct! Beethoven's music often features powerful rhythms and dramatic shifts.",
            feedbackIncorrect: "Consider a composer known for ushering in the Romantic era with dramatic force."
        },
        // LLM: Add 3-6 more questions, focusing on audio clues for these three composers.
        // Examples:
        // - Identify if a short chord progression is major or minor (LLM generates code for both).
        // - Which composer is known for extensive use of fugues? (Play a very simple fugal entry).
        // - This elegant piano arpeggio is typical of...? (LLM generates Alberti bass or similar).
        // - This sudden loud chord after a soft passage demonstrates what musical technique often used by Beethoven? (LLM generates dynamic contrast).
        {
            composerFocus: 'mozart',
            questionText: "This light, quick passage with clear phrasing is typical of which composer's operatic overtures?",
            mediaType: 'audio',
            mediaContent: {
                overallVolume: 0.09,
                notes: [
                    { freq: 523.25, duration: E, delay: 0*E, type: 'sine'}, { freq: 587.33, duration: E, delay: 1*E, type: 'sine'},
                    { freq: 659.25, duration: E, delay: 2*E, type: 'sine'}, { freq: 698.46, duration: E, delay: 3*E, type: 'sine'},
                    { freq: 783.99, duration: Q, delay: 4*E, type: 'sine'},
                ]
            },
            options: ["Bach", "Mozart", "Beethoven"],
            correctAnswer: "Mozart",
            feedbackCorrect: "Correct! Mozart's overtures often have this sparkling quality.",
            feedbackIncorrect: "Think of the composer famous for operas like 'The Marriage of Figaro'."
        },
        {
            composerFocus: 'bach',
            questionText: "The use of a walking bass line supporting interwoven melodies is a strong characteristic of whose music?",
            mediaType: 'audio',
            mediaContent: {
                overallVolume: 0.1,
                notes: [
                    // Walking Bass
                    { freq: 130.81, duration: Q, delay: 0*Q, type: 'square', volMultiplier: 0.9}, // C3
                    { freq: 146.83, duration: Q, delay: 1*Q, type: 'square', volMultiplier: 0.9}, // D3
                    { freq: 164.81, duration: Q, delay: 2*Q, type: 'square', volMultiplier: 0.9}, // E3
                    { freq: 174.61, duration: Q, delay: 3*Q, type: 'square', volMultiplier: 0.9}, // F3
                    // Simple melody on top
                    { freq: 329.63, duration: H, delay: 0*Q, type: 'triangle', volMultiplier: 1.1}, // E4
                    { freq: 392.00, duration: H, delay: 2*Q, type: 'triangle', volMultiplier: 1.1}, // G4
                ]
            },
            options: ["Beethoven", "Mozart", "Bach"],
            correctAnswer: "Bach",
            feedbackCorrect: "Yes! Bach masterfully used walking bass lines in his compositions.",
            feedbackIncorrect: "This technique is a staple of Baroque music, particularly by one of its greatest figures."
        }
    ];

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
        if (!initAudioContext() || !notesConfig || !notesConfig.notes) {
            console.warn("Audio context or notes config missing for playback.");
            return;
        }
        stopAllSounds();
        const now = audioContext.currentTime;
        const overallVolume = notesConfig.overallVolume || 0.1;

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

    function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            showResults();
            return;
        }

        const q = questions[currentQuestionIndex];
        questionArea.style.display = 'block';
        resultsArea.style.display = 'none';
        feedbackArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        mediaPlaceholderTextEl.style.display = 'none';


        questionNumberEl.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        questionTextEl.textContent = q.questionText;
        mediaDisplayArea.innerHTML = ''; 

        if (q.mediaType === 'audio' && q.mediaContent) {
            const playBtn = document.createElement('button');
            playBtn.innerHTML = '▶ Play Musical Clue'; // Play icon
            playBtn.classList.add('play-audio-btn');
            playBtn.onclick = (e) => {
                e.target.disabled = true; // Disable after one play or for a short duration
                playNoteSequence(q.mediaContent);
                setTimeout(() => { e.target.disabled = false; }, (q.mediaContent.notes.reduce((max, note) => Math.max(max, (note.delay || 0) + note.duration), 0) + 0.5) * 1000); // Re-enable after sound finishes
            };
            mediaDisplayArea.appendChild(playBtn);
        } else {
            mediaPlaceholderTextEl.style.display = 'block'; // Show if no media
        }


        answerOptionsEl.innerHTML = '';
        q.options.forEach((option) => {
            const button = document.createElement('button');
            button.classList.add('answer-btn');
            button.textContent = option;
            button.onclick = () => checkAnswer(option, button);
            answerOptionsEl.appendChild(button);
        });
    }

    function checkAnswer(selectedOption, buttonEl) {
        const q = questions[currentQuestionIndex];
        const buttons = answerOptionsEl.querySelectorAll('.answer-btn');
        buttons.forEach(btn => btn.disabled = true); 

        stopAllSounds(); 

        if (selectedOption === q.correctAnswer) {
            score++;
            scoreEl.textContent = score;
            buttonEl.classList.add('correct');
            feedbackTextEl.textContent = q.feedbackCorrect;
            feedbackArea.className = 'correct';
        } else {
            buttonEl.classList.add('incorrect');
            feedbackTextEl.textContent = q.feedbackIncorrect;
            feedbackArea.className = 'incorrect';
            buttons.forEach(btn => {
                if (btn.textContent === q.correctAnswer) {
                    btn.classList.add('correct');
                }
            });
        }
        feedbackArea.style.display = 'block';
        nextQuestionBtn.style.display = 'inline-block';
    }

    function showResults() {
        questionArea.style.display = 'none';
        feedbackArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        resultsArea.style.display = 'block';

        finalScoreEl.textContent = score;
        totalQuestionsEl.textContent = questions.length;
        let percentage = (score / questions.length) * 100;
        let message = "";
        if (percentage >= 80) message = "Bravo! A true maestro of musical knowledge!";
        else if (percentage >= 50) message = "Well played! You have a good ear for the classics!";
        else message = "Keep listening and exploring the world of music!";
        resultMessageEl.textContent = message;
    }

    nextQuestionBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion();
    });

    restartQuizBtn.addEventListener('click', () => {
        currentQuestionIndex = 0;
        score = 0;
        scoreEl.textContent = score;
        displayQuestion();
    });
    
    backToHubBtn.addEventListener('click', () => {
        window.location.href = '../../index.html'; 
    });

    displayQuestion();
});