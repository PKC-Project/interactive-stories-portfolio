// script.js for The Digital Lava Lamp (Final Synthesis Version)

document.addEventListener('DOMContentLoaded', () => {
    const lampGlass = document.getElementById('lamp-glass');
    const uiOverlay = document.getElementById('ui-overlay');
    
    let audioCtx;
    let mainGain, filter;

    // --- Advanced Audio Engine ---
    const setupAudio = () => {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        mainGain = audioCtx.createGain();
        mainGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        mainGain.connect(audioCtx.destination);

        filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.connect(mainGain);
        
        // Start a constant, deep hum for the lamp's "heat"
        const humOsc = audioCtx.createOscillator();
        humOsc.type = 'sine';
        humOsc.frequency.setValueAtTime(40, audioCtx.currentTime); // Deep hum
        humOsc.connect(filter);
        humOsc.start();
        
        // Start playing subtle, generative chimes
        playGenerativeChimes();
    };
    document.body.addEventListener('click', setupAudio, { once: true });
    
    const playInjectSound = () => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(filter);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1.5);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.start(now);
        osc.stop(now + 1.5);
    };

    const playGenerativeChimes = () => {
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99];
        
        setInterval(() => {
            if(!audioCtx) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain).connect(filter);
            
            osc.type = 'triangle';
            osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

            osc.start(now);
            osc.stop(now + 2);
        }, Math.random() * 3000 + 2000); // Play a chime every 2-5 seconds
    };

    // --- Blob Generation ---
    const createLavaBlob = (xPosition) => {
        const blob = document.createElement('div');
        blob.className = 'lava-blob';
        
        const size = Math.random() * 150 + 100;
        const color = Math.random() > 0.5 ? 'var(--blob-color-1)' : 'var(--blob-color-2)';
        const animationDuration = Math.random() * 20 + 20; // Slower: 20-40 seconds
        const animationDelay = Math.random() * 20;

        blob.style.width = `${size}px`;
        blob.style.height = `${size}px`;
        blob.style.left = `${xPosition - size / 2}px`;
        blob.style.background = color;
        blob.style.animationDuration = `${animationDuration}s`;
        blob.style.animationDelay = `-${animationDelay}s`;

        lampGlass.appendChild(blob);
        playInjectSound();

        // Remove blobs after they've lived their life to prevent clutter
        setTimeout(() => blob.remove(), animationDuration * 1000 + 1000);
    };

    // --- Interaction Listeners ---
    let uiTimeout;
    document.getElementById('lava-lamp').addEventListener('click', (e) => {
        createLavaBlob(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        document.body.style.setProperty('--mouse-x', mouseX);
        document.body.style.setProperty('--mouse-y', mouseY);

        // Subtly modulate the audio filter with mouse movement
        if(filter) {
            filter.frequency.linearRampToValueAtTime(400 + mouseY * 800, audioCtx.currentTime + 0.5);
        }
        
        // Hide UI instructions after a delay
        uiOverlay.style.opacity = '1';
        clearTimeout(uiTimeout);
        uiTimeout = setTimeout(() => { uiOverlay.style.opacity = '0'; }, 2000);
    });
    
    // --- Initial State ---
    setTimeout(() => {
         for (let i = 0; i < 7; i++) {
            const initialX = Math.random() * window.innerWidth;
            createLavaBlob(initialX);
        }
    }, 500); // Small delay to let the page settle
});