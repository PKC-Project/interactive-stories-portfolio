// script.js for The Tell-Tale Heart (Suspense Version)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startOverlay = document.getElementById('start-overlay');
    const startButton = document.getElementById('start-button');
    const appContainer = document.getElementById('app-container');
    const narrativeText = document.getElementById('narrative-text');
    const svg = document.getElementById('room-svg');
    const lanternLight = document.getElementById('lantern-light');
    const eyeLocation = document.getElementById('the-eye-location');
    const eyeOverlay = document.getElementById('eye-overlay');
    const displacementFilter = svg.querySelector('feDisplacementMap');
    const roomScenery = document.getElementById('room-scenery');
    
    // --- State ---
    let audioCtx;
    let heartbeat, breathing;
    let act = 0;

    // --- Narrative Content ---
    const story = [
        "It is impossible to say how first the idea entered my brain; but once conceived, it haunted me day and night. I loved the old man. I think it was his eye! Yes, it was this! One of his eyes resembled that of a vulture—a pale blue eye, with a film over it.",
        "For seven long nights I came to the chamber. Upon the eighth, I was more than usually cautious. I had my head in, and was about to open the lantern, when my thumb slipped upon the tin fastening, and the old man sprang up in bed, crying out -- “Who’s there?”",
        "He was still sitting up in the bed listening; --just as I have done, night after night, hearkening to the death watches in the wall. His terror must have been extreme! I knew what the old man felt, and pitied him, although I chuckled at heart.",
        "After a long time, hearing a slight groan, I resolved to open a little—a very, very little crevice in the lantern. So I opened it. You cannot imagine how stealthily, stealthily—until, at length a single dim ray, like the thread of the spider, shot from out the crevice and fell full upon the vulture eye.",
        "It was open—wide, wide open—and I grew furious as I gazed upon it. And now have I not told you that what you mistake for madness is but over-acuteness of the senses? --now, I say, there came to my ears a low, dull, quick sound, such as a watch makes when enveloped in cotton. I knew that sound well, too. It was the beating of the old man’s heart.",
        "And now a new anxiety seized me—the sound would be heard by a neighbour! The old man’s hour had come! With a loud yell, I threw open the lantern and leaped into the room... The deed is done.",
        "I dismembered the corpse. I cut off the head and the arms and the legs. I then took up three planks from the flooring of the chamber, and deposited all between the scantlings. There was nothing to wash out—no stain of any kind. A tub had caught all—ha! ha!",
        "When the gentlemen of the police came, I smiled, for I had nothing to fear. I bade them search—search well. I led them, at length, to his chamber. I brought chairs thither, and desired them here to rest from their fatigues, while I myself, in the wild audacity of my perfect triumph, placed my own seat upon the very spot beneath which reposed the corpse of the victim.",
        "But, ere long, I felt myself getting pale and wished them gone. My head ached, and I fancied a ringing in my ears: but still they sat and still chatted. The ringing became more distinct:—It continued and became more distinct: I talked more freely to get rid of the feeling: but it continued and gained definiteness—until, at length, I found that the noise was not within my ears.",
        "It was a low, dull, quick sound—much such a sound as a watch makes when enveloped in cotton. I gasped for breath—and yet the officers heard it not. I paced the floor to and fro with heavy strides, but the noise steadily increased. Oh God! what could I do? I foamed—I raved—I swore!",
        "“Villains!” I shrieked, “dissemble no more! I admit the deed!—tear up the planks!—here, here!—It is the beating of his hideous heart!”"
    ];

    // --- Audio Engine ---
    const setupAudio = () => {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Breathing loop
        const breathGain = audioCtx.createGain();
        breathGain.gain.value = 0.1;
        const breathFilter = audioCtx.createBiquadFilter();
        breathFilter.type = 'lowpass'; breathFilter.frequency.value = 400;
        const breathNoise = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 3, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        breathNoise.buffer = buffer; breathNoise.loop = true;
        breathNoise.connect(breathFilter).connect(breathGain).connect(audioCtx.destination);
        breathNoise.start();
        const breathMod = audioCtx.createOscillator();
        breathMod.type = 'sine'; breathMod.frequency.value = 0.4;
        const breathModGain = audioCtx.createGain();
        breathModGain.gain.value = 0.05;
        breathMod.connect(breathModGain).connect(breathGain.gain);
        breathMod.start();
        breathing = { gain: breathGain, mod: breathMod };

        // Heartbeat loop
        const heartGain = audioCtx.createGain(); heartGain.gain.value = 0;
        const heartOsc = audioCtx.createOscillator();
        heartOsc.type = 'sine'; heartOsc.frequency.value = 40;
        heartOsc.connect(heartGain).connect(audioCtx.destination);
        heartOsc.start();
        heartbeat = { gain: heartGain, osc: heartOsc, interval: null };
    };

    const setHeartbeat = (rate, volume) => {
        if (!heartbeat) return;
        clearInterval(heartbeat.interval);
        if (rate > 0) {
            heartbeat.gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 1);
            heartbeat.interval = setInterval(() => {
                const now = audioCtx.currentTime;
                heartbeat.osc.frequency.setValueAtTime(80, now);
                heartbeat.osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
            }, 60000 / rate);
        } else {
            heartbeat.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        }
    };

    // --- Interaction & Scene Logic ---
    let actProgress = 0;
    const advanceAct = () => {
        if (actProgress >= story.length) return;
        
        narrativeText.style.opacity = '0';
        setTimeout(() => {
            narrativeText.textContent = story[actProgress];
            narrativeText.style.opacity = '1';
            runActLogic(actProgress);
            actProgress++;
        }, 1000);
    };

    const runActLogic = (actNum) => {
        // --- Act 1: The Obsession ---
        if (actNum === 3) { // Dim ray on the eye
            lanternLight.setAttribute('r', '50');
            eyeLocation.addEventListener('mouseenter', handleEyeFocus);
            eyeLocation.addEventListener('mouseleave', handleEyeUnfocus);
        }
        if (actNum === 4) { // Heartbeat begins
             setHeartbeat(75, 0.4);
             breathing.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        }
        // --- Act 2: The Deed ---
        if (actNum === 5) {
             setHeartbeat(120, 0.6);
             setTimeout(() => {
                setHeartbeat(0, 0);
                advanceAct(); // Automatically advance after the deed
             }, 4000);
        }
        // --- Act 3: The Concealment ---
        if (actNum === 7) {
             setHeartbeat(60, 0.2); // A calm, muffled beat
        }
        // --- Act 4: The Confession ---
        if (actNum === 8) { // The ringing begins
             setHeartbeat(80, 0.4);
        }
        if (actNum === 9) { // It increases
             setHeartbeat(110, 0.7);
             displacementFilter.setAttribute('scale', '5');
        }
        if (actNum === 10) { // The climax
             setHeartbeat(150, 1.0);
             displacementFilter.setAttribute('scale', '15');
             roomScenery.classList.add('is-pulsing-red');
        }
    };
    
    const handleEyeFocus = () => { eyeOverlay.style.opacity = '0.2'; };
    const handleEyeUnfocus = () => { eyeOverlay.style.opacity = '0'; };

    // --- Event Listeners ---
    startButton.addEventListener('click', () => {
        setupAudio();
        startOverlay.style.opacity = '0';
        setTimeout(() => startOverlay.style.display = 'none', 1500);
        appContainer.classList.remove('hidden');
        advanceAct();
    });
    
    svg.addEventListener('mousemove', (e) => {
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 800;
        const y = (e.clientY - rect.top) / rect.height * 600;
        lanternLight.setAttribute('cx', x);
        lanternLight.setAttribute('cy', y);
    });

    // Main interaction is clicking to advance the narrative
    appContainer.addEventListener('click', () => {
        if(actProgress > 0 && actProgress < story.length) {
            advanceAct();
        }
    });
});