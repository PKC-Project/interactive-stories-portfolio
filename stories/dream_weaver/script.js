// script.js for The Dream Weaver

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('dream-canvas');
    const resetPrompt = document.getElementById('reset-prompt');
    const instructions = document.querySelector('.instructions');

    let audioCtx;
    let mainGain;

    // --- Audio Engine ---
    const setupAudio = () => {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        mainGain = audioCtx.createGain();
        mainGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        mainGain.connect(audioCtx.destination);
    };
    // Initialize on first interaction to comply with browser policies
    document.body.addEventListener('click', setupAudio, { once: true });
    
    // Play a single, gentle note when a layer is conjured
    const playConjureSound = () => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(mainGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 * Math.pow(2, Math.random() * 2 - 1), now); // Random octave
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2); // Long decay

        osc.start(now);
        osc.stop(now + 2);
    };

    // --- Dream Layer Generation ---
    const createDreamLayer = () => {
        const layer = document.createElement('div');
        layer.className = 'dream-layer';
        
        const size = Math.random() * 60 + 20; // 20% to 80% of viewport size
        const hue1 = Math.random() * 360;
        const hue2 = (hue1 + Math.random() * 120 + 30) % 360;

        layer.style.width = `${size}vw`;
        layer.style.height = `${size}vh`;
        layer.style.left = `${Math.random() * (100 - size)}vw`;
        layer.style.top = `${Math.random() * (100 - size)}vh`;
        
        // Randomized linear gradient background
        layer.style.background = `linear-gradient(
            ${Math.random() * 360}deg, 
            hsla(${hue1}, 100%, 70%, 0.4), 
            hsla(${hue2}, 100%, 70%, 0)
        )`;
        
        // Randomize the drift animation
        layer.style.setProperty('--tx-start', `${Math.random() * 100 - 50}px`);
        layer.style.setProperty('--ty-start', `${Math.random() * 100 - 50}px`);
        layer.style.setProperty('--tx-end', `${Math.random() * 100 - 50}px`);
        layer.style.setProperty('--ty-end', `${Math.random() * 100 - 50}px`);
        layer.style.animationDuration = `${Math.random() * 20 + 15}s`;

        canvas.appendChild(layer);
        playConjureSound();
    };

    // --- Interaction Listeners ---

    // 1. Conjure on Click
    canvas.addEventListener('click', createDreamLayer);

    // 2. Weave with Mouse Move
    window.addEventListener('mousemove', (e) => {
        // Normalize mouse position to a 0-1 range
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        document.body.style.setProperty('--mouse-x', mouseX);
        document.body.style.setProperty('--mouse-y', mouseY);

        // Optional: Subtly change the audio pitch/pan based on mouse
        if (mainGain) {
            // This would require a more complex audio setup (e.g., a PannerNode)
            // but is a great extension. For now, we'll keep it simple.
        }
    });

    // 3. Reset with Spacebar
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            resetPrompt.classList.add('visible');
            instructions.style.opacity = '0';
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            resetPrompt.classList.remove('visible');
            instructions.style.opacity = '1';
            
            // Clear the canvas
            canvas.innerHTML = '';
        }
    });
    
    // --- Initial State ---
    createDreamLayer(); // Start with one layer for immediate visual feedback

});