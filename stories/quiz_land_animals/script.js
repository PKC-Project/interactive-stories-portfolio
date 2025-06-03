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
    
    // --- LLM TASK: Generate this questions array - FOCUS ON LAND ANIMALS, SVG & AUDIO ---
    // Animal list: Lion, Elephant, Giraffe, Monkey, Tiger, Bear, Wolf, Fox, Deer, Kangaroo
    const questions = [
        {
            animal: 'Lion',
            questionText: "Listen to this sound. Which big cat known as the 'King of the Jungle' makes it?",
            mediaType: 'audio',
            mediaContent: { // Simplified Roar
                overallVolume: 0.2,
                notes: [
                    { freq: 100, duration: 0.5, delay: 0, type: 'sawtooth', volMultiplier: 1.2 },
                    { freq: 120, duration: 0.8, delay: 0.3, type: 'sawtooth', volMultiplier: 1.5, slideTo: 90 }, // Freq slide down
                    { freq: 90,  duration: 0.5, delay: 1.0, type: 'sawtooth', volMultiplier: 1.0 }
                ]
            },
            options: ["Tiger", "Lion", "Jaguar"],
            correctAnswer: "Lion",
            feedbackCorrect: "Correct! That's the mighty roar of a lion!",
            feedbackIncorrect: "Not quite! That powerful roar belongs to the lion."
        },
        {
            animal: 'Elephant',
            questionText: "This SVG shows a distinctive feature of which large land mammal?",
            mediaType: 'svg',
            // LLM Task: Generate SVG of an elephant's trunk and large ears (simplified)
            mediaContent: `<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="#e0e0e0"/><path d="M50 10 C 40 30, 45 60, 35 65 S 50 60, 50 40" fill="#a0a0a0" stroke="#707070" stroke-width="2"/> <path d="M20 15 Q 40 5, 50 30 T 20 45 Z" fill="#c0c0c0"/> <path d="M80 15 Q 60 5, 50 30 T 80 45 Z" fill="#c0c0c0"/></svg>`,
            options: ["Rhinoceros", "Hippopotamus", "Elephant"],
            correctAnswer: "Elephant",
            feedbackCorrect: "That's right! The trunk and large ears are key elephant features.",
            feedbackIncorrect: "Think of an animal known for its long trunk and big ears."
        },
        {
            animal: 'Giraffe',
            questionText: "Which animal, known for its extremely long neck, is depicted in this simple SVG?",
            mediaType: 'svg',
            // LLM Task: Generate SVG of a giraffe's silhouette or long neck and head
            mediaContent: `<svg viewBox="0 0 50 100"><rect width="50" height="100" fill="#F5F5DC"/><path d="M25 90 L25 30 L35 15 L30 5 L20 5 L15 15 L25 30" fill="#FFC107"/><ellipse cx="27.5" cy="10" rx="3" ry="2" fill="#6D4C41"/></svg>`,
            options: ["Zebra", "Giraffe", "Ostrich"],
            correctAnswer: "Giraffe",
            feedbackCorrect: "Correct! That long neck is unmistakable.",
            feedbackIncorrect: "Look for the animal with the tallest reach!"
        },
        {
            animal: 'Monkey',
            questionText: "This playful sound often comes from which agile, tree-dwelling primate?",
            mediaType: 'audio',
            mediaContent: { // Simplified chattering/hoot
                overallVolume: 0.1,
                notes: [
                    { freq: 600, duration: 0.08, delay: 0, type: 'square', volMultiplier: 1 }, { freq: 650, duration: 0.08, delay: 0.1, type: 'square', volMultiplier: 1 },
                    { freq: 580, duration: 0.08, delay: 0.2, type: 'square', volMultiplier: 1 }, { freq: 620, duration: 0.08, delay: 0.3, type: 'square', volMultiplier: 1 }
                ]
            },
            options: ["Squirrel", "Monkey", "Lemur"],
            correctAnswer: "Monkey",
            feedbackCorrect: "You got it! That's a monkey sound.",
            feedbackIncorrect: "Think of a primate known for its chattering and climbing."
        },
        {
            animal: 'Tiger',
            questionText: "These stripes in the SVG are a famous marking of which large feline predator?",
            mediaType: 'svg',
            // LLM Task: Generate SVG showing only orange background with black stripes
            mediaContent: `<svg viewBox="0 0 100 50"><rect width="100" height="50" fill="#FFA500"/><path d="M10 0 V50 M30 0 V50 M50 0 V50 M70 0 V50 M90 0 V50" stroke="black" stroke-width="8"/></svg>`,
            options: ["Leopard", "Jaguar", "Tiger"],
            correctAnswer: "Tiger",
            feedbackCorrect: "Correct! Tigers are famous for their unique stripe patterns.",
            feedbackIncorrect: "Consider a large cat with bold, dark stripes on an orange coat."
        }
        // LLM: Add 5 more questions for Bear, Wolf, Fox, Deer, Kangaroo, varying mediaType (SVG/Audio)
        // Bear: SVG of a paw print / Audio: Low growl
        // Wolf: SVG of a howling silhouette / Audio: Howl
        // Fox: SVG of a bushy tail / Audio: Short yip/bark
        // Deer: SVG of antlers / Text question about habitat
        // Kangaroo: SVG of a jumping silhouette / Text question about pouches
    ];

    function initAudioContext() { /* ... (same as previous quiz script) ... */ 
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }
    function stopAllSounds() { /* ... (same as previous quiz script) ... */
        currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
        currentOscillators = [];
    }
    function playNoteSequence(notesConfig) { /* ... (same as previous quiz script, ensure it handles slideTo for roar) ... */
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
            if (note.slideTo) { // For frequency slides like roars
                oscillator.frequency.linearRampToValueAtTime(note.slideTo, now + (note.delay || 0) + note.duration * 0.8);
            }

            gainNode.gain.setValueAtTime(0, now + (note.delay || 0));
            gainNode.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02);
            gainNode.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + note.duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + note.duration);
            
            oscillator.start(now + (note.delay || 0));
            oscillator.stop(now + (note.delay || 0) + note.duration + 0.1);
            currentOscillators.push(oscillator);
        });
    }

    function displayQuestion() { /* ... (largely same as previous quiz script) ... */
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

        if (q.mediaType === 'svg' && q.mediaContent) {
            mediaDisplayArea.innerHTML = q.mediaContent; 
        } else if (q.mediaType === 'audio' && q.mediaContent) {
            const playBtn = document.createElement('button');
            playBtn.innerHTML = ' Play Animal Sound'; // Speaker icon
            playBtn.classList.add('play-audio-btn');
            playBtn.onclick = (e) => {
                e.target.disabled = true; 
                playNoteSequence(q.mediaContent);
                let totalDuration = q.mediaContent.notes.reduce((max, note) => Math.max(max, (note.delay || 0) + note.duration), 0) + 0.5;
                if (totalDuration < 1) totalDuration = 1; // Minimum 1s disable
                setTimeout(() => { e.target.disabled = false; }, totalDuration * 1000);
            };
            mediaDisplayArea.appendChild(playBtn);
        } else {
            mediaPlaceholderTextEl.style.display = 'block';
            mediaPlaceholderTextEl.textContent = "No visual/audio clue for this one!";
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

    function checkAnswer(selectedOption, buttonEl) { /* ... (same as previous quiz script) ... */
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

    function showResults() { /* ... (same as previous quiz script, maybe change messages) ... */
        questionArea.style.display = 'none';
        feedbackArea.style.display = 'none';
        nextQuestionBtn.style.display = 'none';
        resultsArea.style.display = 'block';

        finalScoreEl.textContent = score;
        totalQuestionsEl.textContent = questions.length;
        let percentage = (score / questions.length) * 100;
        let message = "";
        if (percentage >= 80) message = "Amazing! You're a true animal expert!";
        else if (percentage >= 50) message = "Great job! You know your safari animals!";
        else message = "Good effort! Keep learning about the animal kingdom!";
        resultMessageEl.textContent = message;
    }

    nextQuestionBtn.addEventListener('click', () => { /* ... (same) ... */
        currentQuestionIndex++;
        displayQuestion();
    });
    restartQuizBtn.addEventListener('click', () => { /* ... (same) ... */
        currentQuestionIndex = 0;
        score = 0;
        scoreEl.textContent = score;
        displayQuestion();
    });
    backToHubBtn.addEventListener('click', () => { /* ... (same) ... */
        window.location.href = '../../index.html'; 
    });

    displayQuestion(); // Initialize Quiz
});