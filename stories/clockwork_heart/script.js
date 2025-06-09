document.addEventListener('DOMContentLoaded', () => {

    const movementSvg = document.getElementById('movement-svg');
    const componentBtns = document.querySelectorAll('.component-btn');
    const componentTitle = document.getElementById('component-title');
    const componentDescription = document.getElementById('component-description');

    // NLD REFINEMENT: Target the new group elements for correct rotation
    const balanceWheelAssembly = document.getElementById('balance-wheel-assembly');
    const palletForkGroup = document.getElementById('pallet-fork-group');
    const escapeWheelGroup = document.getElementById('escape-wheel-group');

    let balanceAngle = 0;
    let balanceDirection = 1;
    let palletAngle = 0;
    let escapeAngle = 0;
    const escapeTeeth = 15;
    const anglePerTooth = 360 / escapeTeeth;
    
    // AudioEngine Class (Unchanged)
    class AudioEngine {
        constructor() { this.audioCtx = null; }
        _init() {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioCtx.destination);
        }
        _createClick(frequency, duration = 0.05) {
            if (!this.audioCtx || !this.masterGain) return;
            const osc = this.audioCtx.createOscillator(); osc.type = 'triangle';
            const gain = this.audioCtx.createGain();
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            osc.connect(gain).connect(this.masterGain);
            osc.start(); osc.stop(this.audioCtx.currentTime + duration);
        }
        playTick() { this._createClick(2500); }
        playTock() { this._createClick(2000); }
        playWinding() { for (let i = 0; i < 5; i++) { setTimeout(() => this._createClick(4000, 0.02), i * 50);}}
    }
    const audio = new AudioEngine();
    
    // Component Info Text (Unchanged)
    const componentInfo = {
        all: { title: "Full Movement", description: "The assembled mechanical watch movement, a marvel of miniature engineering, precisely measures the passage of time through a symphony of interconnected parts." },
        mainspring: { title: "Mainspring & Barrel", description: "The powerhouse. A coiled ribbon of steel (the mainspring) inside a rotating drum (the barrel) stores potential energy when wound, providing consistent power to the watch for hours or days." },
        geartrain: { title: "Gear Train", description: "The transmission. A series of interconnected gears that take the raw power from the mainspring and precisely divide its rotation down to drive the second, minute, and hour indicators." },
        escapement: { title: "Escapement Assembly", description: "The heart and brain. This intricate mechanism (balance wheel, pallet fork, escape wheel) translates the continuous rotational energy of the gear train into discrete, precisely timed impulses—the iconic 'tick-tock'—regulating the watch's speed." }
    };

    // Animation Loop for the Escapement (Corrected Transforms)
    let lastTickTime = 0;
    function animateEscapement(timestamp) {
        balanceAngle += balanceDirection * 3;
        if (Math.abs(balanceAngle) > 45) {
            balanceDirection *= -1;
            palletAngle = balanceDirection * 10;
            palletForkGroup.style.transform = `rotate(${palletAngle}deg)`;

            if (timestamp - lastTickTime > 180) {
                if (balanceDirection > 0) audio.playTick(); else audio.playTock();
                lastTickTime = timestamp;
                
                escapeAngle += anglePerTooth / 2;
                escapeWheelGroup.style.transform = `rotate(${escapeAngle}deg)`;
            }
        }
        balanceWheelAssembly.style.transform = `rotate(${balanceAngle}deg)`;
        requestAnimationFrame(animateEscapement);
    }

    // Event Listeners for Component Isolation (Unchanged)
    componentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            audio._init();
            const component = btn.dataset.component;
            componentBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            movementSvg.className.baseVal = component === 'all' ? '' : `isolate-${component}`;
            
            componentTitle.textContent = componentInfo[component].title;
            componentDescription.textContent = componentInfo[component].description;
            
            if (component === 'mainspring') audio.playWinding();
        });
    });

    // Initial Setup
    requestAnimationFrame(animateEscapement);
});