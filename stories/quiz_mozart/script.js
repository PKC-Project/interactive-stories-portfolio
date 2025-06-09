document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const elements = {
        quizCard: document.getElementById('quiz-card'),
        questionPrompt: document.getElementById('question-prompt'),
        stimulusContainer: document.getElementById('stimulus-container'),
        answerArea: document.getElementById('answer-area'),
        progressBar: document.getElementById('progress-bar'),
        scoreDisplay: document.getElementById('score-display'),
        resultsScreen: document.getElementById('results-screen'),
        finalScore: document.getElementById('final-score'),
        restartBtn: document.getElementById('restart-quiz-btn'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackIcon: document.getElementById('feedback-icon'),
        feedbackTitleText: document.getElementById('feedback-title-text'),
        feedbackText: document.getElementById('feedback-text'),
        nextQuestionBtn: document.getElementById('next-question-btn'),
    };
    
    // --- Audio Synthesis Engine ---
    class AudioEngine {
        constructor() { this.audioCtx = null; this.activeNodes = []; }
        _init() { if (!this.audioCtx) { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } if (this.audioCtx.state === 'suspended') { this.audioCtx.resume(); } }
        createNote(freq, startTime, duration, instrument, volume) {
            const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.9);
            osc.connect(gain).connect(this.audioCtx.destination);
            if (instrument === 'piano') osc.type = 'triangle';
            else if (instrument === 'harpsichord') { osc.type = 'sawtooth'; gain.gain.setValueAtTime(volume * 0.5, startTime); gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15); }
            osc.frequency.setValueAtTime(freq, startTime);
            osc.start(startTime); osc.stop(startTime + duration);
            this.activeNodes.push(osc);
        }
        playMelody(options = {}) {
            this._init(); this.stopAll();
            const { melody = [], duration = 0.2, instrument = 'piano', tempo = 0.25, accompaniment = false } = options;
            melody.forEach((note, index) => {
                const startTime = this.audioCtx.currentTime + index * tempo;
                if (note) this.createNote(note, startTime, duration, instrument, 0.2);
            });
            if (accompaniment) {
                const bassNotes = [261.63, 392.00, 329.63, 392.00];
                for (let i = 0; i < melody.length * 2; i++) {
                    this.createNote(bassNotes[i % bassNotes.length], this.audioCtx.currentTime + i * (tempo / 2), tempo / 2, 'piano', 0.05);
                }
            }
        }
        playChordProgression(options = {}) {
            this._init(); this.stopAll();
            const { progression = [], duration = 0.4, instrument = 'piano' } = options;
            progression.forEach((chord, index) => {
                const startTime = this.audioCtx.currentTime + index * duration;
                chord.forEach(note => this.createNote(note, startTime, duration, instrument, 0.15));
            });
        }
        stopAll() { this.activeNodes.forEach(node => node.stop()); this.activeNodes = []; }
    }
    const audio = new AudioEngine();

    // --- Core QuizEngine ---
    class QuizEngine {
        constructor(questions) {
            this.questions = questions;
            this.currentQuestionIndex = 0; this.score = 0; this.isAnswering = false;
            elements.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        }

        start() {
            this.currentQuestionIndex = 0; this.score = 0; this.isAnswering = false;
            
            // --- FIX: Ensure results screen is hidden and quiz card is visible on start ---
            elements.resultsScreen.classList.remove('active');
            elements.resultsScreen.classList.add('hidden');
            elements.quizCard.style.display = 'block';
            
            elements.quizCard.classList.remove('is-flipped');
            this.updateUI();
            this.renderQuestion();
        }

        renderQuestion() {
            this.isAnswering = false;
            elements.stimulusContainer.innerHTML = '';
            elements.answerArea.innerHTML = '';
            const question = this.questions[this.currentQuestionIndex];
            elements.questionPrompt.textContent = question.prompt;
            this.questionRenderers[question.type].call(this, question);
        }
        
        handleAnswer(selectedIndex) {
            if (this.isAnswering) return;
            this.isAnswering = true;
            audio.stopAll();

            const question = this.questions[this.currentQuestionIndex];
            const isCorrect = selectedIndex === question.data.correctIndex;
            const feedback = isCorrect ? question.data.feedback.correct : question.data.options[selectedIndex].feedback;
            
            const answerButtons = elements.answerArea.querySelectorAll('.answer-btn');
            answerButtons.forEach((btn, index) => {
                btn.classList.add('disabled-option');
                if (index === selectedIndex) {
                    btn.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');
                }
            });

            if (isCorrect) {
                this.score++;
                elements.feedbackTitle.className = 'correct';
                elements.feedbackTitleText.textContent = "Correct!";
            } else {
                elements.feedbackTitle.className = 'incorrect';
                elements.feedbackTitleText.textContent = "Not Quite...";
            }
            elements.feedbackText.innerHTML = feedback;
            
            setTimeout(() => {
                elements.quizCard.classList.add('is-flipped');
            }, 800);
        }
        
        nextQuestion() {
            this.currentQuestionIndex++;
            elements.quizCard.classList.remove('is-flipped');
            setTimeout(() => {
                this.updateUI();
                if (this.currentQuestionIndex < this.questions.length) {
                    this.renderQuestion();
                } else {
                    // --- FIX: Call the function to show results ---
                    this.showResults();
                }
            }, 600);
        }

        updateUI() {
            elements.scoreDisplay.textContent = `Score: ${this.score}`;
            if (this.score > 0 && this.currentQuestionIndex > 0) {
                elements.scoreDisplay.classList.add('score-pop');
                setTimeout(() => elements.scoreDisplay.classList.remove('score-pop'), 300);
            }
            elements.progressBar.style.width = `${((this.currentQuestionIndex) / this.questions.length) * 100}%`;
        }

        // --- FIX: Correctly implemented showResults function ---
        showResults() {
            // Hide the main quiz card
            elements.quizCard.style.display = 'none';
            
            // Populate the final score
            elements.finalScore.textContent = `${this.score} / ${this.questions.length}`;
            
            // Display the results screen with an animation
            elements.resultsScreen.classList.remove('hidden');
            elements.resultsScreen.classList.add('active');
        }

        // --- Question Type Renderers ---
        questionRenderers = {
            stylisticID: function(q) {
                q.data.options.forEach((option, index) => {
                    const player = document.createElement('div');
                    player.className = 'music-player';
                    player.innerHTML = `<svg class="play-btn-icon"><use href="#icon-play"/></svg><span>${option.label}</span>`;
                    elements.stimulusContainer.appendChild(player);
                    player.addEventListener('click', () => {
                        if (this.isAnswering) return;
                        audio.playMelody(option.audio);
                        document.querySelectorAll('.music-player').forEach(p => p.classList.remove('playing'));
                        player.classList.add('playing');
                    });
                    const answerBtn = document.createElement('button');
                    answerBtn.className = 'answer-btn';
                    answerBtn.textContent = `Select ${option.label}`;
                    elements.answerArea.appendChild(answerBtn);
                    answerBtn.addEventListener('click', () => this.handleAnswer(index));
                });
            },
            instrumentID: function(q) {
                const mainPlayer = document.createElement('div');
                mainPlayer.className = 'cadence-player';
                mainPlayer.innerHTML = `<h4>Listen to the Instrument</h4><svg class="play-btn-icon"><use href="#icon-play"/></svg>`;
                elements.stimulusContainer.appendChild(mainPlayer);
                mainPlayer.addEventListener('click', () => { if (!this.isAnswering) audio.playMelody(q.data.audio); });
                q.data.options.forEach((choice, index) => {
                    const iconBtn = document.createElement('div');
                    iconBtn.className = 'instrument-icon';
                    iconBtn.innerHTML = `${document.getElementById(choice.svgId).outerHTML}<span>${choice.label}</span>`;
                    elements.answerArea.appendChild(iconBtn);
                    iconBtn.addEventListener('click', () => {
                        if (this.isAnswering) return;
                        this.isAnswering = true;
                        const isCorrect = (index === q.data.correctIndex);
                        const feedback = isCorrect ? q.data.feedback.correct : choice.feedback;
                        elements.answerArea.querySelectorAll('.instrument-icon').forEach(el => el.classList.add('disabled-option'));
                        iconBtn.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');
                        if (isCorrect) { this.score++; elements.feedbackTitle.className = 'correct'; elements.feedbackTitleText.textContent = "Correct!"; } 
                        else { elements.feedbackTitle.className = 'incorrect'; elements.feedbackTitleText.textContent = "Not Quite..."; }
                        elements.feedbackText.innerHTML = feedback;
                        setTimeout(() => { elements.quizCard.classList.add('is-flipped'); }, 800);
                    });
                });
            },
            cadenceID: function(q) {
                q.data.options.forEach((option, index) => {
                    const player = document.createElement('div');
                    player.className = 'cadence-player';
                    player.innerHTML = `<h4>Listen to ${option.label}</h4><svg class="play-btn-icon"><use href="#icon-play"/></svg>`;
                    elements.stimulusContainer.appendChild(player);
                    player.addEventListener('click', () => {
                        if (this.isAnswering) return;
                        audio.playChordProgression(option.audio);
                        document.querySelectorAll('.cadence-player').forEach(p => p.classList.remove('playing'));
                        player.classList.add('playing');
                    });
                    const answerBtn = document.createElement('button');
                    answerBtn.className = 'answer-btn';
                    answerBtn.textContent = `Select ${option.label}`;
                    elements.answerArea.appendChild(answerBtn);
                    answerBtn.addEventListener('click', () => this.handleAnswer(index));
                });
            }
        };
    }

    // --- Quiz Data ---
    const mozartQuizData = [
        {
            type: 'stylisticID',
            prompt: 'Which of these melodies is composed in the elegant, balanced style of Mozart?',
            data: {
                options: [
                    { label: 'Melody A', audio: { melody: [523.25, 493.88, 523.25, 440.00, 523.25, 493.88, 523.25, 440.00], instrument: 'harpsichord' }, feedback: 'This sounds more like the intricate, mathematical style of Baroque composers like Bach.' },
                    { label: 'Melody B', audio: { melody: [392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00], tempo: 0.2, accompaniment: true }, feedback: '' },
                    { label: 'Melody C', audio: { melody: [261.63, 261.63, 261.63, 207.65], tempo: 0.1, duration: 0.8 }, feedback: "This has the powerful, dramatic tone often associated with later Romantic composers like Beethoven." },
                ],
                correctIndex: 1,
                feedback: { correct: 'Correct! Mozart\'s music is known for its clarity, balance, and elegant melodies, often using structures like the Alberti bass accompaniment.' }
            }
        },
        {
            type: 'instrumentID',
            prompt: 'The melody is being played on which of these keyboard instruments?',
            data: {
                options: [
                    { label: 'Harpsichord', svgId: 'icon-harpsichord', feedback: '' },
                    { label: 'Piano', svgId: 'icon-piano', feedback: 'This is a modern Piano. Notice the richer, more sustained tone compared to the Harpsichord.' },
                ],
                audio: { melody: [523.25, 587.33, 659.25, 698.46, 783.99], tempo: 0.2, instrument: 'harpsichord' },
                correctIndex: 0,
                feedback: { correct: 'Correct! The <strong>Harpsichord</strong>, with its distinct plucked-string sound, was a cornerstone of the Baroque and early Classical periods before the piano became dominant.' }
            }
        },
        {
            type: 'cadenceID',
            prompt: "A 'cadence' is a musical ending. Which of these two endings sounds 'finished' and resolved?",
            data: {
                options: [
                    { label: 'Ending A', audio: { progression: [[261.63, 329.63, 392.00], [392.00, 493.88, 587.33]] }, feedback: "This is a 'Half Cadence' (I-V), which creates tension and feels like it needs to continue." }, // I -> V (Unresolved)
                    { label: 'Ending B', audio: { progression: [[392.00, 493.88, 587.33], [261.63, 329.63, 392.00]] }, feedback: '' }, // V -> I (Resolved)
                ],
                correctIndex: 1,
                feedback: { correct: "Correct! Ending B is a 'Perfect Cadence' (V-I), which resolves to the 'home' chord, giving a strong sense of finality." }
            }
        }
    ];

    const quiz = new QuizEngine(mozartQuizData);
    elements.restartBtn.addEventListener('click', () => quiz.start());
    quiz.start();
});