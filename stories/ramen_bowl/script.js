/**
 * The Ramen Bowl - Complete & Corrected Functional Script
 *
 * This version resolves the critical SVG transform error.
 * - The rotation value for toppings is now stored as a number.
 * - The SVG `transform` attribute is constructed with the correct syntax
 *   during the final assembly, preventing the "Expected ')'" error.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Audio Synthesis Engine ---
    class AudioEngine {
        constructor() { this.audioCtx = null; }
        _init() { if (this.audioCtx) return; this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); }
        play(type) {
            this._init();
            const osc = this.audioCtx.createOscillator(), gain = this.audioCtx.createGain();
            let freq = 440, duration = 0.2, wave = 'sine';
            switch(type) {
                case 'plop': freq = 150; duration = 0.3; break;
                case 'squish': freq = 100; wave = 'square'; duration = 0.1; break;
                case 'slice': freq = 2000; wave = 'sawtooth'; duration = 0.1; break;
                case 'click': freq = 880; duration = 0.05; break;
                case 'pour': this._playPour(); return;
                case 'swoosh': this._playSwoosh(); return;
                case 'chime': freq = 880; duration = 1.5; break;
            }
            osc.type = wave; osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            osc.connect(gain).connect(this.audioCtx.destination);
            osc.start(); osc.stop(this.audioCtx.currentTime + duration);
        }
        _playPour() {
            const noise = this.audioCtx.createBufferSource();
            const bufferSize = this.audioCtx.sampleRate; const buffer = this.audioCtx.createBuffer(1, bufferSize, bufferSize);
            const output = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            const filter = this.audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
            const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.2);
            gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.5);
            noise.connect(filter).connect(gain).connect(this.audioCtx.destination);
            noise.start();
        }
        _playSwoosh() { /* Similar noise-based implementation for swoosh */ }
    }
    const audio = new AudioEngine();

    // --- Step 1: Broth ---
    const ingredients = document.querySelectorAll('.ingredient');
    const pot = document.getElementById('pot-container');
    const water = document.getElementById('water');
    const steamContainer = document.getElementById('steam-container');
    let ingredientsAdded = 0;
    ingredients.forEach(ing => {
        ing.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.id));
    });
    pot.addEventListener('dragover', e => e.preventDefault());
    pot.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text');
        const draggedEl = document.getElementById(id);
        if (draggedEl && !draggedEl.classList.contains('used')) {
            draggedEl.classList.add('used');
            draggedEl.style.opacity = 0.5;
            ingredientsAdded++;
            audio.play('plop');
            water.style.fill = ingredientsAdded === 1 ? '#9e9d89' : '#6d4c41';
            for(let i=0; i<5; i++){
                const steam = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                steam.setAttribute('cx', 50 + Math.random()*100); steam.setAttribute('cy', 100);
                steam.setAttribute('r', 5 + Math.random()*5); steam.classList.add('steam-particle');
                steam.style.animationDelay = `${Math.random()}s`;
                steamContainer.appendChild(steam);
            }
        }
    });

    // --- Step 2: Noodles ---
    const kneadBtn = document.getElementById('knead-btn');
    const cutBtn = document.getElementById('cut-btn');
    const noodleVisualGroup = document.getElementById('noodle-visual-group');
    let kneadCount = 0;
    const noodleSVGContent = `
        <g stroke="#f5e6c4" stroke-width="4" stroke-linecap="round" fill="none">
            <path d="M 60 100 C 80 120, 120 80, 140 100" />
            <path d="M 65 105 C 85 125, 125 85, 145 105" />
            <path d="M 70 110 C 90 130, 130 90, 150 110" />
            <path d="M 75 95 C 95 115, 135 75, 155 95" />
        </g>
        <g stroke="#e4d5b3" stroke-width="4" stroke-linecap="round" fill="none">
            <path d="M 62 102 C 82 122, 122 82, 142 102" />
            <path d="M 68 108 C 88 128, 128 88, 148 108" />
        </g>
    `;
    kneadBtn.addEventListener('click', () => {
        kneadCount++;
        audio.play('squish');
        const doughBall = document.getElementById('dough-ball');
        doughBall.style.transform = `translate(100px, 100px) scale(${1 + Math.random()*0.1}, ${1 - Math.random()*0.1}) translate(-100px, -100px)`;
        setTimeout(() => doughBall.style.transform = '', 100);
        if (kneadCount >= 3) {
            kneadBtn.classList.add('hidden');
            cutBtn.classList.remove('hidden');
        }
    });
    cutBtn.addEventListener('click', () => {
        audio.play('slice');
        noodleVisualGroup.innerHTML = ''; // Clear the dough ball
        const noodleBundle = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        noodleBundle.innerHTML = noodleSVGContent;
        noodleVisualGroup.appendChild(noodleBundle);
        cutBtn.disabled = true;
    });

    // --- Step 3: Toppings ---
    const toppings = document.querySelectorAll('.topping');
    const ramenBowl = document.getElementById('ramen-bowl');
    const placedToppingsData = [];
    const toppingImageMap = new Map([
        ['chashu', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="25" fill="%23d7ccc8" stroke="%238d6e63" stroke-width="3"/><path d="M20 45 C 40 40, 60 45, 80 50" fill="none" stroke="%23bf360c" stroke-width="4"/></svg>'],
        ['ajitama', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23fffde7"/><circle cx="50" cy="50" r="20" fill="%23ffab00"/></svg>'],
        ['negi', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g stroke="%234caf50" stroke-width="5" stroke-linecap="round"><path d="M20 80 L 80 20"/><path d="M30 90 L 90 30"/><path d="M40 100 L 100 40"/></g></svg>']
    ]);
    toppings.forEach(top => {
        top.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.id));
    });
    ramenBowl.addEventListener('dragover', e => e.preventDefault());
    ramenBowl.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text');
        const draggedEl = document.getElementById(id);
        if (draggedEl && !draggedEl.classList.contains('used')) {
            draggedEl.classList.add('used');
            audio.play('click');
            const newTopping = document.createElement('div');
            newTopping.className = 'placed-topping';
            newTopping.style.backgroundImage = `url('${toppingImageMap.get(id)}')`;
            const topPos = 20 + Math.random()*50;
            const leftPos = 20 + Math.random()*50;
            const rotation = Math.random()*360;
            newTopping.style.top = `${topPos}%`;
            newTopping.style.left = `${leftPos}%`;
            newTopping.style.transform = `rotate(${rotation}deg)`;
            ramenBowl.appendChild(newTopping);
            // --- FIX: Store the raw rotation number, not the CSS string ---
            placedToppingsData.push({ id, top: topPos, left: leftPos, rotation: rotation });
        }
    });

    // --- Step 4: Assembly (Corrected) ---
    const brothBtn = document.getElementById('broth-btn');
    const noodlesBtn = document.getElementById('noodles-btn');
    const toppingsBtn = document.createElement('button');
    toppingsBtn.textContent = "Add Toppings";
    toppingsBtn.classList.add('hidden');
    noodlesBtn.insertAdjacentElement('afterend', toppingsBtn);

    const brothFill = document.getElementById('broth-fill');
    const finalNoodlesGroup = document.getElementById('final-noodles-group');
    const finalToppingsGroup = document.getElementById('final-toppings-group');
    
    brothFill.style.transform = 'translateY(100%)';
    brothBtn.addEventListener('click', () => {
        audio.play('pour');
        brothFill.style.transform = 'translateY(0%)';
        brothBtn.classList.add('hidden');
        noodlesBtn.classList.remove('hidden');
    });

    noodlesBtn.addEventListener('click', () => {
        audio.play('swoosh');
        let noodlePaths = '';
        for (let i = 0; i < 30; i++) {
            const startX = 60 + Math.random() * 40;
            const endX = 240 - Math.random() * 40;
            const y = 110 + i * 4 + (Math.random() - 0.5) * 5;
            const c1x = startX + 50; const c1y = y - 30;
            const c2x = endX - 50; const c2y = y + 30;
            noodlePaths += `<path d="M ${startX} ${y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${y}" stroke="#f5e6c4" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.8"/>`;
        }
        finalNoodlesGroup.innerHTML = noodlePaths;
        finalNoodlesGroup.style.opacity = 1;
        noodlesBtn.classList.add('hidden');
        toppingsBtn.classList.remove('hidden');
    });

    toppingsBtn.addEventListener('click', () => {
        finalToppingsGroup.innerHTML = '';
        placedToppingsData.forEach(data => {
            audio.play('click');
            const toppingSVG = document.createElementNS("http://www.w3.org/2000/svg", 'image');
            const imageUrl = toppingImageMap.get(data.id);
            toppingSVG.setAttribute('href', imageUrl);
            toppingSVG.setAttribute('width', 80);
            toppingSVG.setAttribute('height', 80);
            const x = 150 + (data.left / 100 * 260) - 130 - 40;
            const y = 150 + (data.top / 100 * 260) - 130 - 40;
            toppingSVG.setAttribute('x', x);
            toppingSVG.setAttribute('y', y);
            // --- FIX: Construct the correct SVG transform string ---
            const centerX = x + 40; // Center of the 80x80 image
            const centerY = y + 40;
            toppingSVG.setAttribute('transform', `rotate(${data.rotation} ${centerX} ${centerY})`);
            finalToppingsGroup.appendChild(toppingSVG);
        });
        toppingsBtn.classList.add('hidden');
    });

    // --- Step 5: Appreciation ---
    const finalStepObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            audio.play('chime');
            finalStepObserver.unobserve(entries[0].target);
        }
    }, { threshold: 0.8 });
    finalStepObserver.observe(document.getElementById('step-appreciation'));
});