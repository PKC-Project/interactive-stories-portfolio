// script.js for The Poet's Verse (vFinal)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startOverlay = document.getElementById('start-overlay');
    const startButton = document.getElementById('start-button');
    const scrollyContainer = document.getElementById('scrolly-container');
    const stanzas = document.querySelectorAll('.stanza');
    const chamberSvg = document.getElementById('chamber-svg');
    const svgElements = {
        bust: document.getElementById('bust-group'),
        shadow: document.getElementById('shadow'),
        lamplight: document.getElementById('lamplight')
    };
    let ravenElement;

    // --- State ---
    let audioCtx;
    let speechSynth = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance();
    let voices;
    let audioSources = {}; // To store and control persistent audio loops

    // --- Audio & Speech Engine ---
    const setupAudio = () => {
        if (audioCtx) return; // Run setup only once
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Configure speech synthesis voice and properties
        const setVoice = () => {
            voices = speechSynth.getVoices();
            utterance.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('David'))) || voices.find(v => v.lang.startsWith('en'));
        };
        setVoice();
        if (speechSynth.onvoiceschanged !== undefined) {
            speechSynth.onvoiceschanged = setVoice;
        }
        utterance.rate = 0.8;
        utterance.pitch = 0.7;
        utterance.volume = 1.0;

        // Create ambient sound loops but keep them silent initially
        createLoopingSource('cello', 55, 0);
        createLoopingSource('wind', 0, 0);
        createLoopingSource('heartbeat', 90, 0);
    };

    // --- Start Button: The key to enabling audio ---
    startButton.addEventListener('click', () => {
        // 1. Setup audio now that we have user permission
        setupAudio();

        // 2. Fade out the overlay
        startOverlay.style.opacity = '0';
        startOverlay.style.pointerEvents = 'none';

        // 3. Show the main content
        scrollyContainer.classList.remove('hidden');
        scrollyContainer.style.transition = 'opacity 1s ease-in-out 0.5s';
        scrollyContainer.style.opacity = '1';

        // 4. Trigger the first stanza's narration after the fade
        setTimeout(() => {
            if (stanzas[0].classList.contains('is-active')) {
                speakStanza(stanzas[0]);
            }
        }, 1000);
    });

    function createLoopingSource(id, freq, gainValue) {
        if (!audioCtx) return;
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(gainValue, audioCtx.currentTime);
        gainNode.connect(audioCtx.destination);
        
        let sourceNode;
        if (freq > 0) { // Tonal source
            sourceNode = audioCtx.createOscillator();
            sourceNode.type = (id === 'heartbeat') ? 'sine' : 'sawtooth';
            sourceNode.frequency.value = freq;
        } else { // Noise source for wind
            const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            sourceNode = audioCtx.createBufferSource();
            sourceNode.buffer = buffer;
            sourceNode.loop = true;
        }

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = (id === 'cello') ? 200 : 800;

        sourceNode.connect(filter).connect(gainNode);
        sourceNode.start();
        audioSources[id] = { gainNode };
    }

    function setAudioGain(id, targetGain, duration = 2.0) {
        if (audioSources[id]) {
            audioSources[id].gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + duration);
        }
    }
    
    function playOneShotSound(type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const now = audioCtx.currentTime;
        osc.connect(gain).connect(audioCtx.destination);
        gain.gain.setValueAtTime(0, now);

        if (type === 'tap') {
            gain.gain.linearRampToValueAtTime(0.4, now + 0.01).linearRampToValueAtTime(0, now + 0.1);
            osc.frequency.setValueAtTime(1500, now);
        } else if (type === 'caw') {
            osc.type = 'sawtooth';
            gain.gain.linearRampToValueAtTime(0.2, now + 0.05).linearRampToValueAtTime(0, now + 0.5);
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(300, now + 0.5);
        }
        osc.start(now);
        osc.stop(now + 1);
    }

    function speakStanza(stanzaElement) {
        if (!speechSynth || !utterance.voice) return;
        speechSynth.cancel();
        utterance.text = stanzaElement.textContent;
        speechSynth.speak(utterance);
    }

    // --- Visual & Audio Choreography ---
    const updateScene = (triggerId) => {
        svgElements.bust.style.opacity = 0;
        if (ravenElement) ravenElement.style.opacity = 0;
        chamberSvg.classList.remove('is-glitching');
        
        setAudioGain('cello', 0);
        setAudioGain('wind', 0);
        setAudioGain('heartbeat', 0);

        switch(triggerId) {
            case 'start':
                svgElements.lamplight.setAttribute('fill', '#fdebd0');
                svgElements.lamplight.setAttribute('r', 150);
                svgElements.shadow.style.setProperty('--shadow-scale', '0');
                playOneShotSound('tap');
                break;
            case 'ember':
                svgElements.lamplight.setAttribute('r', 120);
                setAudioGain('cello', 0.08);
                break;
            case 'terrors':
                svgElements.lamplight.setAttribute('r', 100);
                setAudioGain('cello', 0.05);
                setAudioGain('wind', 0.03);
                break;
            case 'darkness':
                svgElements.lamplight.setAttribute('r', 50);
                setAudioGain('wind', 0.06);
                break;
            case 'raven_enter':
                svgElements.bust.style.opacity = 1;
                if (!ravenElement) {
                    const group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
                    group.id = 'raven';
                    group.innerHTML = `<path d="M200,130 C220,110 200,90 180,110 C160,130 180,150 200,130 Z" fill="black" /><circle class="eye-glow" fill="red" cx="195" cy="115" r="0" />`;
                    svgElements.bust.appendChild(group);
                    ravenElement = group;
                }
                ravenElement.style.opacity = 1;
                ravenElement.classList.add('fly-in');
                setTimeout(() => ravenElement.classList.remove('fly-in'), 2000);
                playOneShotSound('caw');
                setAudioGain('wind', 0.04);
                break;
            case 'nevermore_1':
                svgElements.bust.style.opacity = 1;
                if(ravenElement) ravenElement.style.opacity = 1;
                svgElements.shadow.style.opacity = 0.6;
                svgElements.shadow.style.setProperty('--shadow-scale', '0.3');
                svgElements.shadow.classList.add('creeping');
                setAudioGain('cello', 0.1, 4.0);
                break;
            case 'shadow_grow':
                svgElements.bust.style.opacity = 1;
                if(ravenElement) ravenElement.style.opacity = 1;
                svgElements.lamplight.setAttribute('r', 80);
                svgElements.lamplight.setAttribute('fill', '#a8dadc');
                svgElements.shadow.style.setProperty('--shadow-scale', '0.7');
                setAudioGain('cello', 0.12);
                setAudioGain('wind', 0.05);
                break;
            case 'end':
                svgElements.bust.style.opacity = 1;
                if(ravenElement) ravenElement.style.opacity = 1;
                svgElements.lamplight.setAttribute('r', 60);
                svgElements.shadow.style.setProperty('--shadow-scale', '1');
                chamberSvg.classList.add('is-glitching');
                setAudioGain('cello', 0.15);
                setAudioGain('wind', 0.08);
                setAudioGain('heartbeat', 0.2, 4.0);
                break;
        }
    };
    
    // --- Intersection Observer Setup ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const stanzaEl = entry.target;
            if (entry.isIntersecting) {
                stanzaEl.classList.add('is-active');
                updateScene(stanzaEl.dataset.trigger);
                if (audioCtx) { // Only speak if audio has been initialized
                    speakStanza(stanzaEl);
                }
            } else {
                stanzaEl.classList.remove('is-active');
            }
        });
    }, { threshold: 0.7, rootMargin: '0px 0px -20% 0px' });

    stanzas.forEach(stanza => observer.observe(stanza));

    // Set initial visual state (no audio yet)
    updateScene('start');
    stanzas[0].classList.add('is-active');
});