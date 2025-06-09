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
        play(options = {}) {
            this._init(); this.stopAll();
            const { type = 'sax', notes = [], duration = 0.3, tempo = 0.3 } = options;
            notes.forEach((noteFreq, index) => {
                const startTime = this.audioCtx.currentTime + index * tempo;
                const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain(), filter = this.audioCtx.createBiquadFilter();
                if (type === 'sax') { osc.type = 'sawtooth'; filter.type = 'lowpass'; filter.frequency.value = 800; } 
                else if (type === 'harpsichord') { osc.type = 'sawtooth'; filter.type = 'highpass'; filter.frequency.value = 1000; }
                osc.frequency.setValueAtTime(noteFreq, startTime);
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                osc.connect(filter).connect(gain).connect(this.audioCtx.destination);
                osc.start(startTime); osc.stop(startTime + duration);
                this.activeNodes.push(osc);
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

            // --- FIX: Explicitly hide the results screen and show the quiz card on restart ---
            elements.resultsScreen.classList.remove('active');
            elements.resultsScreen.classList.add('hidden');
            elements.quizCard.style.display = 'flex'; // Use flex to match initial display property

            elements.quizCard.classList.remove('is-flipped');
            this.updateUI();
            this.renderQuestion();
        }

        renderQuestion() {
            this.isAnswering = false;
            elements.stimulusContainer.innerHTML = ''; elements.answerArea.innerHTML = '';
            const question = this.questions[this.currentQuestionIndex];
            elements.questionPrompt.textContent = question.prompt;
            this.questionRenderers[question.type].call(this, question);
        }
        
        handleAnswer(selectedIndex) {
            if (this.isAnswering) return; this.isAnswering = true; audio.stopAll();
            const question = this.questions[this.currentQuestionIndex];
            const isCorrect = selectedIndex === question.data.correctIndex;
            const feedback = isCorrect ? question.data.feedback.correct : question.data.options[selectedIndex].feedback;
            const choiceElements = elements.stimulusContainer.children;
            Array.from(choiceElements).forEach((el, index) => {
                el.classList.add('disabled-option');
                if (index === selectedIndex) {
                    el.classList.add(isCorrect ? 'correct-answer' : 'incorrect-answer');
                }
            });

            if (isCorrect) { this.score++; elements.feedbackTitle.className = 'correct'; elements.feedbackTitleText.textContent = "Correct!"; } 
            else { elements.feedbackTitle.className = 'incorrect'; elements.feedbackTitleText.textContent = "Not Quite..."; }
            elements.feedbackText.innerHTML = feedback;
            setTimeout(() => elements.quizCard.classList.add('is-flipped'), 800);
        }
        
        nextQuestion() {
            this.currentQuestionIndex++;
            elements.quizCard.classList.remove('is-flipped');
            setTimeout(() => {
                this.updateUI();
                if (this.currentQuestionIndex < this.questions.length) { this.renderQuestion(); } 
                else { this.showResults(); }
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
            elements.quizCard.style.display = 'none'; // Hide the quiz
            elements.finalScore.textContent = `${this.score} / ${this.questions.length}`;
            elements.resultsScreen.classList.remove('hidden'); // Show the results
            elements.resultsScreen.classList.add('active'); // Trigger fade-in animation
        }

        // --- Question Type Renderers ---
        questionRenderers = {
            visualChoiceID: function(q) {
                q.data.options.forEach((option, index) => {
                    const panel = document.createElement('div');
                    panel.className = 'visual-panel';
                    panel.innerHTML = option.svg;
                    elements.stimulusContainer.appendChild(panel);
                    panel.addEventListener('click', () => this.handleAnswer(index));
                });
            },
            audioVisualMatch: function(q) {
                elements.stimulusContainer.innerHTML = `<div class="visual-panel static">${q.data.visual}</div>`;
                q.data.options.forEach((option, index) => {
                    const player = document.createElement('div');
                    player.className = 'audio-player';
                    player.innerHTML = `<svg class="play-btn-icon"><use href="#icon-play"/></svg><span>${option.label}</span>`;
                    elements.answerArea.appendChild(player);
                    player.addEventListener('click', () => {
                        if (this.isAnswering) return;
                        audio.play(option.audio);
                        document.querySelectorAll('.audio-player').forEach(p => p.classList.remove('playing'));
                        player.classList.add('playing');
                    });
                });
                const answerBtn = document.createElement('button');
                answerBtn.className = 'answer-btn';
                answerBtn.textContent = `Confirm Selection`;
                elements.answerArea.appendChild(answerBtn)
                answerBtn.addEventListener('click', ()=>{
                    let selectedIndex = -1;
                    document.querySelectorAll('.audio-player').forEach((p,i)=>{
                        if(p.classList.contains('playing')) selectedIndex = i;
                    });
                    if(selectedIndex !== -1) this.handleAnswer(selectedIndex);
                });
            },
            colorPaletteID: function(q) {
                 q.data.options.forEach((option, index) => {
                    const swatch = document.createElement('div');
                    swatch.className = 'color-swatch visual-panel';
                    swatch.innerHTML = `<svg id="icon-swatch" viewBox="0 0 24 24"><path fill="${option.color}" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-1.39-1.54-2.3-3.48-2.3-5.49s.91-3.95 2.3-5.49c.24-.27.39-.62.39-1.01C13.5 3.67 12.83 3 12 3zm0 2.5c2.97 0 5.45 2.16 6.13 5-.68 2.84-3.16 5-6.13 5C9.03 15.5 6.55 13.34 5.87 10.5 6.55 7.66 9.03 5.5 12 5.5z"></path></svg>
                                      <span>${option.label}</span>`;
                    elements.stimulusContainer.appendChild(swatch);
                    swatch.addEventListener('click', () => this.handleAnswer(index));
                });
            }
        };
    }

    // --- Quiz Data ---
    const gothamQuizData = [
        {
            type: 'visualChoiceID',
            prompt: 'Art Deco is defined by its iconic motifs. Which of these patterns belongs on the grand elevator doors of the Spire of Gotham?',
            data: {
                options: [
                    { svg: '<svg viewBox="0 0 100 100"><g fill="none" stroke="#c09f52" stroke-width="5"><path d="M50 50 L10 10"/><path d="M50 50 L90 10"/><path d="M50 50 L10 90"/><path d="M50 50 L90 90"/><path d="M50 50 L50 10"/><path d="M50 50 L50 90"/><path d="M50 50 L10 50"/><path d="M50 50 L90 50"/></g></svg>', feedback: '' },
                    { svg: '<svg viewBox="0 0 100 100"><path d="M10 90 C 20 -20, 80 120, 90 10" stroke="#8c743d" stroke-width="5" fill="none"/></svg>', feedback: 'This flowing, organic curve is characteristic of Art Nouveau, a style that Art Deco rebelled against.' },
                    { svg: '<svg viewBox="0 0 100 100"><path d="M50,10 C90,10 90,90 50,90 C10,90 10,10 50,10 M30,30 C60,30 60,70 30,70" stroke="#8c743d" stroke-width="5" fill="none"/></svg>', feedback: 'This ornate scrollwork is typical of the Victorian or Damask style, which is much more detailed than the sleek Art Deco look.'}
                ],
                correctIndex: 0,
                feedback: { correct: 'Precisely! The **Sunburst** motif, with its bold geometry and radiant symmetry, is a quintessential element of the Art Deco style.' }
            }
        },
        {
            type: 'colorPaletteID',
            prompt: "The color palette of Art Deco is crucial to its identity. Which color does NOT belong in the Spire of Gotham's signature palette?",
            data: {
                options: [
                    { label: 'Gilded Gold', color: '#ffd700', feedback: 'Gilded and metallic colors like gold are fundamental to the luxurious feel of Art Deco.'},
                    { label: 'Midnight Blue', color: '#000033', feedback: 'Deep, high-contrast colors like midnight blue and black are classic backdrops in Art Deco design.'},
                    { label: 'Pastel Pink', color: '#ffc0cb', feedback: ''},
                    { label: 'Emerald Green', color: '#009b7d', feedback: 'Vibrant, rich jewel tones like emerald green and ruby red were frequently used as accent colors.'},
                ],
                correctIndex: 2,
                feedback: { correct: "You have a keen eye! **Pastel Pink**, with its soft and gentle feel, is more associated with the Rococo or 1950s aesthetics. Art Deco favors bold, high-contrast, and luxurious colors."}
            }
        },
        {
            type: 'audioVisualMatch',
            prompt: 'You are in the Spire\'s grand, echoing lobby. Which soundscape best captures the mood of the era?',
            data: {
                visual: '<svg viewBox="0 0 100 100"><path d="M50 10 L80 90 H20 Z" fill="#c09f52"/><rect x="45" y="50" width="10" height="40" fill="#1e272e"/></svg>',
                options: [
                     { label: 'Audio A', audio: { type: 'sax', notes: [349.23, 311.13, 261.63, 311.13], tempo: 0.6 }, feedback: ''},
                     { label: 'Audio B', audio: { type: 'harpsichord', notes: [523.25, 493.88, 523.25, 440, 523.25], tempo: 0.25 }, feedback: "This complex sound is from a harpsichord, typical of the earlier Baroque period, not the Jazz Age." },
                ],
                correctIndex: 0,
                feedback: { correct: "Exactly! The smooth, sophisticated, and rhythmic sounds of the **Jazz Age**, often featuring the saxophone, are the perfect sonic counterpart to the cool elegance of Art Deco." }
            }
        }
    ];

    const quiz = new QuizEngine(gothamQuizData);
    // --- FIX: Add the event listener for the restart button ---
    elements.restartBtn.addEventListener('click', () => quiz.start());
    quiz.start();
});