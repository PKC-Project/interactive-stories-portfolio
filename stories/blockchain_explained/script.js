document.addEventListener('DOMContentLoaded', () => {
    const pages = [
        document.getElementById('page1-blockchain'),
        document.getElementById('page2-blockchain'),
        document.getElementById('page3-blockchain')
    ];
    const storyTexts = [
        document.getElementById('text-page1'),
        document.getElementById('text-page2'),
        document.getElementById('text-page3')
    ];

    const nextPage1Btn = document.getElementById('next-page1');
    const prevPage2Btn = document.getElementById('prev-page2');
    const nextPage2Btn = document.getElementById('next-page2');
    const prevPage3Btn = document.getElementById('prev-page3');
    const restartBtn = document.getElementById('restart-story-blockchain');
    const hubReturnButtons = document.querySelectorAll('.hub-return-button');

    // Page 1 specific
    const addToBlockBtn = document.getElementById('add-to-block-btn');
    const transactionsPool = document.getElementById('transactions-pool');
    const block1Svg = document.getElementById('block1-svg');
    const block1Text = document.getElementById('block1-text');
    let transactionsAdded = false;

    // Page 2 specific
    const generateHashBtn = document.getElementById('generate-hash-btn');
    const block1SealedP2 = document.getElementById('block1-sealed-p2');
    const hash1DisplayP2 = document.getElementById('hash1-display-p2');
    const hashingMachine = document.getElementById('hashing-machine');
    const block2NewP2 = document.getElementById('block2-new-p2');
    const prevHashInBlock2 = document.getElementById('prev-hash-in-block2');
    const hash2DisplayP2 = document.getElementById('hash2-display-p2');
    const chainLinkP2 = document.getElementById('chain-link-p2');
    let hashGeneratedP2 = false;
    let block1DataP2 = "TxA,TxB,TxC"; // Placeholder data

    // Page 3 specific
    const distributeBlockBtn = document.getElementById('distribute-block-btn');
    const tamperBlockBtn = document.getElementById('tamper-block-btn');
    const networkNodesGroup = document.getElementById('network-nodes');
    const blockchainInNetwork = document.getElementById('blockchain-in-network'); // The small chain to animate
    const tamperFeedbackEl = document.getElementById('tamper-feedback');
    const numNodes = 5;
    let nodes = [];
    let distributed = false;
    let tampered = false;


    let currentPageIndex = 0;
    let audioContext;
    let currentOscillators = [];
    let previousPageIndex = -1;
    let userInteracted = false;

    function ensureAudioContextResumed() { /* ... (same) ... */ }
    function stopAllSounds() { /* ... (same) ... */ }
    function playNoteSequence(notesConfig) { /* ... (same, with noise fallback) ... */ }
    
    const E = 0.125; const Q = 0.25; const H = 0.5; const W = 1.0;
    const soundEffectsBlockchain = {
        addTransaction: { overallVolume: 0.08, notes: [{freq: 600, duration: E*0.5, type: 'triangle'}, {freq: 700, duration: E*0.5, delay: E*0.6, type: 'triangle'}]},
        blockSealed: { overallVolume: 0.15, notes: [{freq: 300, duration: Q, type: 'square', volMultiplier: 1.2}, {freq: 200, duration: H, delay: Q*0.8, type: 'sawtooth'}]},
        hashGenerated: { overallVolume: 0.1, notes: [{freq: 800, duration: E, type:'sine'},{freq: 1200, duration: E, delay:E*0.9, type:'sine'},{freq:1000, duration:Q, delay:E*1.8, type:'sine'}]},
        chainLink: { overallVolume: 0.12, notes: [{freq: 250, duration: H*0.7, type: 'sawtooth', slideTo: 180}]},
        distribute: { overallVolume: 0.07, notes: [{freq: 400, duration:E, type:'triangle'},{freq: 400, duration:E, delay:E*1.2, type:'triangle'},{freq: 400, duration:E, delay:E*2.4, type:'triangle'}]},
        tamperAttempt: { overallVolume: 0.2, notes: [{freq: 150, duration: Q, type:'noise'}, {freq:100, duration:H, delay:Q*0.8, type:'noise', volMultiplier:1.5}]},
        tamperFail: { overallVolume: 0.18, notes: [{freq: 200, duration:H, type:'square', slideTo:50}]}
    };
    // (Copy initAudioContext, stopAllSounds, playNoteSequence, ensureAudioContextResumed, animateText from previous script)
    function initAudioContext() { if (!userInteracted) return null; if (!audioContext) { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.error("Error creating AudioContext:", e); return null; } } if (audioContext.state === 'suspended') { audioContext.resume().catch(e => console.error("Error resuming AudioContext on gesture:", e));} return audioContext; }
    function stopAllSounds() { currentOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} }); currentOscillators = []; }
    function playNoteSequence(notesConfig) { if (!initAudioContext() || !audioContext || audioContext.state !== 'running') return; stopAllSounds(); const now = audioContext.currentTime; const overallVolume = notesConfig.overallVolume || 0.08; notesConfig.notes.forEach(note => { let sn; const gn = audioContext.createGain(); gn.connect(audioContext.destination); if (note.type === 'noise') { const bs = audioContext.sampleRate * (note.duration || 0.1); const b = audioContext.createBuffer(1, bs, audioContext.sampleRate); const o = b.getChannelData(0); for (let i = 0; i < bs; i++) { o[i] = Math.random() * 2 - 1; } sn = audioContext.createBufferSource(); sn.buffer = b; sn.connect(gn); } else { sn = audioContext.createOscillator(); sn.type = note.type || 'sine'; sn.frequency.setValueAtTime(note.freq, now + (note.delay || 0)); if(note.slideTo) sn.frequency.linearRampToValueAtTime(note.slideTo, now + (note.delay || 0) + (note.duration || 0.1) * 0.8); sn.connect(gn); } gn.gain.setValueAtTime(0, now + (note.delay || 0)); gn.gain.linearRampToValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + 0.02); gn.gain.setValueAtTime(overallVolume * (note.volMultiplier || 1), now + (note.delay || 0) + (note.duration || 0.1) - 0.05); gn.gain.linearRampToValueAtTime(0.00001, now + (note.delay || 0) + (note.duration || 0.1)); sn.start(now + (note.delay || 0)); sn.stop(now + (note.delay || 0) + (note.duration || 0.1) + 0.05); currentOscillators.push(sn); }); }
    function ensureAudioContextResumed() { if (!userInteracted) { userInteracted = true; initAudioContext(); } else if (audioContext && audioContext.state === 'suspended') { audioContext.resume().catch(e => console.error("Error resuming AudioContext on gesture:", e)); } return audioContext && audioContext.state === 'running'; }
    function animateText(textElement) { if(textElement) { textElement.classList.remove('text-fade-in'); void textElement.offsetWidth; textElement.classList.add('text-fade-in'); } }


    function showPage(index) { 
        if (index < 0 || index >= pages.length || !pages[index]) return;
        const goingForward = index > previousPageIndex;
        if (previousPageIndex !== -1 && pages[previousPageIndex]) {
            pages[previousPageIndex].classList.remove('current-page');
            pages[previousPageIndex].classList.add(goingForward ? 'slide-out-left' : 'slide-out-right');
        }
        pages[index].classList.remove('slide-out-left', 'slide-out-right');
        pages[index].classList.add('current-page');
        currentPageIndex = index;
        previousPageIndex = index;
        
        if (storyTexts[currentPageIndex]) animateText(storyTexts[currentPageIndex]);
        // No general page music for this explainer, sounds are event-driven
        stopAllSounds(); 

        // Page specific resets/setups
        if (currentPageIndex === 0) resetPage1Blockchain();
        if (currentPageIndex === 1) resetPage2Blockchain();
        if (currentPageIndex === 2) { createNetworkNodes(); resetPage3Blockchain(); }
    }
    
    // --- Page 1: Transactions & Blocks ---
    function resetPage1Blockchain() {
        if(!transactionsPool || !block1Svg || !block1Text || !addToBlockBtn) return;
        transactionsAdded = false;
        const txs = transactionsPool.querySelectorAll('.transaction');
        txs.forEach((tx, i) => {
            tx.style.transform = 'translateX(0px)';
            tx.style.opacity = '1';
        });
        block1Svg.classList.remove('filled');
        block1Text.textContent = "Empty Block";
        addToBlockBtn.disabled = false;
    }
    if (addToBlockBtn) {
        addToBlockBtn.addEventListener('click', () => {
            if (transactionsAdded || !transactionsPool || !block1Svg || !block1Text) return;
            if(!ensureAudioContextResumed()) return;
            transactionsAdded = true;
            addToBlockBtn.disabled = true;
            const txs = transactionsPool.querySelectorAll('.transaction');
            txs.forEach((tx, i) => {
                tx.style.transform = `translateX(70px) translateY(${i*5}px)`; // Animate towards block
                tx.style.opacity = '0.3';
                playNoteSequence(soundEffectsBlockchain.addTransaction);
            });
            setTimeout(() => {
                block1Svg.classList.add('filled');
                block1Text.textContent = "Block 1 (Sealed)";
                playNoteSequence(soundEffectsBlockchain.blockSealed);
            }, 600); // After transactions "move"
        });
    }

    // --- Page 2: Chaining with Hashes ---
    // Simple hash function for demo
    function simpleHash(dataString) {
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return "0x" + Math.abs(hash).toString(16).toUpperCase().slice(0, 6); // Short hex
    }

    function resetPage2Blockchain() {
        if(!hash1DisplayP2 || !prevHashInBlock2 || !hash2DisplayP2 || !chainLinkP2 || !hashingMachine || !generateHashBtn) return;
        hashGeneratedP2 = false;
        hash1DisplayP2.textContent = "Hash: A1B2"; // Reset to initial placeholder
        prevHashInBlock2.textContent = "(Prev: ???)";
        hash2DisplayP2.textContent = "Hash: ???";
        chainLinkP2.style.strokeDashoffset = '50';
        chainLinkP2.classList.remove('draw');
        hashingMachine.classList.remove('active');
        generateHashBtn.disabled = false;
    }

    if (generateHashBtn) {
        generateHashBtn.addEventListener('click', () => {
            if (hashGeneratedP2 || !hashingMachine || !prevHashInBlock2 || !hash2DisplayP2 || !chainLinkP2) return;
            if(!ensureAudioContextResumed()) return;
            hashGeneratedP2 = true;
            generateHashBtn.disabled = true;
            hashingMachine.classList.add('active');
            playNoteSequence(soundEffectsBlockchain.hashGenerated);

            // Simulate hashing Block 1 (already has a hash)
            const hash1 = hash1DisplayP2.textContent.split(': ')[1];

            setTimeout(() => {
                prevHashInBlock2.textContent = `(Prev: ${hash1})`;
                // Simulate hashing Block 2 (its data + prev hash)
                const block2Data = "TxD,TxE,TxF" + hash1; // Simplified
                const hash2 = simpleHash(block2Data);
                hash2DisplayP2.textContent = `Hash: ${hash2}`;
                hashingMachine.classList.remove('active');
                
                // Animate chain link
                if(block1SealedP2 && block2NewP2) {
                    const b1Rect = block1SealedP2.getBoundingClientRect();
                    const b2Rect = block2NewP2.getBoundingClientRect();
                    const svgRect = block1SealedP2.closest('svg').getBoundingClientRect();

                    //Approximate connection points (centers of right/left edges)
                    const x1 = (b1Rect.right - svgRect.left) - 5; // a bit inside block1 right edge
                    const y1 = (b1Rect.top - svgRect.top) + b1Rect.height / 2;
                    const x2 = (b2Rect.left - svgRect.left) + 5; // a bit inside block2 left edge
                    const y2 = (b2Rect.top - svgRect.top) + b2Rect.height / 2;
                    
                    chainLinkP2.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
                    chainLinkP2.classList.add('draw'); // Trigger CSS animation
                    playNoteSequence(soundEffectsBlockchain.chainLink);
                }
            }, 1500); // Hashing time
        });
    }

    // --- Page 3: Decentralization & Immutability ---
    function createNetworkNodes() {
        if (!networkNodesGroup) return;
        networkNodesGroup.innerHTML = ''; // Clear old nodes
        nodes = [];
        const svgWidth = 175;
        const svgHeight = 80; // Area for nodes
        for (let i = 0; i < numNodes; i++) {
            const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
            const x = 20 + (i % 3) * 60 + Math.random()*10-5;
            const y = 20 + Math.floor(i / 3) * 40 + Math.random()*10-5;
            node.setAttribute('transform', `translate(${x}, ${y})`);
            node.innerHTML = `<rect class="network-node" width="20" height="20" rx="3" fill="#B0BEC5" stroke="#78909C" stroke-width="1"/>
                              <text x="10" y="13" font-size="5px" text-anchor="middle">Node ${i+1}</text>`;
            networkNodesGroup.appendChild(node);
            nodes.push(node.querySelector('.network-node'));
        }
    }

    function resetPage3Blockchain() {
        if(!distributeBlockBtn || !tamperBlockBtn || !tamperFeedbackEl || !blockchainInNetwork) return;
        distributed = false;
        tampered = false;
        distributeBlockBtn.disabled = false;
        tamperBlockBtn.disabled = true; // Enable after distribution
        tamperFeedbackEl.textContent = '';
        nodes.forEach(node => node.classList.remove('has-block', 'tampered'));
        const blocksInNet = blockchainInNetwork.querySelectorAll('.net-block');
        blocksInNet.forEach(b => b.classList.remove('tampered-block'));
        blockchainInNetwork.style.opacity = '0'; // Hide the small chain initially
    }

    if (distributeBlockBtn) {
        distributeBlockBtn.addEventListener('click', () => {
            if (distributed || !blockchainInNetwork) return;
            if(!ensureAudioContextResumed()) return;
            distributed = true;
            distributeBlockBtn.disabled = true;
            tamperBlockBtn.disabled = false; // Enable tampering after distribution
            playNoteSequence(soundEffectsBlockchain.distribute);

            // Animate the small blockchain moving to each node (simplified)
            blockchainInNetwork.style.opacity = '1';
            let delay = 0;
            nodes.forEach((node, i) => {
                setTimeout(() => {
                    node.classList.add('has-block');
                    // Could add a small chain SVG copy near each node if desired
                }, delay);
                delay += 300;
            });
        });
    }

    if (tamperBlockBtn) {
        tamperBlockBtn.addEventListener('click', () => {
            if (tampered || !distributed || !tamperFeedbackEl) return;
            if(!ensureAudioContextResumed()) return;
            tampered = true;
            tamperBlockBtn.disabled = true;
            playNoteSequence(soundEffectsBlockchain.tamperAttempt);

            tamperFeedbackEl.textContent = "Tampering Block 1... Hashes mismatch! Network rejects change!";
            
            // Visually show tampering
            const firstNode = nodes[0]; // Tamper the first node's copy
            if (firstNode) firstNode.classList.add('tampered');
            
            const blocksInNet = blockchainInNetwork.querySelectorAll('.net-block');
            if(blocksInNet[0]) blocksInNet[0].classList.add('tampered-block'); // Show the small chain as tampered

            setTimeout(() => {
                playNoteSequence(soundEffectsBlockchain.tamperFail);
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
        resetPage1Blockchain(); 
        resetPage2Blockchain();
        resetPage3Blockchain(); // Will also call createNetworkNodes if page 3 is shown
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