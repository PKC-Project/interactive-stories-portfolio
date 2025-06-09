document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const healthDisplay = document.getElementById('health-display');
    const essenceDisplay = document.getElementById('essence-display');
    const waveDisplay = document.getElementById('wave-display');
    const towerBtns = document.querySelectorAll('.tower-btn');
    const nextWaveBtn = document.getElementById('next-wave-btn');
    const gameOverPanel = document.getElementById('game-over-panel');
    const restartBtn = document.getElementById('restart-btn');

    const gridSize = 40;
    canvas.width = 20 * gridSize;
    canvas.height = 15 * gridSize;
    
    let path = [];
    let enemies = [];
    let towers = [];
    let projectiles = [];
    let effects = []; // For visual effects like the Cryo Spire's attack
    let health = 20;
    let essence = 1000;
    let wave = 0;
    let selectedTower = null;
    let waveInProgress = false;

    class AudioEngine {
        constructor() {
            this.audioCtx = null;
        }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        play(sound) {
            if (!this.audioCtx) return;
            const now = this.audioCtx.currentTime;
            
            if (sound === 'pulse') {
                const osc = this.audioCtx.createOscillator(); osc.type = 'sine';
                const gain = this.audioCtx.createGain();
                osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain).connect(this.audioCtx.destination); osc.start(now); osc.stop(now + 0.2);
            } else if (sound === 'cryo') {
                const osc = this.audioCtx.createOscillator(); osc.type = 'sawtooth';
                const gain = this.audioCtx.createGain(); const lfo = this.audioCtx.createOscillator(); lfo.frequency.value = 20;
                const lfoGain = this.audioCtx.createGain(); lfoGain.gain.value = 10; lfo.connect(lfoGain).connect(osc.frequency);
                osc.frequency.setValueAtTime(100, now);
                gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain).connect(this.audioCtx.destination); osc.start(now); lfo.start(now); osc.stop(now+0.3); lfo.stop(now+0.3);
            } else if (sound === 'hit') {
                const osc = this.audioCtx.createOscillator(); osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain).connect(this.audioCtx.destination); osc.start(now); osc.stop(now + 0.1);
            } else if (sound === 'damage') {
                const osc = this.audioCtx.createOscillator(); osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
                const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.connect(gain).connect(this.audioCtx.destination); osc.start(now); osc.stop(now + 0.5);
            }
        }
    }
    const audio = new AudioEngine();
    
    function generateEnemyPath() {
        const gridW = canvas.width / gridSize;
        const gridH = canvas.height / gridSize;
        let y = Math.floor(gridH / 2);
        const newPath = [{ x: 0 * gridSize + gridSize / 2, y: y * gridSize + gridSize / 2 }];
        
        const visited = new Set([`0,${y}`]);
        let x = 0;

        while (x < gridW - 1) {
            const directions = [];
            if (!visited.has(`${x + 1},${y}`)) directions.push('right', 'right', 'right');
            if (y > 0 && !visited.has(`${x},${y - 1}`)) directions.push('up');
            if (y < gridH - 1 && !visited.has(`${x},${y + 1}`)) directions.push('down');

            const move = directions.length > 0 ? directions[Math.floor(Math.random() * directions.length)] : 'right';

            if (move === 'right') x++;
            else if (move === 'up') y--;
            else if (move === 'down') y++;
            
            visited.add(`${x},${y}`);
            newPath.push({ x: x * gridSize + gridSize / 2, y: y * gridSize + gridSize / 2 });
        }
        return newPath;
    }

    class Enemy {
        constructor(hp, speed) {
            this.pathIndex = 0;
            this.x = path[0].x;
            this.y = path[0].y;
            this.w = 20;
            this.h = 20;
            this.hp = hp;
            this.maxHp = hp;
            this.speed = speed;
            this.baseSpeed = speed;
            this.slowUntil = 0;
        }
        draw() {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--enemy-color');
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.h / 2);
            ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
            ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
            ctx.closePath();
            ctx.fill();
            // Health bar
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - this.w / 2, this.y - this.h - 5, this.w, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - this.w / 2, this.y - this.h - 5, this.w * (this.hp / this.maxHp), 3);
        }
        update() {
            this.speed = (Date.now() < this.slowUntil) ? this.baseSpeed * 0.5 : this.baseSpeed;

            if (this.pathIndex < path.length - 1) {
                const target = path[this.pathIndex + 1];
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < this.speed) {
                    this.pathIndex++;
                } else {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
            } else {
                health--;
                this.hp = 0; // Mark for removal
                audio.play('damage');
            }
        }
    }

    class Tower {
        constructor(x, y, range, fireRate) {
            this.x = x;
            this.y = y;
            this.range = range;
            this.fireRate = fireRate;
            this.cooldown = 0;
        }
        findTarget() {
            let target = null;
            let maxPathIndex = -1;
            for (const enemy of enemies) {
                const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
                if (dist <= this.range && enemy.pathIndex > maxPathIndex) {
                    target = enemy;
                    maxPathIndex = enemy.pathIndex;
                }
            }
            return target;
        }
        update() {
            this.cooldown = Math.max(0, this.cooldown - 1);
        }
    }

    class PulseCannon extends Tower {
        constructor(x, y) { super(x, y, 120, 60); this.damage = 30; }
        draw() {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pulse-tower');
            ctx.beginPath();
            ctx.arc(this.x, this.y, gridSize / 2 - 5, 0, Math.PI * 2);
            ctx.fill();
        }
        update() {
            super.update();
            if (this.cooldown === 0) {
                const target = this.findTarget();
                if (target) {
                    projectiles.push(new Projectile(this.x, this.y, target, this.damage));
                    this.cooldown = this.fireRate;
                    audio.play('pulse');
                }
            }
        }
    }
    
    class CryoEffect {
        constructor(x, y, range) {
            this.x = x; this.y = y; this.range = range;
            this.duration = 20; this.life = this.duration;
            this.hp = 1;
        }
        draw() {
            const progress = this.life / this.duration;
            ctx.fillStyle = `rgba(3, 169, 244, ${0.3 * progress})`;
            ctx.strokeStyle = `rgba(179, 229, 252, ${0.8 * progress})`;
            ctx.lineWidth = 2; ctx.beginPath();
            ctx.arc(this.x, this.y, this.range * (1 - progress), 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
        }
        update() {
            this.life--;
            if(this.life <= 0) this.hp = 0;
        }
    }

    class CryoSpire extends Tower {
        constructor(x, y) { super(x, y, 90, 100); }
        draw() {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--cryo-tower');
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - gridSize / 2 + 5);
            ctx.lineTo(this.x - gridSize / 2 + 5, this.y + gridSize / 2 - 5);
            ctx.lineTo(this.x + gridSize / 2 - 5, this.y + gridSize / 2 - 5);
            ctx.closePath();
            ctx.fill();
        }
        update() {
            super.update();
            if (this.cooldown === 0) {
                const target = this.findTarget();
                if (target) {
                    enemies.forEach(enemy => {
                        const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
                        if(dist <= this.range) enemy.slowUntil = Date.now() + 2000;
                    });
                    effects.push(new CryoEffect(this.x, this.y, this.range));
                    this.cooldown = this.fireRate;
                    audio.play('cryo');
                }
            }
        }
    }

    class Projectile {
        constructor(x, y, target, damage) {
            this.x = x; this.y = y; this.target = target;
            this.damage = damage; this.speed = 5; this.hp = 1;
        }
        draw() {
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
        }
        update() {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < this.speed || this.target.hp <= 0) {
                if (this.target.hp > 0) this.target.hp -= this.damage;
                this.hp = 0; audio.play('hit');
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
    }

    function spawnWave() {
        wave++; waveInProgress = true; nextWaveBtn.disabled = true;
        const enemyCount = wave * 5 + 5;
        const hp = 50 + wave * 10;
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => { enemies.push(new Enemy(hp, 1.5)); }, i * 500);
        }
    }

    function updateUI() {
        healthDisplay.textContent = health; essenceDisplay.textContent = essence;
        waveDisplay.textContent = wave;
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line');
        for (let x=0;x<canvas.width;x+=gridSize){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
        for (let y=0;y<canvas.height;y+=gridSize){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
        
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--path-color');
        ctx.lineWidth = gridSize; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
        for(let i = 1; i < path.length; i++){ ctx.lineTo(path[i].x, path[i].y); }
        ctx.stroke(); ctx.lineWidth = 1;

        towers.forEach(t => { t.update(); t.draw(); });
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.update(); enemy.draw();
            if (enemy.hp <= 0) {
                if(health > 0) essence += 5;
                enemies.splice(i, 1);
            }
        }
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.update(); p.draw();
            if (p.hp <= 0) projectiles.splice(i, 1);
        }

        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];
            effect.update();
            effect.draw();
            if (effect.hp <= 0) {
                effects.splice(i, 1);
            }
        }
        
        if (waveInProgress && enemies.length === 0) {
            waveInProgress = false; nextWaveBtn.disabled = false;
            essence += 50 + wave * 10;
        }

        updateUI();

        if (health <= 0) {
            gameOverPanel.classList.remove('hidden');
            nextWaveBtn.classList.add('hidden');
        } else {
            requestAnimationFrame(gameLoop);
        }
    }
    
    function init() {
        path = generateEnemyPath();
        updateUI();
        gameLoop();
        
        towerBtns.forEach(btn => btn.addEventListener('click', () => {
            towerBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTower = { type: btn.dataset.towerType, cost: parseInt(btn.dataset.cost) };
            audio._init();
        }));

        canvas.addEventListener('click', (e) => {
            if (!selectedTower || essence < selectedTower.cost) return;
            
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const xGrid = Math.floor(((e.clientX - rect.left) * scaleX) / gridSize);
            const yGrid = Math.floor(((e.clientY - rect.top) * scaleY) / gridSize);
            
            const x = xGrid * gridSize + gridSize/2;
            const y = yGrid * gridSize + gridSize/2;

            const onPath = path.some(p => {
                const pGridX = Math.floor((p.x - gridSize / 2) / gridSize);
                const pGridY = Math.floor((p.y - gridSize / 2) / gridSize);
                return pGridX === xGrid && pGridY === yGrid;
            });

            if (onPath) return;

            essence -= selectedTower.cost;
            if (selectedTower.type === 'pulse') towers.push(new PulseCannon(x, y));
            if (selectedTower.type === 'cryo') towers.push(new CryoSpire(x, y));
            updateUI();
        });

        nextWaveBtn.addEventListener('click', () => {
            if (!waveInProgress) spawnWave();
        });
        
        restartBtn.addEventListener('click', () => window.location.reload());
    }
    
    init();
});