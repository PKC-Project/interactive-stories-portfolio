// script.js for The Endless Dungeon: Shadow of the Minotaur

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const svg = document.getElementById('dungeon-svg');
    const startButton = document.getElementById('start-button');
    const winMessage = document.getElementById('win-message');
    const loseMessage = document.getElementById('lose-message');

    // --- Game Constants ---
    const WIDTH = 50;
    const HEIGHT = 30;
    const TILE_SIZE = 16;
    const DIGGER_STEPS = 2500;
    const svgNS = "http://www.w3.org/2000/svg";

    // --- Game State ---
    let dungeonGrid = [];
    let player = { x: 0, y: 0, el: null };
    let exit = { x: 0, y: 0, el: null };
    let minotaur = { x: 0, y: 0, el: null };
    let gameState = 'idle'; // 'idle', 'playing', 'won', 'lost'

    // --- Dungeon Generation ---
    function generateDungeon() {
        // 1. Initialize grid full of walls
        let grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0));
        let digger = { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
        let floorTiles = [];

        // 2. Random Walk (Digger Algorithm)
        for (let i = 0; i < DIGGER_STEPS; i++) {
            if (grid[digger.y][digger.x] === 0) {
                grid[digger.y][digger.x] = 1; // Carve floor
                floorTiles.push({ x: digger.x, y: digger.y });
            }

            const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            const [dx, dy] = directions[Math.floor(Math.random() * 4)];

            digger.x = Math.max(1, Math.min(WIDTH - 2, digger.x + dx));
            digger.y = Math.max(1, Math.min(HEIGHT - 2, digger.y + dy));
        }

        // 3. Place entities
        const playerStart = floorTiles[0];
        const exitPos = floorTiles[floorTiles.length - 1];
        
        // Find a distant spot for the Minotaur
        let minotaurStart = null;
        for (let i = Math.floor(floorTiles.length / 2); i < floorTiles.length; i++) {
            const pos = floorTiles[i];
            const distToPlayer = Math.abs(pos.x - playerStart.x) + Math.abs(pos.y - playerStart.y);
            const distToExit = Math.abs(pos.x - exitPos.x) + Math.abs(pos.y - exitPos.y);
            if (distToPlayer > 15 && distToExit > 15) {
                minotaurStart = pos;
                break;
            }
        }
        // Fallback if no ideal spot is found
        if (!minotaurStart) {
            minotaurStart = floorTiles[Math.floor(floorTiles.length / 2)];
        }

        return { grid, playerStart, exitPos, minotaurStart };
    }

    // --- Rendering ---
    function drawDungeon() {
        svg.innerHTML = ''; // Clear previous dungeon

        // Draw grid
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const rect = document.createElementNS(svgNS, 'rect');
                rect.setAttribute('x', x * TILE_SIZE);
                rect.setAttribute('y', y * TILE_SIZE);
                rect.setAttribute('width', TILE_SIZE);
                rect.setAttribute('height', TILE_SIZE);
                rect.setAttribute('class', dungeonGrid[y][x] === 1 ? 'floor' : 'wall');
                svg.appendChild(rect);
            }
        }
        
        // Draw entities
        [player, exit, minotaur].forEach(entityData => {
            const textEl = document.createElementNS(svgNS, 'text');
            const entityType = entityData === player ? 'player' : entityData === exit ? 'exit' : 'minotaur';
            textEl.textContent = entityType === 'player' ? '@' : entityType === 'exit' ? '>' : 'M';
            textEl.setAttribute('id', entityType);
            textEl.setAttribute('class', 'entity');
            entityData.el = textEl;
            updateEntityPosition(entityData);
            svg.appendChild(textEl);
        });
    }
    
    function updateEntityPosition(entity) {
        if (!entity.el) return;
        const centerX = entity.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = entity.y * TILE_SIZE + TILE_SIZE / 2;
        entity.el.setAttribute('x', centerX);
        entity.el.setAttribute('y', centerY);
    }
    
    // --- Game Logic ---
    function startGame() {
        winMessage.classList.add('hidden');
        loseMessage.classList.add('hidden');

        const dungeonData = generateDungeon();
        dungeonGrid = dungeonData.grid;
        player = { ...player, ...dungeonData.playerStart };
        exit = { ...exit, ...dungeonData.exitPos };
        minotaur = { ...minotaur, ...dungeonData.minotaurStart };

        drawDungeon();
        gameState = 'playing';
    }

    function processPlayerMove(dx, dy) {
        if (gameState !== 'playing') return;

        const targetX = player.x + dx;
        const targetY = player.y + dy;

        if (dungeonGrid[targetY][targetX] === 1) { // Is it a floor?
            player.x = targetX;
            player.y = targetY;
            updateEntityPosition(player);

            if (player.x === exit.x && player.y === exit.y) {
                endGame('won');
            } else {
                processMinotaurMove(); // Minotaur moves after player
            }
        }
    }

    function processMinotaurMove() {
        const dx = player.x - minotaur.x;
        const dy = player.y - minotaur.y;
        
        let moveX = 0, moveY = 0;

        // Simple hunting AI
        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = Math.sign(dx);
        } else {
            moveY = Math.sign(dy);
        }
        
        // Check primary move
        if (dungeonGrid[minotaur.y + moveY][minotaur.x + moveX] === 1) {
            minotaur.x += moveX;
            minotaur.y += moveY;
        } else { // Primary blocked, try secondary
             if (Math.abs(dx) > Math.abs(dy)) { // Tried horizontal, now try vertical
                 moveY = Math.sign(dy);
                 if (dungeonGrid[minotaur.y + moveY][minotaur.x] === 1) minotaur.y += moveY;
             } else { // Tried vertical, now try horizontal
                 moveX = Math.sign(dx);
                 if (dungeonGrid[minotaur.y][minotaur.x + moveX] === 1) minotaur.x += moveX;
             }
        }
        
        updateEntityPosition(minotaur);

        if (minotaur.x === player.x && minotaur.y === player.y) {
            endGame('lost');
        }
    }

    function endGame(outcome) {
        gameState = outcome;
        if (outcome === 'won') {
            winMessage.classList.remove('hidden');
        } else if (outcome === 'lost') {
            loseMessage.classList.remove('hidden');
        }
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);
    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp': processPlayerMove(0, -1); break;
            case 'ArrowDown': processPlayerMove(0, 1); break;
            case 'ArrowLeft': processPlayerMove(-1, 0); break;
            case 'ArrowRight': processPlayerMove(1, 0); break;
        }
    });

    // --- Initial Load ---
    startGame();
});