document.addEventListener('DOMContentLoaded', () => {
    const questionNumberEl = document.getElementById('question-number');
    const mediaDisplayArea = document.getElementById('media-display-area');
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

    let currentQuestionIndex = 0;
    let score = 0;

    // --- LLM TASK: Generate this questions array - FOCUS ON PAINTERS & SVG ---
    const questions = [
        {
            artistFocus: 'van_gogh',
            questionText: "This SVG uses swirling strokes and vibrant yellows. Which painter's style is it emulating?",
            mediaType: 'svg',
            mediaContent: `<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="#0033A0"/><path d="M10 60 C 20 10, 30 70, 40 20 C 50 -10, 60 60, 70 15" stroke="#FFD700" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="85" cy="15" r="8" fill="#FFFF00"/></svg>`,
            options: ["Leonardo da Vinci", "Frida Kahlo", "Vincent van Gogh"],
            correctAnswer: "Vincent van Gogh",
            feedbackCorrect: "Correct! Those are hallmarks of Van Gogh's expressive style.",
            feedbackIncorrect: "Not quite. Think of intense colors and dynamic brushwork."
        },
        {
            artistFocus: 'leonardo_da_vinci',
            questionText: "This SVG attempts to show a soft, hazy blending of outlines, a technique famously used by which Renaissance master?",
            mediaType: 'svg',
            mediaContent: `<svg viewBox="0 0 100 70"><defs><filter id="sfumatoEffect"><feGaussianBlur in="SourceGraphic" stdDeviation="2"/></filter></defs><rect width="100" height="70" fill="#EADDCA"/><ellipse cx="50" cy="35" rx="20" ry="25" fill="#D2B48C" filter="url(#sfumatoEffect)"/><path d="M40 30 Q50 40 60 30" stroke="#8B4513" stroke-width="1" filter="url(#sfumatoEffect)" fill="none"/></svg>`, // Simplified sfumato
            options: ["Vincent van Gogh", "Leonardo da Vinci", "Frida Kahlo"],
            correctAnswer: "Leonardo da Vinci",
            feedbackCorrect: "Precisely! That's Leonardo's 'sfumato' technique.",
            feedbackIncorrect: "Incorrect. This technique is known for its smoky, soft edges."
        },
        {
            artistFocus: 'frida_kahlo',
            questionText: "The prominent eyebrows and floral elements in this SVG are iconic symbols associated with which painter?",
            mediaType: 'svg',
            mediaContent: `<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="#F5E6CC"/><path d="M 30,30 Q 50,20 70,30 L 65,35 Q 50,27 35,35 Z" fill="#3A3A3A"/><ellipse cx="50" cy="15" rx="6" ry="9" fill="#FF69B4" /><ellipse cx="40" cy="12" rx="5" ry="8" fill="#FF1493" /><ellipse cx="60" cy="12" rx="5" ry="8" fill="#FF1493" /></svg>`,
            options: ["Frida Kahlo", "Vincent van Gogh", "Leonardo da Vinci"],
            correctAnswer: "Frida Kahlo",
            feedbackCorrect: "Correct! Frida Kahlo often depicted herself with these strong features and adornments.",
            feedbackIncorrect: "Think of powerful self-portraits and Mexican cultural symbols."
        },
        {
            artistFocus: 'van_gogh',
            questionText: "Which common subject for Van Gogh is represented by this simplified SVG?",
            mediaType: 'svg',
            mediaContent: `<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="#F0E68C" /><circle cx="50" cy="35" r="15" fill="#A0522D" /><ellipse cx="50" cy="15" rx="7" ry="15" fill="#FFD700" transform="rotate(0 50 35)"/><ellipse cx="50" cy="15" rx="7" ry="15" fill="#FFA500" transform="rotate(45 50 35)"/><ellipse cx="50" cy="15" rx="7" ry="15" fill="#FFD700" transform="rotate(90 50 35)"/><ellipse cx="50" cy="15" rx="7" ry="15" fill="#FFA500" transform="rotate(135 50 35)"/></svg>`, // Simplified Sunflower
            options: ["Irises", "Cypress Trees", "Sunflowers"],
            correctAnswer: "Sunflowers",
            feedbackCorrect: "Yes! Van Gogh painted many famous series of Sunflowers.",
            feedbackIncorrect: "While he painted those too, this SVG is more representative of another famous floral subject."
        },
        {
            artistFocus: 'leonardo_da_vinci',
            questionText: "This SVG depicts a mirrored script, a characteristic often associated with which artist's notebooks?",
            mediaType: 'svg',
            mediaContent: `<svg viewBox="0 0 100 30"><rect width="100" height="30" fill="#fdf5e6"/><text x="50" y="20" font-family="Arial, sans-serif" font-size="12" fill="#5C4033" text-anchor="middle" transform="scale(-1, 1) translate(-100, 0)">oD oicniV</text></svg>`,
            options: ["Michelangelo", "Raphael", "Leonardo da Vinci"],
            correctAnswer: "Leonardo da Vinci",
            feedbackCorrect: "Correct! Leonardo often wrote in mirror script in his private notebooks.",
            feedbackIncorrect: "This unique writing style is a famous trait of one of these Renaissance masters."
        },
        {
            artistFocus: 'frida_kahlo',
            questionText: "This SVG includes a heart and thorn-like elements. Which painter frequently used such personal and sometimes painful symbolism?",
            mediaType: 'svg',
            mediaContent: `<svg viewBox="0 0 100 70"><rect width="100" height="70" fill="#FFCCCB" /><path d="M50 30 L45 50 L55 50 Z" fill="#DC143C" /><line x1="40" y1="60" x2="60" y2="60" stroke="#5C3317" stroke-width="3"/><line x1="45" y1="55" x2="45" y2="65" stroke="#5C3317" stroke-width="2"/><line x1="55" y1="55" x2="55" y2="65" stroke="#5C3317" stroke-width="2"/></svg>`,
            options: ["Georgia O'Keeffe", "Frida Kahlo", "Mary Cassatt"],
            correctAnswer: "Frida Kahlo",
            feedbackCorrect: "Yes! Frida Kahlo's art is renowned for its deeply personal and often visceral symbolism.",
            feedbackIncorrect: "Consider an artist known for raw, autobiographical paintings filled with potent symbols."
        }
        // LLM: Add 1-3 more questions to reach 6-9 total, focusing on visual identification.
    ];

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

        questionNumberEl.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        questionTextEl.textContent = q.questionText;
        mediaDisplayArea.innerHTML = ''; 

        if (q.mediaType === 'svg' && q.mediaContent) {
            mediaDisplayArea.innerHTML = q.mediaContent; 
        } else {
            mediaDisplayArea.innerHTML = '<p>Visual hint for this question.</p>'; // Fallback
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
        if (percentage >= 80) message = "Excellent! You have a keen eye for art!";
        else if (percentage >= 50) message = "Well done! You know your painters!";
        else message = "A good start! Keep exploring the fascinating world of art!";
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

    displayQuestion(); // Initialize Quiz
});