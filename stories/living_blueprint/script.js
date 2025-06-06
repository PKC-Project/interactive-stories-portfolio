// script.js for The Living Blueprint (vFinal)

document.addEventListener('DOMContentLoaded', () => {
    const allSteps = document.querySelectorAll('.step');
    const allParts = document.querySelectorAll('.part');
    const gpuParticleSystem = document.querySelector('#part-gpu .particle-system');
    let audioCtx, activePartId = null;
    const activeOscillators = {}; // Store persistent oscillators

    // --- Audio Engine ---
    function setupAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Create a persistent ambient hum
        const hum = audioCtx.createOscillator();
        const humGain = audioCtx.createGain();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(40, audioCtx.currentTime);
        humGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        hum.connect(humGain).connect(audioCtx.destination);
        hum.start();
    }
    document.body.addEventListener('click', setupAudio, { once: true });

    const sounds = {
        cpu: { type: 'sine', freq: 60, gain: 0.1, loop: true, attack: 1.0, release: 1.0 },
        ram: { type: 'triangle', freq: 880, gain: 0.08, loop: false, attack: 0.01, release: 0.2, interval: 200 },
        gpu: { type: 'sawtooth', freq: 55, gain: 0.08, loop: true, attack: 1.5, release: 1.5 },
        storage: { type: 'square', freq: 110, gain: 0.05, loop: false, attack: 0.1, release: 1.0, interval: 1500 }
    };

    function manageSound(soundId, activate) {
        if (!audioCtx || !sounds[soundId]) return;
        const sound = sounds[soundId];
        const now = audioCtx.currentTime;

        if (activate) {
            if (activeOscillators[soundId]) return; // Already playing

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = sound.type;
            oscillator.frequency.setValueAtTime(sound.freq, now);
            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.exponentialRampToValueAtTime(sound.gain, now + sound.attack);
            oscillator.connect(gainNode).connect(audioCtx.destination);
            oscillator.start();

            activeOscillators[soundId] = { oscillator, gainNode, sound };
            
            if (!sound.loop) { // For one-shot repeating sounds like RAM and Storage
                activeOscillators[soundId].intervalId = setInterval(() => {
                    oscillator.frequency.setValueAtTime(sound.freq * (0.5 + Math.random()), audioCtx.currentTime);
                }, sound.interval);
            }
        } else {
            const activeSound = activeOscillators[soundId];
            if (!activeSound) return;
            activeSound.gainNode.gain.cancelScheduledValues(now);
            activeSound.gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.release);
            activeSound.oscillator.stop(now + sound.release + 0.1);
            if(activeSound.intervalId) clearInterval(activeSound.intervalId);
            delete activeOscillators[soundId];
        }
    }

    // --- GPU Particle System ---
    function setupGpuParticles() {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
            const r = Math.random() * 2 + 1;
            particle.setAttribute('r', r);
            particle.setAttribute('class', 'particle');
            const tx = (Math.random() - 0.5) * 300;
            const ty = (Math.random() - 0.5) * 300;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
            particle.style.animationDelay = `${Math.random() * 3}s`;
            gpuParticleSystem.appendChild(particle);
        }
    }

    // --- Observer Callback ---
    const handleIntersect = (entries) => {
        entries.forEach(entry => {
            const targetId = entry.target.dataset.target;
            const isActive = entry.isIntersecting;
            
            entry.target.classList.toggle('is-active-step', isActive);
            if (targetId) {
                document.getElementById(targetId)?.classList.toggle('is-active', isActive);
                manageSound(targetId, isActive);
            }
        });
    };

    // --- Setup and Run ---
    if ('IntersectionObserver' in window) {
        setupGpuParticles();
        const observer = new IntersectionObserver(handleIntersect, {
            threshold: 0.6,
            rootMargin: "0px 0px -25% 0px"
        });
        allSteps.forEach(step => observer.observe(step));
    } else {
        console.warn('IntersectionObserver not supported, this experience requires a modern browser.');
    }
});