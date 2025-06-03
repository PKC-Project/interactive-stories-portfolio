document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-invaders'),
        document.getElementById('page2-invaders')
    ];
    // Navigation buttons
    const nextPage1Btn = document.getElementById('next-page1-invaders');
    const prevPage2Btn = document.getElementById('prev-page2-invaders');
    const restartGameBtn = document.getElementById('restart-game-invaders');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Game elements
    const gameBoard = document.getElementById('invaders-game-board');
    const scoreDisplay = document.getElementById('player-score-invaders');
    const livesDisplay = document.getElementById('player-lives-invaders');
    const gameOverMessageDisplay = document.getElementById('game-over-message');

    const SVG_NS = "http://www.w3.org/2000/svg";
    const BOARD_WIDTH = 400;
    const BOARD_HEIGHT = 300;

    let player, playerLaser;
    let invaders = [];
    let invaderLasers = []; // For future use if invaders shoot
    let score = 0;
    let lives = 3;
    let gameInterval;
    let gameRunning = false;
    let keysPressed = {};

    const PLAYER_WIDTH = 30;
    const PLAYER_HEIGHT = 15;
    const PLAYER_SPEED = 5;
    const LASER_SPEED = 7;
    const LASER_WIDTH = 3;
    const LASER_HEIGHT = 10;

    const INVADER_ROWS = 3;
    const INVADER_COLS = 6;
    const INVADER_WIDTH = 20;
    const INVADER_HEIGHT = 15;
    const INVADER_PADDING = 10;
    const INVADER_START_Y = 30;
    let invaderSpeedX = 1;
    let invaderSpeedY = 0; // Initially no downward movement
    let invaderGroupX = 30;
    let invaderGroupY = INVADER_START_Y;
    let invaderDirection = 1; // 1 for right, -1 for left
    let invaderDropDistance = 10;


    let audioContext;
    function initAudioContext() { /* ... (same as PONG) ... */ }
    function playSound(type) {
        if (!initAudioContext()) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        if (type === 'shoot') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
        } else if (type === 'invaderHit') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
        } else if (type === 'playerHit') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(110, audioContext.currentTime); // A2
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
        } else if (type === 'page1Load') {
            oscillator.type = 'sine'; // Marching sound
            oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
            setTimeout(() => { // Second beat
                 const osc2 = audioContext.createOscillator();
                 const gain2 = audioContext.createGain();
                 osc2.connect(gain2); gain2.connect(audioContext.destination);
                 osc2.type = 'sine'; osc2.frequency.setValueAtTime(100, audioContext.currentTime + 0.3);
                 gain2.gain.setValueAtTime(0.03, audioContext.currentTime + 0.3);
                 gain2.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
                 osc2.start(audioContext.currentTime + 0.3); osc2.stop(audioContext.currentTime + 0.5);
            }, 300);
        }
        oscillator.start();
        oscillator.stop(audioContext.currentTime + (type === 'shoot' ? 0.1 : type === 'invaderHit' ? 0.2 : 0.5) );
    }
    
    const pageMusicInvaders = {
        0: () => playSound('page1Load'),
        1: () => {} // Game sounds handled by game logic
    };

    let currentPageIndex = 0;
    let previousPageIndex = -1;
    function showPage(index) { /* ... (same as PONG, but use pageMusicInvaders) ... */
        if (index < 0 || index >= pages.length || !pages[index]) return;
        const goingForward = index > previousPageIndex;
        
        if (previousPageIndex !== -1 && pages[previousPageIndex]) {
            pages[previousPageIndex].classList.remove('current-page');
            // Using scale for invaders
            pages[previousPageIndex].classList.add(goingForward ? 'slide-out-up' : 'slide-out-down');
        }
        
        pages[index].classList.remove('slide-out-up', 'slide-out-down');
        pages[index].classList.add('current-page');
        
        currentPageIndex = index;
        previousPageIndex = index;

        // animateText(storyTexts[currentPageIndex]); // Assuming you add text elements with this class
        if (pageMusicInvaders[currentPageIndex]) {
            pageMusicInvaders[currentPageIndex]();
        }

        if (index === 1 && !gameRunning) {
            resetGame();
            startGameLoop();
        } else if (index !== 1 && gameRunning) {
            stopGameLoop();
        }
    }


    // --- Game Setup ---
    function createPlayer() {
        player = document.createElementNS(SVG_NS, 'rect');
        player.setAttribute('id', 'player-cannon');
        player.setAttribute('x', BOARD_WIDTH / 2 - PLAYER_WIDTH / 2);
        player.setAttribute('y', BOARD_HEIGHT - PLAYER_HEIGHT - 10);
        player.setAttribute('width', PLAYER_WIDTH);
        player.setAttribute('height', PLAYER_HEIGHT);
        player.setAttribute('fill', 'lime');
        // Simple cannon shape
        const cannonTop = document.createElementNS(SVG_NS, 'rect');
        cannonTop.setAttribute('x', parseFloat(player.getAttribute('x')) + PLAYER_WIDTH/2 - 3);
        cannonTop.setAttribute('y', parseFloat(player.getAttribute('y')) - 8);
        cannonTop.setAttribute('width', 6);
        cannonTop.setAttribute('height', 8);
        cannonTop.setAttribute('fill', 'lime');
        player.cannonTop = cannonTop; // Store reference

        gameBoard.appendChild(player);
        gameBoard.appendChild(cannonTop);
    }

    function createInvaders() {
        invaders = [];
        gameBoard.querySelectorAll('.invader').forEach(inv => inv.remove()); // Clear old ones

        for (let r = 0; r < INVADER_ROWS; r++) {
            for (let c = 0; c < INVADER_COLS; c++) {
                const invader = document.createElementNS(SVG_NS, 'rect');
                // Simple rect invader, LLM could make this more complex SVG group
                invader.setAttribute('class', 'invader');
                invader.setAttribute('x', invaderGroupX + c * (INVADER_WIDTH + INVADER_PADDING));
                invader.setAttribute('y', invaderGroupY + r * (INVADER_HEIGHT + INVADER_PADDING));
                invader.setAttribute('width', INVADER_WIDTH);
                invader.setAttribute('height', INVADER_HEIGHT);
                invader.setAttribute('fill', r % 2 === 0 ? 'cyan' : 'magenta'); // Alternate colors
                invader.isAlive = true;
                gameBoard.appendChild(invader);
                invaders.push(invader);
            }
        }
    }

    function createPlayerLaser() {
        if (playerLaser) return; // Only one laser at a time

        playerLaser = document.createElementNS(SVG_NS, 'rect');
        playerLaser.setAttribute('id', 'player-laser');
        playerLaser.setAttribute('x', parseFloat(player.getAttribute('x')) + PLAYER_WIDTH / 2 - LASER_WIDTH / 2);
        playerLaser.setAttribute('y', parseFloat(player.getAttribute('y')) - LASER_HEIGHT);
        playerLaser.setAttribute('width', LASER_WIDTH);
        playerLaser.setAttribute('height', LASER_HEIGHT);
        playerLaser.setAttribute('fill', 'red');
        gameBoard.appendChild(playerLaser);
        playSound('shoot');
    }

    // --- Game Logic ---
    function resetGame() {
        score = 0;
        lives = 3;
        invaderGroupX = 30;
        invaderGroupY = INVADER_START_Y;
        invaderDirection = 1;
        invaderSpeedX = 1; // Reset speed
        updateDisplay();
        if(player) player.remove(); // Remove old player if exists
        if(player && player.cannonTop) player.cannonTop.remove();
        if(playerLaser) playerLaser.remove(); playerLaser = null;
        createPlayer();
        createInvaders();
        gameOverMessageDisplay.textContent = "";
    }

    function updateDisplay() {
        scoreDisplay.textContent = score;
        livesDisplay.textContent = lives;
    }

    function movePlayer() {
        let playerX = parseFloat(player.getAttribute('x'));
        if (keysPressed['ArrowLeft'] && playerX > 0) {
            playerX -= PLAYER_SPEED;
        }
        if (keysPressed['ArrowRight'] && playerX < BOARD_WIDTH - PLAYER_WIDTH) {
            playerX += PLAYER_SPEED;
        }
        player.setAttribute('x', playerX);
        player.cannonTop.setAttribute('x', playerX + PLAYER_WIDTH/2 - 3);
    }

    function moveLaser() {
        if (playerLaser) {
            let laserY = parseFloat(playerLaser.getAttribute('y'));
            laserY -= LASER_SPEED;
            playerLaser.setAttribute('y', laserY);
            if (laserY < 0) { // Laser off screen
                playerLaser.remove();
                playerLaser = null;
            }
        }
    }

    function moveInvaders() {
        invaderGroupX += invaderSpeedX * invaderDirection;
        let hitWall = false;
        invaders.forEach(invader => {
            if (invader.isAlive) {
                let currentX = parseFloat(invader.getAttribute('x')) + invaderSpeedX * invaderDirection;
                invader.setAttribute('x', currentX);
                if (currentX <= 0 || currentX + INVADER_WIDTH >= BOARD_WIDTH) {
                    hitWall = true;
                }
            }
        });

        if (hitWall) {
            invaderDirection *= -1;
            invaderGroupY += invaderDropDistance; // Move down
            invaders.forEach(invader => {
                if (invader.isAlive) {
                    invader.setAttribute('y', parseFloat(invader.getAttribute('y')) + invaderDropDistance);
                }
            });
        }
    }
    
    function checkCollisions() {
        if (!playerLaser) return;
        let laserRect = playerLaser.getBoundingClientRect();

        invaders.forEach((invader, index) => {
            if (invader.isAlive) {
                let invaderRect = invader.getBoundingClientRect();
                // Simple AABB collision
                if (laserRect.left < invaderRect.right &&
                    laserRect.right > invaderRect.left &&
                    laserRect.top < invaderRect.bottom &&
                    laserRect.bottom > invaderRect.top) {
                    
                    invader.isAlive = false;
                    invader.setAttribute('visibility', 'hidden'); // Or remove()
                    playerLaser.remove();
                    playerLaser = null;
                    score += 10;
                    playSound('invaderHit');
                    updateDisplay();
                    return; // Laser can only hit one invader per frame
                }
            }
        });
    }
    
    function checkGameOver() {
        // Player loses if invaders reach player level
        let invadersReachedBottom = false;
        invaders.forEach(invader => {
            if (invader.isAlive && parseFloat(invader.getAttribute('y')) + INVADER_HEIGHT >= parseFloat(player.getAttribute('y'))) {
                invadersReachedBottom = true;
            }
        });
        if (invadersReachedBottom) {
            lives = 0; // Game over
        }

        if (lives <= 0) {
            gameOverMessageDisplay.textContent = "GAME OVER!";
            stopGameLoop();
            return true;
        }
        // Player wins if all invaders are destroyed
        if (invaders.every(inv => !inv.isAlive)) {
            gameOverMessageDisplay.textContent = "YOU WIN! WAVE CLEARED!";
            // For simplicity, we stop. Could go to next wave.
            invaderSpeedX += 0.5; // Make next wave faster
            invaderDropDistance += 2;
            stopGameLoop(); // Stop current loop, restart will create new wave
            return true;
        }
        return false;
    }


    function gameLoop() {
        if (!gameRunning) return;

        movePlayer();
        moveLaser();
        moveInvaders();
        checkCollisions();
        if(checkGameOver()) return; // Stop loop if game over

        requestAnimationFrame(gameLoop);
    }

    function startGameLoop() {
        if (!gameRunning) {
            gameRunning = true;
            gameBoard.focus(); // For keyboard events, though listener is on document
            requestAnimationFrame(gameLoop);
        }
    }
    function stopGameLoop() {
        gameRunning = false;
    }

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        keysPressed[event.key] = true;
        if (event.key === ' ' || event.key === 'Spacebar') {
            if (gameRunning && currentPageIndex === 1 && !playerLaser) { // Only shoot if game is running on page 2
                createPlayerLaser();
            }
            event.preventDefault(); // Prevent page scroll
        }
    });
    document.addEventListener('keyup', (event) => {
        keysPressed[event.key] = false;
    });

    // --- Attach Event Listeners ---
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => showPage(1));
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => showPage(0));
    if(restartGameBtn) restartGameBtn.addEventListener('click', () => {
        stopGameLoop();
        resetGame();
        startGameLoop();
    });
    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopGameLoop();
            window.location.href = '../../index.html';
        });
    });

    // --- Initial Page Load ---
    showPage(0);
});