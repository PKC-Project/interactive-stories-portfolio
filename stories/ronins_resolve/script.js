// script.js for The Ronin's Resolve

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const playButton = document.getElementById('play-button');
    const titleCard = document.getElementById('title-card');
    const scene = document.getElementById('scene');
    const grassContainer = document.getElementById('grass-container');
    const rainContainer = document.getElementById('rain-container');
    const swordBlade = document.getElementById('ronin-sword-blade');
    
    let audioCtx;
    const soundNodes = {};

    // --- Asset Generation ---
    function createGrass() {
        for (let i = 0; i < 150; i++) {
            const blade = document.createElement('div');
            blade.className = 'grass-blade';
            blade.style.left = `${Math.random() * 100}%`;
            blade.style.height = `${Math.random() * 40 + 20}px`;
            blade.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
            blade.style.animationDelay = `${Math.random() * -1}s`;
            grassContainer.appendChild(blade);
        }
    }
    
    function createRain(count) {
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('div');
            drop.className = 'raindrop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${Math.random() * 0.5 + 0.3}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            // Brief fade-in to look less artificial
            setTimeout(() => { drop.style.opacity = Math.random() * 0.5 + 0.2; }, Math.random() * 1000);
            rainContainer.appendChild(drop);
        }
    }

    // --- Audio Engine ---
    const setupAudio = () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    };
    
    const playSound = (type, looping = false, options = {}) => {
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        
        if (type === 'wind') {
            const node = audioCtx.createBufferSource();
            const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            node.buffer = buffer;
            node.loop = true;
            
            const bqf = audioCtx.createBiquadFilter();
            bqf.type = "lowpass";
            bqf.frequency.setValueAtTime(400, now); // Start with a low rumble
            bqf.Q.setValueAtTime(10, now);
            
            node.connect(bqf).connect(gainNode);
            node.start();
            soundNodes.wind = { node, gain: gainNode, filter: bqf };
        } else if (type === 'drum') {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(70, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(1, now + 0.01); // Hard attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Long decay
            osc.connect(gainNode);
            osc.start(now);
            osc.stop(now + 1.5);
        } else if (type === 'flute') {
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(784, now); // G5
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.2);
            gainNode.gain.linearRampToValueAtTime(0, now + 4);
            osc.connect(gainNode);
            osc.start(now);
            osc.stop(now + 4);
        } else if (type === 'sword') {
            const noise = audioCtx.createBufferSource();
            // ... same noise generation as previous project ...
            const bqf = audioCtx.createBiquadFilter();
            bqf.type = "highpass";
            bqf.frequency.value = 1000;
            // ... connect and play ...
        } else if (type === 'crack') {
             const osc = audioCtx.createOscillator();
             osc.type = 'sine';
             osc.frequency.setValueAtTime(100, now);
             gainNode.gain.setValueAtTime(0, now);
             gainNode.gain.linearRampToValueAtTime(1.5, now + 0.01); // Very loud
             gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
             osc.connect(gainNode);
             osc.start(now);
             osc.stop(now + 0.5);
        }
    };
    
    // --- The Film Timeline ---
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const playFilm = async () => {
        // --- PREP ---
        setupAudio();
        playButton.classList.add('hidden');
        titleCard.innerHTML = "The Ronin's Resolve<br><span style='font-size: 1.5rem;'>決意の浪人</span>";

        // --- ACT 1: The Standoff (0-15s) ---
        titleCard.classList.add('visible');
        playSound('wind', true); // Start the wind
        
        let drumInterval = setInterval(() => playSound('drum'), 3000);

        await delay(5000);
        titleCard.classList.remove('visible');
        await delay(1000);
        
        scene.classList.add('zoom-in'); // Start the slow push-in

        await delay(9000); // Wait until 15s mark

        // --- ACT 2: The Decision (15-30s) ---
        clearInterval(drumInterval);
        drumInterval = setInterval(() => playSound('drum'), 1500); // Faster drums
        playSound('flute');
        createRain(50); // Start light rain

        await delay(15000); // Wait until 30s mark

        // --- ACT 3: The Draw (30-40s) ---
        clearInterval(drumInterval);
        rainContainer.innerHTML = ''; // Clear light rain
        createRain(300); // Start heavy rain
        
        await delay(2000);
        
        // Stop all sounds for the climax
        Object.values(soundNodes).forEach(n => n.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1));
        
        await delay(100);
        
        swordBlade.classList.add('drawn');
        playSound('crack'); // The final, deafening drum crack
        
        await delay(500); // A moment of silence
        
        soundNodes.wind.gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 1.0); // Bring back rain/wind sound

        await delay(1000);
        titleCard.innerHTML = "FIN.<br><span style='font-size: 3rem;'>了</span>";
        titleCard.classList.add('visible', 'fin');
        
        // Reset for next viewing
        await delay(5000);
        location.reload(); // Simple way to reset the entire complex state
    };

    // --- Initial Setup ---
    createGrass();
    playButton.addEventListener('click', playFilm, { once: true });
});