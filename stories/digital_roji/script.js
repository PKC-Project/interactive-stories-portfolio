class ZenGarden {
    constructor(canvas, stonesContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stonesContainer = stonesContainer;

        // State Management
        this.isRaking = false;
        this.rakeType = 'single';
        this.points = [];
        this.stones = [];
        
        // Tool settings
        this.tineSpacing = 15;
        this.numTines = 5;

        // Setup
        this.audio = this.setupAudio();
        this.setupCanvas();
        this.bindEvents();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.smoothSand();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleEnd.bind(this));
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd.bind(this));
    }

    setupAudio() {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const rakeGain = audioCtx.createGain();
        rakeGain.gain.value = 0;

        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const sandFilter = audioCtx.createBiquadFilter();
        sandFilter.type = 'lowpass';
        sandFilter.frequency.value = 700;
        sandFilter.Q.value = 5;

        noiseSource.connect(sandFilter).connect(rakeGain).connect(audioCtx.destination);
        noiseSource.start();

        return { audioCtx, rakeGain };
    }

    setRakeType(type) { this.rakeType = type; }

    smoothSand() {
        if (!this.sandTexture) this.sandTexture = this.createSandTexture();
        this.ctx.fillStyle = this.ctx.createPattern(this.sandTexture, 'repeat');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.stones = [];
        this.stonesContainer.innerHTML = '';
    }

    createSandTexture() {
        const textureCanvas = document.createElement('canvas');
        const tCtx = textureCanvas.getContext('2d');
        const size = 100;
        textureCanvas.width = size;
        textureCanvas.height = size;
        const sandColor = getComputedStyle(document.documentElement).getPropertyValue('--color-sand');
        tCtx.fillStyle = sandColor;
        tCtx.fillRect(0, 0, size, size);
        const imageData = tCtx.getImageData(0, 0, size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const grain = Math.random() * 25 - 12.5;
            imageData.data[i] += grain;
            imageData.data[i + 1] += grain;
            imageData.data[i + 2] += grain;
        }
        tCtx.putImageData(imageData, 0, 0);
        return textureCanvas;
    }

    placeStone(x, y) {
        const dpr = window.devicePixelRatio || 1;
        const size = (Math.random() * 40 + 20) / dpr; // Adjust for DPR
        const stone = { x, y, size };
        this.stones.push(stone);
        const stoneEl = document.createElement('div');
        stoneEl.className = 'stone';
        stoneEl.style.width = `${size}px`;
        stoneEl.style.height = `${size}px`;
        stoneEl.style.left = `calc(${x}px - ${size/2}px)`;
        stoneEl.style.top = `calc(${y}px - ${size/2}px)`;
        this.stonesContainer.appendChild(stoneEl);
    }

    getCoordinates(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches ? event.touches[0] : event;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    handleStart(event) {
        this.audio.audioCtx.resume();
        this.isRaking = true;
        const coords = this.getCoordinates(event);
        this.points = [{ ...coords, width: 0 }]; // Start with an initial point
    }

    handleMove(event) {
        if (!this.isRaking) return;
        
        const currentPos = this.getCoordinates(event);
        const lastPos = this.points[this.points.length - 1];
        const dist = Math.hypot(currentPos.x - lastPos.x, currentPos.y - lastPos.y);
        
        const pressure = (event.touches ? event.touches[0].force : event.pressure) || 0.5;
        const width = Math.max(1, pressure * 10);
        
        this.points.push({ ...currentPos, width });

        this.drawSmoothedPath();
        
        const speed = Math.min(dist / 15, 1);
        this.audio.rakeGain.gain.setTargetAtTime(speed * 0.1, this.audio.audioCtx.currentTime, 0.02);
    }
    
    handleEnd() {
        this.isRaking = false;
        this.audio.rakeGain.gain.setTargetAtTime(0, this.audio.audioCtx.currentTime, 0.2);
    }

    drawRakeLine(point1, point2, ctrl1, ctrl2, baseWidth) {
        this.ctx.lineWidth = baseWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Shadow Pass
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-sand-shadow');
        this.ctx.beginPath();
        this.ctx.moveTo(point1.x + 0.5, point1.y + 0.5);
        this.ctx.bezierCurveTo(ctrl1.x + 0.5, ctrl1.y + 0.5, ctrl2.x + 0.5, ctrl2.y + 0.5, point2.x + 0.5, point2.y + 0.5);
        this.ctx.stroke();

        // Highlight Pass
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-sand-highlight');
        this.ctx.beginPath();
        this.ctx.moveTo(point1.x - 0.5, point1.y - 0.5);
        this.ctx.bezierCurveTo(ctrl1.x - 0.5, ctrl1.y - 0.5, ctrl2.x - 0.5, ctrl2.y - 0.5, point2.x - 0.5, point2.y - 0.5);
        this.ctx.stroke();
    }
    
    drawSmoothedPath() {
        if (this.points.length < 3) return;

        let p1 = this.points[this.points.length - 3];
        let p2 = this.points[this.points.length - 2];
        let p3 = this.points[this.points.length - 1];

        let c1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        let c2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

        if (this.rakeType === 'single') {
            this.drawRakeLine(c1, c2, p2, p2, 2);
        } else if (this.rakeType === 'comb') {
            const dx = c2.x - c1.x, dy = c2.y - c1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return;
            const px = -dy / dist, py = dx / dist;
            const halfTines = Math.floor(this.numTines / 2);

            for (let i = 0; i < this.numTines; i++) {
                const offset = (i - halfTines) * this.tineSpacing;
                this.drawRakeLine(
                    {x: c1.x + offset * px, y: c1.y + offset * py},
                    {x: c2.x + offset * px, y: c2.y + offset * py},
                    {x: p2.x + offset * px, y: p2.y + offset * py},
                    {x: p2.x + offset * px, y: p2.y + offset * py},
                    1.5
                );
            }
        }
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { document.getElementById('welcome-overlay').classList.remove('visible'); }, 1500);

    const canvas = document.getElementById('zen-garden-canvas');
    const stonesContainer = document.getElementById('stones-container');
    const zenGarden = new ZenGarden(canvas, stonesContainer);
    
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            if (tool === 'smooth') { zenGarden.smoothSand(); return; }
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            zenGarden.setRakeType(tool);
            document.body.classList.toggle('stone-mode', tool === 'stone');
        });
    });

    canvas.addEventListener('click', (e) => {
        if(zenGarden.rakeType === 'stone'){
            const coords = zenGarden.getCoordinates(e);
            zenGarden.placeStone(coords.x, coords.y);
        }
    });
});