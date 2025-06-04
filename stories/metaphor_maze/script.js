document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-metaphor'),
        document.getElementById('page2-metaphor'),
        document.getElementById('page3-metaphor')
    ];
    const explanationP1 = document.getElementById('explanation-p1');
    const explanationP2 = document.getElementById('explanation-p2');
    const explanationP3 = document.getElementById('explanation-p3');
    
    const storyTexts = [explanationP1, explanationP2, explanationP3]; // For animateText

    const nextPage1Btn = document.getElementById('next-page1-metaphor');
    const prevPage2Btn = document.getElementById('prev-page2-metaphor');
    const nextPage2Btn = document.getElementById('next-page2-metaphor');
    const prevPage3Btn = document.getElementById('prev-page3-metaphor');
    const restartBtn = document.getElementById('restart-story-metaphors');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific
    const exploreBtnP1 = document.getElementById('explore-btn-p1');
    const svgMetaphorP1 = document.getElementById('svg-metaphor-p1');
    const metaphorP1Text = document.getElementById('metaphor-p1-text');
    const clashShape1 = svgMetaphorP1 ? svgMetaphorP1.querySelector('.clash-shape1') : null;
    const clashShape2 = svgMetaphorP1 ? svgMetaphorP1.querySelector('.clash-shape2') : null;
    let p1Explored = false;

    // Page 2 specific
    const timeSlider = document.getElementById('time-slider');
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const coinsGroup = document.getElementById('coins-group');
    const timeSpentText = document.getElementById('time-spent-text');

    // Page 3 specific
    const journeyBtnP3 = document.getElementById('journey-btn-p3');
    const journeyPath = document.getElementById('journey-path'); 
    const traveler = document.getElementById('traveler');     
    let journeyStarted = false;
    let journeyAnimationId; 

    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let userInteracted = false;

    // --- Audio Functions ---
    function initAudioContext() { if (!userInteracted) return null; if (!audioContext) { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); console.log("AudioContext initialized by user gesture."); } catch (e) { console.error("Error creating AudioContext:", e); return null; } } if (audioContext.state === 'suspended') { audioContext.resume().catch(e => console.error("Error resuming AudioContext:", e));} return audioContext; }
    function stopAllSounds() { currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} }); currentOscillators = []; }
    function playNoteSequence(notesConfig) { if (!initAudioContext() || !audioContext || audioContext.state !== 'running') { console.warn("AudioContext not ready or not allowed to start for playNoteSequence."); return; } stopAllSounds(); const now = audioContext.currentTime; const overallVolume = notesConfig.overallVolume || 0.08; notesConfig.notes.forEach(note => { let sn; const gn = audioContext.createGain(); gn.connect(audioContext.destination); if (note.type === 'noise') { const bs = audioContext.sampleRate * (note.duration || 0.1); const b = audioContext.createBuffer(1, bs, audioContext.sampleRate); const o = b.getChannelData(0); for (let i = 0; i < bs; i++) { o[i] = Math.random() * 2 - 1; } sn = audioContext.createBufferSource(); sn.buffer = b; sn.connect(gn); } else { sn = audioContext.createOscillator(); sn.type = note.type || 'sine'; sn.frequency.setValueAtTime(note.freq, now + (note.delay || 0)); if(note.slideTo) sn.frequency.linearRampToValueAtTime(note.slideTo, now + (note.delay || 0) + (note.duration || 0.1) * 0.8); sn.connect(gn); } gn.gain.setValueAtTime(0, now + (note.delay || 0)); gn.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02); gn.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + (note.duration || 0.1) - 0.05); gn.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + (note.duration || 0.1)); sn.start(now + (note.delay || 0)); sn.stop(now + (note.delay || 0) + (note.duration || 0.1) + 0.05); currentOscillators.push(sn); }); }
    function ensureAudioContextResumed() { if (!userInteracted) { userInteracted = true; initAudioContext(); } else if (audioContext && audioContext.state === 'suspended') { audioContext.resume().catch(e => console.error("Error resuming AudioContext on gesture:", e)); } return audioContext && audioContext.state === 'running'; }
    function animateText(textElement) { if(textElement) { textElement.classList.remove('text-fade-in'); void textElement.offsetWidth; textElement.classList.add('text-fade-in'); } }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;
    const pageMusicMetaphors = {
        0: { overallVolume: 0.07, notes: [ { freq: 110, duration: H, type: 'sawtooth'}, { freq: 146.83, duration: H, delay: H*0.8, type: 'sawtooth', volMultiplier: 0.8} ] }, 
        1: { overallVolume: 0.06, notes: [ { freq: 659.25, duration: E*0.7, type: 'triangle' }, { freq: 659.25, duration: E*0.7, delay: E*0.8, type: 'triangle' } ] }, 
        2: { overallVolume: 0.08, notes: [ { freq: 293.66, duration: W, type: 'sine'}, { freq: 440.00, duration: W, delay: W*0.5, type: 'sine', volMultiplier: 0.7} ] } 
    };
    const soundEffectsMetaphors = {
        clash: { overallVolume: 0.15, notes: [{freq: 100, duration: Q*0.5, type:'noise'}, {freq:120, duration:Q*0.4, delay:Q*0.3, type:'noise'}]},
        coinSpent: { overallVolume: 0.1, notes: [{freq: 1200, duration: E*0.3, type:'sine'}, {freq:1500, duration:E*0.3, delay:E*0.2, type:'sine'}]},
        pathReveal: { overallVolume: 0.09, notes: [{freq: 200, duration: H, type:'sine', slideTo: 500}]}
    };

    function showPage(index) { 
        if (index < 0 || index >= pages.length || !pages[index]) return;
        // ensureAudioContextResumed(); // Called by interactions now
        const goingForward = index > previousPageIndex;
        if (previousPageIndex !== -1 && pages[previousPageIndex]) {
            pages[previousPageIndex].classList.remove('current-page');
            pages[previousPageIndex].classList.add(goingForward ? 'slide-out-left' : 'slide-out-right');
        }
        pages[index].classList.remove('slide-out-left', 'slide-out-right');
        pages[index].classList.add('current-page');
        currentPageIndex = index;
        previousPageIndex = index;
        
        if (storyTexts[currentPageIndex]) {
            animateText(storyTexts[currentPageIndex]);
        }

        if (pageMusicMetaphors[currentPageIndex] && userInteracted) {
            playNoteSequence(pageMusicMetaphors[currentPageIndex]);
        }
        // Page specific resets
        if (currentPageIndex === 0) resetPage1Metaphor();
        if (currentPageIndex === 1) resetPage2Metaphor();
        if (currentPageIndex === 2) resetPage3Metaphor();
    }
    
    // --- Page 1: Argument is War ---
    function resetPage1Metaphor() {
        if (!clashShape1 || !clashShape2 || !metaphorP1Text || !exploreBtnP1 || !explanationP1) return;
        clashShape1.style.transform = 'translateX(0px) rotate(0deg)'; 
        clashShape2.style.transform = 'translateX(0px) rotate(0deg)'; 
        clashShape1.style.opacity = '1'; clashShape2.style.opacity = '1';
        metaphorP1Text.textContent = '';
        exploreBtnP1.disabled = false;
        exploreBtnP1.textContent = "Explore this Metaphor";
        explanationP1.innerHTML = "We often talk about arguments using the language of war: \"He <em>attacked</em> my points,\" \"I <em>defended</em> my position,\" \"She <em>shot down</em> my theory.\" Why is that?";
        p1Explored = false;
    }
    if (exploreBtnP1) {
        exploreBtnP1.addEventListener('click', () => {
            if (!clashShape1 || !clashShape2 || !metaphorP1Text || !explanationP1) return;
            if(!ensureAudioContextResumed()) return;
            exploreBtnP1.disabled = true;
            if (!p1Explored) {
                clashShape1.style.transform = 'translateX(20px) rotate(15deg)';
                clashShape2.style.transform = 'translateX(-20px) rotate(-15deg)';
                playNoteSequence(soundEffectsMetaphors.clash);
                metaphorP1Text.textContent = "Positions Attacked & Defended!";
                explanationP1.innerHTML = "This metaphor highlights the confrontational aspect of some arguments. We see sides, strategies, winners, and losers. Understanding the metaphor helps us see how language shapes our perception of debate.";
                animateText(explanationP1);
                p1Explored = true;
                exploreBtnP1.textContent = "Reset View";
                setTimeout(()=> exploreBtnP1.disabled = false, 1000);
            } else {
                resetPage1Metaphor(); 
            }
        });
    }

    // --- Page 2: Time is Money ---
    function resetPage2Metaphor() {
        if (!timeSlider || !timeSpentText || !explanationP2) return; // Removed hour/minute hand, coinsGroup from direct check here
        timeSlider.value = "0";
        if(hourHand) hourHand.style.transform = `rotate(0deg)`;
        if(minuteHand) minuteHand.style.transform = `rotate(0deg)`;
        if(coinsGroup) {
            Array.from(coinsGroup.children).forEach(coin => {
                coin.style.opacity = '1';
                coin.style.transform = 'translateY(0px)';
            });
        }
        timeSpentText.textContent = "Time: 0% Spent";
        explanationP2.innerHTML = "We say \"Don't <em>waste</em> my time,\" \"I've <em>invested</em> a lot of time,\" or \"That <em>cost</em> me an hour.\" This treats time like a valuable resource, much like money.";
    }
    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            if (!timeSpentText || !explanationP2) return; // Removed hour/minute hand, coinsGroup
            if(!ensureAudioContextResumed()) return;
            const percentageSpent = parseInt(e.target.value);
            timeSpentText.textContent = `Time: ${percentageSpent}% Spent`;

            if (hourHand && minuteHand) { // Check if hands exist
                const minuteRotation = (percentageSpent / 100) * 360 * 2; 
                const hourRotation = minuteRotation / 12;
                minuteHand.style.transform = `rotate(${minuteRotation}deg)`;
                hourHand.style.transform = `rotate(${hourRotation}deg)`;
            }

            if (coinsGroup) { // Check if coinsGroup exists
                const coins = Array.from(coinsGroup.children);
                const numCoinsToHide = Math.floor((percentageSpent / 100) * coins.length);
                coins.forEach((coin, index) => {
                    if (index < numCoinsToHide) {
                        if (coin.style.opacity !== '0') { 
                            coin.style.opacity = '0';
                            coin.style.transform = 'translateY(20px)';
                            playNoteSequence(soundEffectsMetaphors.coinSpent);
                        }
                    } else {
                        coin.style.opacity = '1';
                        coin.style.transform = 'translateY(0px)';
                    }
                });
            }
            if (percentageSpent === 100) {
                explanationP2.innerHTML = "Time, like money, is a limited resource. This metaphor emphasizes its value and how we allocate it. Once it's 'spent,' it's gone!";
                animateText(explanationP2);
            } else if (percentageSpent === 0) {
                 explanationP2.innerHTML = "We say \"Don't <em>waste</em> my time,\" \"I've <em>invested</em> a lot of time,\" or \"That <em>cost</em> me an hour.\" This treats time like a valuable resource, much like money.";
                 animateText(explanationP2);
            }
        });
    }

    // --- Page 3: Life is a Journey ---
    function resetPage3Metaphor() {
        if (!journeyPath || !traveler || !journeyBtnP3 || !explanationP3) return;
        cancelAnimationFrame(journeyAnimationId); 
        
        traveler.setAttribute('cx', '10'); 
        traveler.setAttribute('cy', '80');
        
        journeyPath.style.transition = 'none'; 
        journeyPath.style.strokeDashoffset = '500'; 
        void journeyPath.offsetWidth; 
        journeyPath.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.25, 0.1, 0.25, 1)'; 

        journeyBtnP3.textContent = "Start Journey";
        journeyBtnP3.disabled = false;
        explanationP3.innerHTML = "We talk about <em>goals</em> as destinations, <em>making progress</em>, facing <em>obstacles</em>, and finding our <em>path</em> in life. This frames life itself as a journey with a beginning, a middle, and an end.";
        journeyStarted = false;
    }

    if (journeyBtnP3 && journeyPath && traveler) {
        journeyBtnP3.addEventListener('click', () => {
            if (!explanationP3) return;
            if(!ensureAudioContextResumed()) return;
            if (journeyStarted) { 
                resetPage3Metaphor();
                return;
            }
            journeyStarted = true;
            journeyBtnP3.disabled = true;
            journeyBtnP3.textContent = "Journeying...";
            playNoteSequence(soundEffectsMetaphors.pathReveal);

            journeyPath.style.strokeDashoffset = '0';

            const pathLength = journeyPath.getTotalLength();
            const animationDuration = 4000; 
            let startTime = null;

            function animateTraveler(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / animationDuration, 1);
                
                if (journeyPath.getPointAtLength) { // Check if method exists
                    const point = journeyPath.getPointAtLength(progress * pathLength);
                    traveler.setAttribute('cx', point.x);
                    traveler.setAttribute('cy', point.y);
                }


                if (progress < 1) {
                    journeyAnimationId = requestAnimationFrame(animateTraveler);
                } else {
                    explanationP3.innerHTML = "The 'Life is a Journey' metaphor helps us structure our experiences, understand challenges as part of the path, and strive towards our goals (destinations).";
                    animateText(explanationP3);
                    journeyBtnP3.textContent = "Reset Journey";
                    journeyBtnP3.disabled = false; 
                }
            }
            setTimeout(() => {
                journeyAnimationId = requestAnimationFrame(animateTraveler);
            }, 500); 
        });
    }

    // Navigation
    if(nextPage1Btn) nextPage1Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(prevPage2Btn) prevPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(0); });
    if(nextPage2Btn) nextPage2Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(2); });
    if(prevPage3Btn) prevPage3Btn.addEventListener('click', () => { ensureAudioContextResumed(); showPage(1); });
    if(restartBtn) restartBtn.addEventListener('click', () => {
        ensureAudioContextResumed();
        resetPage1Metaphor(); 
        resetPage2Metaphor();
        resetPage3Metaphor();
        showPage(0);
    });

    hubReturnButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    });

    // Initialize
    showPage(0); 
});