document.addEventListener('DOMContentLoaded', () => {

    const quizContainer = document.getElementById('quiz-container');
    const quizCard = document.getElementById('quiz-card');
    const questionPrompt = document.getElementById('question-prompt');
    const stimulusContainer = document.getElementById('stimulus-container');
    const answerArea = document.getElementById('answer-area');
    const progressBar = document.getElementById('progress-bar');
    const scoreDisplay = document.getElementById('score-display');
    const resultsScreen = document.getElementById('results-screen');
    const finalScore = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-quiz-btn');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackText = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    
    class QuizEngine {
        constructor(questions) {
            this.questions = questions;
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.isAnswering = false; // Prevents multiple clicks
            this.audio = this.setupAudio();
            nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        }

        setupAudio() {
            const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            return {
                play: (type) => {
                    if (!audioCtx || audioCtx.state === 'suspended') { audioCtx.resume(); }
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain).connect(audioCtx.destination);
                    const now = audioCtx.currentTime;
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    if (type === 'correct') {
                        osc.type = 'sine'; osc.frequency.setValueAtTime(880, now);
                    } else {
                        osc.type = 'square'; osc.frequency.setValueAtTime(120, now);
                    }
                    osc.start(now); osc.stop(now + 0.3);
                }
            };
        }

        start() {
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.isAnswering = false;
            resultsScreen.classList.remove('active');
            resultsScreen.classList.add('hidden');
            quizCard.style.display = 'block';
            if (quizCard.classList.contains('is-flipped')) {
                quizCard.classList.remove('is-flipped');
            }
            this.updateUI();
            this.renderQuestion();
        }

        renderQuestion() {
            this.isAnswering = false;
            stimulusContainer.innerHTML = '';
            stimulusContainer.style.flexWrap = 'nowrap';
            answerArea.innerHTML = '';
            const question = this.questions[this.currentQuestionIndex];
            questionPrompt.textContent = question.prompt;
            this.questionRenderers[question.type].call(this, question);
        }
        
        handleAnswer(isCorrect, feedback, selectedElement = null) {
            if (this.isAnswering) return;
            this.isAnswering = true;
            
            if (isCorrect) {
                this.score++;
                this.audio.play('correct');
                feedbackTitle.textContent = "Correct!";
                feedbackTitle.className = 'correct';
                if(selectedElement) selectedElement.classList.add('correct-answer');
            } else {
                this.audio.play('incorrect');
                feedbackTitle.textContent = "Not Quite...";
                feedbackTitle.className = 'incorrect';
                if(selectedElement) selectedElement.classList.add('incorrect-answer');
            }
            feedbackText.innerHTML = feedback;
            
            setTimeout(() => {
                quizCard.classList.add('is-flipped');
            }, 800);
        }
        
        nextQuestion() {
            this.currentQuestionIndex++;
            quizCard.classList.remove('is-flipped');
            
            setTimeout(() => {
                this.updateUI();
                if (this.currentQuestionIndex < this.questions.length) {
                    this.renderQuestion();
                } else {
                    this.showResults();
                }
            }, 600);
        }

        updateUI() {
            scoreDisplay.textContent = `Score: ${this.score}`;
            const progress = ((this.currentQuestionIndex) / this.questions.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        showResults() {
            quizCard.style.display = 'none';
            finalScore.textContent = `${this.score} / ${this.questions.length}`;
            resultsScreen.classList.remove('hidden');
            resultsScreen.classList.add('active');
        }

        questionRenderers = {
            brushstrokeID: (question) => {
                stimulusContainer.style.flexWrap = 'wrap';
                question.data.options.forEach((option, index) => {
                    const optionEl = document.createElement('div');
                    optionEl.className = 'brushstroke-option';
                    optionEl.innerHTML = document.getElementById(option.svgId).outerHTML;
                    stimulusContainer.appendChild(optionEl);
                    optionEl.addEventListener('click', () => {
                        const isCorrect = (index === question.data.correctIndex);
                        const feedback = isCorrect ? question.data.feedback.correct : question.data.feedback.incorrect;
                        if (!isCorrect) { stimulusContainer.children[question.data.correctIndex].classList.add('correct-answer'); }
                        this.handleAnswer(isCorrect, feedback, optionEl);
                    });
                });
            },
            paletteCompletion: (question) => {
                stimulusContainer.innerHTML = document.getElementById(question.data.sceneSvgId).outerHTML;
                question.data.choices.forEach((color, index) => {
                    const swatch = document.createElement('div');
                    swatch.className = 'palette-swatch';
                    swatch.style.backgroundColor = color;
                    answerArea.appendChild(swatch);
                    swatch.addEventListener('click', () => {
                        document.getElementById('q2-sky-fill-area').style.fill = color;
                        const isCorrect = (index === question.data.correctIndex);
                        const feedback = isCorrect ? question.data.feedback.correct : question.data.feedback.incorrect;
                        if (!isCorrect) { answerArea.children[question.data.correctIndex].classList.add('correct-answer'); }
                        this.handleAnswer(isCorrect, feedback, swatch);
                    });
                });
            },
            compositionHunt: (question) => {
                stimulusContainer.innerHTML = document.getElementById(question.data.sceneSvgId).outerHTML;
                stimulusContainer.querySelectorAll('.hotspot').forEach(hotspot => {
                    hotspot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isCorrect = hotspot.dataset.correct === 'true';
                        hotspot.style.fill = isCorrect ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
                        const feedback = isCorrect ? question.data.feedback.correct : question.data.feedback.incorrect;
                        if (!isCorrect) { stimulusContainer.querySelector('[data-correct="true"]').style.fill = 'rgba(76, 175, 80, 0.5)'; }
                        this.handleAnswer(isCorrect, feedback);
                    });
                });
            }
        }
    }

    const vanGoghQuizData = [
        {
            type: 'brushstrokeID',
            prompt: 'Which of these brushstrokes demonstrates the "impasto" technique characteristic of Van Gogh?',
            data: {
                options: [ { svgId: 'q1-sfumato-stroke' }, { svgId: 'q1-van-gogh-stroke' }, { svgId: 'q1-pointillism-stroke' }, { svgId: 'q1-cubist-stroke' }, ],
                correctIndex: 1,
                feedback: {
                    correct: "Exactly! <strong>Impasto</strong> is a technique where paint is laid on so thickly that it stands out from the surface. Van Gogh used this to convey immense texture and emotion.",
                    incorrect: "Not quite. The correct answer uses <strong>Impasto</strong>, a technique with thick, visible texture. The others show different styles like soft blending or dots."
                }
            }
        },
        {
            type: 'paletteCompletion',
            prompt: 'Select the color that best completes this Van Gogh-inspired night sky.',
            data: {
                sceneSvgId: 'q2-night-sky-scene',
                choices: ['#ADD8E6', '#0047AB', '#40E0D0', '#5F9EA0'],
                correctIndex: 1,
                feedback: {
                    correct: "Perfect. Van Gogh famously used vibrant, deep blues like <strong>Cobalt Blue</strong> in his night scenes to convey a sense of sublime, spiritual energy, often contrasted with brilliant yellows.",
                    incorrect: "While a nice color, Van Gogh's night skies were known for their deep, intense blues to express powerful emotions, not just to depict the sky realistically. <strong>Cobalt Blue</strong> was one of his favorites."
                }
            }
        },
        {
            type: 'compositionHunt',
            prompt: "Click on the element that best demonstrates Van Gogh's use of dynamic, swirling lines to convey energy.",
            data: {
                sceneSvgId: 'q3-composition-scene',
                feedback: {
                    correct: "Precisely. Van Gogh rendered natural forces like the sun and wind with <strong>powerful, swirling lines</strong> to give his landscapes an intense, almost alive sense of energy and movement.",
                    incorrect: "While other elements are part of his style, the <strong>swirling energy in the sky and sun</strong> is the most direct representation of his unique dynamism in this image."
                }
            }
        }
    ];

    const quiz = new QuizEngine(vanGoghQuizData);
    restartBtn.addEventListener('click', () => quiz.start());
    quiz.start();
});