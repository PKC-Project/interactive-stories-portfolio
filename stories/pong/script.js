document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const pages = [
        document.getElementById('page1-pong'),
        document.getElementById('page2-pong')
    ];
    const storyTexts = [
        document.getElementById('text-page1-pong'),
        document.getElementById('text-page2-pong') // Though page 2 text is mostly instructions
    ];

    // Navigation buttons
    const nextPage1Btn = document.getElementById('next-page1-pong');
    const prevPage2Btn = document.getElementById('prev-page2-pong');
    const restartGameBtn = document.getElementById('restart-game-pong');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Game elements
    const gameBoard = document.getElementById('pong-game-board');
    const paddle1 = document.getElementById('paddle1');
    const paddle2 = document.getElementById('paddle2');
    const ball = document.getElementById('ball');
    const player1ScoreDisplay = document.getElementById('player1-score');
    const player2ScoreDisplay = document.getElementById('player2-score');
    const winnerMessageDisplay = document.getElementById('winner-message');


    let currentPageIndex = 0;
    let previousPageIndex = -1;
    let audioContext;
    let currentOscillators = [];

    // Game state
    const PADDLE_HEIGHT = 50;
    const PADDLE_WIDTH = 10; // As defined in SVG
    const BALL_SIZE = 10;    // As defined in SVG
    const BOARD_WIDTH = 450;
    const BOARD_HEIGHT = 300;
    const PADDLE_SPEED = 15;
    const WINNING_SCORE = 5;

    let ballX, ballY, ballSpeedX, ballSpeedY;
    let paddle1Y, paddle2Y;
    let player1Score, player2Score;
    let gameInterval;
    let gameRunning = false;

    // --- Audio Context and Sound Playback ---
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }
    function stopAllSounds() { /* ... (same as previous story) ... */ } // For page transition sounds
    function playSound(type) {
        if (!initAudioContext()) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // General volume

        if (type === 'paddleHit') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } else if (type === 'score') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'page1Load') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(110, audioContext.currentTime); // A2
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }
    
    const pageMusicPong = { // Simple sounds for page load
        0: () => playSound('page1Load'),
        1: () => {} // Game sounds handled by game logic
    };


    // --- Page Navigation & Text Animation ---
    function animateText(textElement) { /* ... (same as previous story) ... */ }
    function showPage(index) {
        if (index < 0 || index >= pages.length || !pages[index]) return;
        const goingForward = index > previousPageIndex;
        
        if (previousPageIndex !== -1 && pages[previousPageIndex]) {
            pages[previousPageIndex].classList.remove('current-page');
            pages[previousPageIndex].classList.add(goingForward ? 'slide-out-up' : 'slide-out-down');
        }
        
        pages[index].classList.remove('slide-out-up', 'slide-out-down');
        pages[index].classList.add('current-page');
        
        currentPageIndex = index;
        previousPageIndex = index;

        animateText(storyTexts[currentPageIndex]);
        if (pageMusicPong[currentPageIndex]) {
            pageMusicPong[currentPageIndex]();
        }

        if (index === 1 && !gameRunning) { // If navigating to game page and game not running
            resetGame();
            startGameLoop();
        } else if (index !== 1 && gameRunning) { // If navigating away from game page
            stopGameLoop();
        }
    }

    // --- PONG Game Logic ---
    function resetBall() {
        ballX = BOARD_WIDTH / 2 - BALL_SIZE / 2;
        ballY = BOARD_HEIGHT / 2 - BALL_SIZE / 2;
        // Randomize initial direction
        ballSpeedX = Math.random() > 0.5 ? 3 : -3; 
        ballSpeedY = Math.random() > 0.5 ? 2 : -2;
        if (Math.abs(ballSpeedY) < 1) ballSpeedY = Math.random() > 0.5 ? 1 : -1; // Ensure some Y movement
    }

    function resetGame() {
        paddle1Y = BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2;
        paddle2Y = BOARD_HEIGHT / 2 - PADDLE_HEIGHT / 2;
        player1Score = 0;
        player2Score = 0;
        updateScoreDisplay();
        resetBall();
        winnerMessageDisplay.textContent = "";
        if (paddle1 && paddle2 && ball) { // Ensure elements exist
            paddle1.setAttribute('y', paddle1Y);
            paddle2.setAttribute('y', paddle2Y);
            ball.setAttribute('x', ballX);
            ball.setAttribute('y', ballY);
        }
    }

    function updateScoreDisplay() {
        if(player1ScoreDisplay) player1ScoreDisplay.textContent = player1Score;
        if(player2ScoreDisplay) player2ScoreDisplay.textContent = player2Score;
    }

    function gameLoop() {
        if (!gameRunning || !paddle1 || !paddle2 || !ball) return;

        // Move ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Ball collision with top/bottom walls
        if (ballY <= 0 || ballY + BALL_SIZE >= BOARD_HEIGHT) {
            ballSpeedY *= -1;
            playSound('paddleHit'); // Use same sound for wall hit for simplicity
        }

        // Ball collision with paddle1 (left)
        if (ballX <= parseFloat(paddle1.getAttribute('x')) + PADDLE_WIDTH &&
            ballX >= parseFloat(paddle1.getAttribute('x')) && // Ensure it's not behind
            ballY + BALL_SIZE >= paddle1Y &&
            ballY <= paddle1Y + PADDLE_HEIGHT) {
            ballSpeedX *= -1.1; // Increase speed slightly, reverse direction
            ballX = parseFloat(paddle1.getAttribute('x')) + PADDLE_WIDTH; // Prevent sticking
            playSound('paddleHit');
        }

        // Ball collision with paddle2 (right)
        if (ballX + BALL_SIZE >= parseFloat(paddle2.getAttribute('x')) &&
            ballX + BALL_SIZE <= parseFloat(paddle2.getAttribute('x')) + PADDLE_WIDTH && // Ensure it's not behind
            ballY + BALL_SIZE >= paddle2Y &&
            ballY <= paddle2Y + PADDLE_HEIGHT) {
            ballSpeedX *= -1.1; // Increase speed slightly, reverse direction
            ballX = parseFloat(paddle2.getAttribute('x')) - BALL_SIZE; // Prevent sticking
            playSound('paddleHit');
        }

        // Scoring
        if (ballX < 0) { // Player 2 scores
            player2Score++;
            playSound('score');
            resetBall();
        } else if (ballX + BALL_SIZE > BOARD_WIDTH) { // Player 1 scores
            player1Score++;
            playSound('score');
            resetBall();
        }
        updateScoreDisplay();

        // Update ball position in SVG
        ball.setAttribute('x', ballX);
        ball.setAttribute('y', ballY);

        // Check for winner
        if (player1Score >= WINNING_SCORE) {
            winnerMessageDisplay.textContent = "Player 1 Wins!";
            stopGameLoop();
        } else if (player2Score >= WINNING_SCORE) {
            winnerMessageDisplay.textContent = "Player 2 Wins!";
            stopGameLoop();
        }

        if (gameRunning) {
            requestAnimationFrame(gameLoop);
        }
    }

    function startGameLoop() {
        if (!gameRunning) {
            gameRunning = true;
            requestAnimationFrame(gameLoop);
        }
    }
    function stopGameLoop() {
        gameRunning = false;
        if (gameInterval) { // Should not be needed with requestAnimationFrame
            clearInterval(gameInterval);
        }
    }

    // Keyboard controls for paddles
    const keysPressed = {};
    document.addEventListener('keydown', (event) => {
        keysPressed[event.key] = true;
    });
    document.addEventListener('keyup', (event) => {
        keysPressed[event.key] = false;
    });

    function handlePaddleMovement() {
        if (!gameRunning || !paddle1 || !paddle2) return;
        // Paddle 1 (Left)
        if (keysPressed['w'] || keysPressed['W']) {
            paddle1Y -= PADDLE_SPEED;
        }
        if (keysPressed['s'] || keysPressed['S']) {
            paddle1Y += PADDLE_SPEED;
        }
        // Paddle 2 (Right)
        if (keysPressed['ArrowUp']) {
            paddle2Y -= PADDLE_SPEED;
        }
        if (keysPressed['ArrowDown']) {
            paddle2Y += PADDLE_SPEED;
        }

        // Keep paddles within bounds
        paddle1Y = Math.max(0, Math.min(paddle1Y, BOARD_HEIGHT - PADDLE_HEIGHT));
        paddle2Y = Math.max(0, Math.min(paddle2Y, BOARD_HEIGHT - PADDLE_HEIGHT));

        paddle1.setAttribute('y', paddle1Y);
        paddle2.setAttribute('y', paddle2Y);

        if(gameRunning) requestAnimationFrame(handlePaddleMovement); // Keep listening for input
    }
    
    // Start listening for paddle movements when game page is active
    // This will be initiated when showPage(1) is called.
    // We need a separate loop for input handling that runs independently of gameLoop's main logic.
    function startGameInputHandling() {
        if(gameRunning) requestAnimationFrame(handlePaddleMovement);
    }


    // --- Attach Event Listeners ---
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(restartGameBtn) restartGameBtn.addEventListener('click', () => {
        stopGameLoop(); // Stop current loop if any
        resetGame();    // Reset scores and positions
        startGameLoop(); // Start new game
        startGameInputHandling(); // Ensure input handling is also restarted
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopGameLoop(); // Stop game if navigating away
            window.location.href = '../../index.html';
        });
    });

    // --- Initial Page Load ---
    showPage(0); 
    // The game loop and input handling will start when showPage(1) is called.
});