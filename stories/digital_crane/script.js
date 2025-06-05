// script.js for The Digital Crane (V2 - Complete)

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const svgContainer = document.getElementById('svg-container');
    const instructionText = document.getElementById('instruction-text');
    const subtitle = document.getElementById('subtitle');
    
    const beginBtn = document.getElementById('btn-begin');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const finalizeBtn = document.getElementById('btn-finalize');
    const restartBtn = document.getElementById('btn-restart');

    // --- State Management ---
    let currentStep = -1;
    let origamiSVG = null;

    // --- Audio Context ---
    let audioCtx = null;

    // --- COMPLETE Origami Fold Data ---
    // This is the heart of the PKC framework, now expanded to be accurate.
    // We use a 400x400 paper on a 500x500 viewbox (margin of 50).
    // Center is (250, 250).
    const foldSteps = [
        // Step 0: Start
        {
            instruction: "Step 1: Start with the colored side up. Fold the paper in half diagonally.",
            guideLines: [{ d: "M 50 50 L 450 450" }],
            paths: {
                "base": { d: "M 50 50 L 450 50 L 450 450 L 50 450 Z", fill: "#ffffff" },
                "flap1": { d: "M 50 50 L 450 50 L 450 450 L 50 450 Z", fill: "#4fc3f7" }
            }
        },
        // Step 1: Diagonal Fold
        {
            instruction: "Step 2: Fold the resulting triangle in half again.",
            guideLines: [{ d: "M 50 450 L 450 450" }],
            paths: {
                "base": { d: "M 50 50 L 450 450 L 50 450 Z", fill: "#ffffff" },
                "flap1": { d: "M 50 50 L 450 450 L 50 450 Z", fill: "#ffffff" }
            }
        },
        // Step 2: Smaller Triangle
        {
            instruction: "Step 3: Open the top flap back up to the larger triangle.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 250 L 450 450 L 50 450 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 250 L 450 450 L 50 450 Z", fill: "#ffffff" }
            }
        },
        // Step 3: Open for Squash Fold
        {
            instruction: "Step 4: Take the top corner and squash it down into a square.",
            guideLines: [{ d: "M 250 50 L 250 450"}],
            paths: {
                "base": { d: "M 50 50 L 450 450 L 50 450 Z", fill: "#ffffff" },
                "flap1": { d: "M 50 50 L 450 450 L 50 450 Z", fill: "#ffffff" }
            }
        },
        // Step 4: Squash Fold Complete (Preliminary Base - Side A)
        {
            instruction: "Step 5: Flip the entire model over.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" }
            }
        },
        // Step 5: Flipped Over
        {
            instruction: "Step 6: Fold the right flap over to the left.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff", transform: "scale(-1, 1)", "transform-origin": "center"  }
            }
        },
        // Step 6: Prepared for second squash
        {
            instruction: "Step 7: Now, squash the left flap down into a square, completing the 'Preliminary Base'.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 50 L 250 450 L 50 250 Z", fill: "#ffffff" }
            }
        },
        // Step 7: Preliminary Base Complete
        {
            instruction: "Step 8: With the open end toward you, fold the top layers into the center line.",
            guideLines: [{d: "M 50 250 L 250 450"}, {d: "M 450 250 L 250 450"}],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" }
            }
        },
        // Step 8: Kite Fold
        {
            instruction: "Step 9: Fold the top triangle down to create a crease, then unfold it.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 250 L 150 250 L 250 450 L 350 250 Z", fill: "#4fc3f7" }
            }
        },
        // Step 9: Crease for Petal Fold
        {
            instruction: "Step 10: Unfold the side flaps you just made.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 250 L 250 50 L 350 250 Z", fill: "#4fc3f7" }
            }
        },
        // Step 10: Unfolded
        {
            instruction: "Step 11: Perform a 'Petal Fold' by opening the bottom point and folding it all the way up, collapsing the sides inward.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" }
            }
        },
        // Step 11: Petal Fold Complete (Bird Base - Side A)
        {
            instruction: "Step 12: Flip the model over and repeat.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 250 L 250 50 L 350 250 L 250 450 L 150 250 Z", fill: "#4fc3f7" }
            }
        },
        // Step 12: Flipped Over
        {
            instruction: "Step 13: Fold the top layers into the center line again.",
            guideLines: [{d: "M 50 250 L 250 450"}, {d: "M 450 250 L 250 450"}],
            paths: {
                 "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                 "flap1": { d: "M 250 250 L 250 50 L 350 250 L 250 450 L 150 250 Z", fill: "#4fc3f7" }
            }
        },
        // Step 13: Kite Fold (Side B)
        {
            instruction: "Step 14: Now perform the second Petal Fold to complete the 'Bird Base'.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 250 L 150 250 L 250 450 L 350 250 Z", fill: "#4fc3f7" }
            }
        },
        // Step 14: Bird Base Complete
        {
            instruction: "Step 15: Fold the outer flaps to the center to narrow the neck and tail points.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 450 250 L 250 450 L 50 250 Z", fill: "#ffffff" },
                "flap1": { d: "M 250 250 L 250 50 L 350 250 L 250 450 L 150 250 Z", fill: "#4fc3f7" }
            }
        },
        // Step 15: Narrowed
        {
            instruction: "Step 16: Perform an 'inside reverse fold' on one point to create the head.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 275 275 L 250 450 L 225 275 Z", fill: "#4fc3f7" },
                "flap1": { d: "M 250 50 L 275 275 L 250 450 L 225 275 Z", fill: "#4fc3f7" }
            }
        },
        // Step 16: Head Formed
        {
            instruction: "Step 17: Perform another inside reverse fold for the tail.",
            guideLines: [],
            paths: {
                "base": { d: "M 250 50 L 275 275 L 250 450 L 225 275 Z", fill: "#4fc3f7" },
                "flap1": { d: "M 225 200 L 200 225 L 250 300 L 250 450 Z", fill: "#4fc3f7" }
            }
        },
        // Step 17: Tail Formed
        {
            instruction: "Step 18: Fold down the wings.",
            guideLines: [],
            paths: {
                "base": { d: "M 325 175 L 200 225 L 250 300 L 250 450 Z", fill: "#4fc3f7" },
                "flap1": { d: "M 175 175 L 300 225 L 250 300 L 250 450 Z", fill: "#4fc3f7", transform: "scale(-1, 1)", "transform-origin": "center" }
            }
        },
        // Step 18: Wings down
        {
            instruction: "Step 19: Almost there! Pull the wings gently apart.",
            guideLines: [],
            paths: {
                "base": { d: "M 350 200 L 225 250 L 250 325 L 275 350 L 300 325 Z", fill: "#ffffff", "stroke": "#333", "stroke-width": "2" },
                "flap1": { d: "M 150 200 L 275 250 L 250 325 L 225 350 L 200 325 Z", fill: "#ffffff", "stroke": "#333", "stroke-width": "2" }
            }
        },
        // Step 19: The Finished Crane
        {
            instruction: "Congratulations! You have folded a digital crane.",
            guideLines: [],
            paths: {
                 "base": { id:"right-wing", d: "M 250 250 C 350 150, 450 200, 450 200 L 270 260 Z", fill:"#ffffff", "stroke": "#333", "stroke-width": "2" },
                 "flap1": { id:"left-wing", d: "M 250 250 C 150 150, 50 200, 50 200 L 230 260 Z", fill:"#ffffff", "stroke": "#333", "stroke-width": "2" },
                 "body": { d: "M 250 240 L 220 380 L 250 350 L 280 380 Z", fill: "#ffffff", "stroke": "#333", "stroke-width": "2"},
                 "head": { d: "M 250 240 C 250 200, 200 180, 180 200 C 190 210, 220 230, 230 240 Z", fill: "#ffffff", "stroke": "#333", "stroke-width": "2"}
            }
        }
    ];


    // --- Web Audio API Sound Engine ---
    function playSound(type) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        
        if (type === 'fold') {
            const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            noise.connect(gain).connect(audioCtx.destination);
            noise.start(now);
            noise.stop(now + 0.1);
        } else if (type === 'complete') {
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.connect(gain).connect(audioCtx.destination);
            oscillator.frequency.setValueAtTime(523.25, now); // C5
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            oscillator.start(now);
            oscillator.stop(now + 0.4);
        }
    }


    // --- Core Rendering Functions ---
    function createInitialPaper() {
        if (origamiSVG) origamiSVG.remove();
        origamiSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        origamiSVG.setAttribute("id", "origami-svg");
        origamiSVG.setAttribute("viewBox", "0 0 500 500");
        
        svgContainer.innerHTML = ''; // Clear previous SVG
        svgContainer.appendChild(origamiSVG);
        
        // This is crucial for a reset. We must recreate paths.
        const initialStep = foldSteps[0];
        for (const id in initialStep.paths) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("id", id);
            origamiSVG.appendChild(path);
        }
    }
    
    function renderStep(stepNumber) {
        if (stepNumber < 0 || stepNumber >= foldSteps.length) return;

        const stepData = foldSteps[stepNumber];
        
        instructionText.style.opacity = 0;
        setTimeout(() => {
            instructionText.textContent = stepData.instruction;
            instructionText.style.opacity = 1;
        }, 300);

        // This new logic handles a dynamic number of paths per step
        const existingPaths = {};
        origamiSVG.querySelectorAll('path').forEach(p => existingPaths[p.id] = p);
        
        for (const id in stepData.paths) {
            let pathElement = existingPaths[id];
            if (!pathElement) { // If a path doesn't exist (e.g., 'body' in final step), create it
                pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathElement.setAttribute("id", id);
                origamiSVG.appendChild(pathElement);
            }
            const pathData = stepData.paths[id];
            pathElement.setAttribute("d", pathData.d);
            pathElement.setAttribute("fill", pathData.fill);
            if (pathData.transform) {
                 pathElement.setAttribute("transform", pathData.transform);
                 pathElement.setAttribute("transform-origin", pathData['transform-origin']);
            } else {
                 pathElement.removeAttribute("transform");
            }
             if (pathData.stroke) {
                pathElement.setAttribute("stroke", pathData.stroke);
                pathElement.setAttribute("stroke-width", pathData['stroke-width']);
            } else {
                pathElement.removeAttribute("stroke");
                pathElement.removeAttribute("stroke-width");
            }
        }

        // Clean up old guide lines
        document.querySelectorAll('.guide-line').forEach(line => line.remove());
        const nextStepData = foldSteps[stepNumber + 1];
        if (nextStepData && nextStepData.guideLines) {
            setTimeout(() => {
                 nextStepData.guideLines.forEach(lineData => {
                    const guide = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    guide.setAttribute("class", "guide-line");
                    guide.setAttribute("d", lineData.d);
                    guide.setAttribute("fill", "none");
                    origamiSVG.appendChild(guide);
                });
            }, 600);
        }
    }

    // --- UI State Management ---
    function updateUIState() {
        [beginBtn, prevBtn, nextBtn, finalizeBtn, restartBtn].forEach(btn => btn.classList.add('hidden'));

        if (currentStep === -1) {
            beginBtn.classList.remove('hidden');
        } else if (currentStep === foldSteps.length) {
            restartBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.remove('hidden');
            if (currentStep === foldSteps.length - 1) {
                finalizeBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
            }
            prevBtn.disabled = (currentStep === 0);
        }
    }

    // --- Event Handlers ---
    beginBtn.addEventListener('click', () => {
        playSound('fold');
        currentStep = 0;
        renderStep(currentStep);
        updateUIState();
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < foldSteps.length - 1) {
            playSound('fold');
            currentStep++;
            renderStep(currentStep);
            updateUIState();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            playSound('fold');
            currentStep--;
            renderStep(currentStep);
            updateUIState();
        }
    });
    
    finalizeBtn.addEventListener('click', () => {
        playSound('complete');
        currentStep = foldSteps.length; 
        
        document.querySelectorAll('.guide-line').forEach(line => line.remove());
        instructionText.textContent = "A symbol of hope takes flight. Well done.";
        subtitle.style.opacity = 0;

        // Animate the final crane
        const rightWing = document.getElementById('right-wing');
        const leftWing = document.getElementById('left-wing');
        if (rightWing && leftWing) {
            // A simple flap animation using CSS transforms
            rightWing.style.animation = "flap-right 0.8s ease-in-out infinite alternate";
            leftWing.style.animation = "flap-left 0.8s ease-in-out infinite alternate";
        }
        origamiSVG.classList.add('animate-fly-away');
        
        // Add keyframes for flapping to the stylesheet dynamically
        const styleSheet = document.styleSheets[0];
        styleSheet.insertRule("@keyframes flap-right { from { transform: rotate(0deg); } to { transform: rotate(-15deg); } }", styleSheet.cssRules.length);
        styleSheet.insertRule("@keyframes flap-left { from { transform: rotate(0deg); } to { transform: rotate(15deg); } }", styleSheet.cssRules.length);
        
        // Let it fly for 3 seconds before resetting
        setTimeout(() => {
            origamiSVG.style.animation = ""; // Stop flying to allow restart
            updateUIState();
        }, 3000);
    });

    restartBtn.addEventListener('click', () => {
        currentStep = -1;
        instructionText.textContent = "A single sheet, a world of possibility. Let us begin the journey of the crane.";
        subtitle.style.opacity = 1;
        createInitialPaper();
        renderStep(0); // Render the initial state correctly
        document.querySelectorAll('.guide-line').forEach(line => line.remove()); // Clean guides
        updateUIState();
    });

    // --- Initialization ---
    function init() {
        createInitialPaper();
        updateUIState();
    }

    init();
});