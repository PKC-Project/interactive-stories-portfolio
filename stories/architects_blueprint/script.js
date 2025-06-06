// script.js for The Architect's Blueprint (v3 - Polished)

document.addEventListener('DOMContentLoaded', () => {

    const svg = document.getElementById('house-svg');
    const hotspots = {
        foundation: document.getElementById('hotspot-foundation'),
        hearth: document.getElementById('hotspot-hearth'),
        roof: document.getElementById('hotspot-roof'),
        windows: document.getElementById('hotspot-windows'),
        openPlan: document.getElementById('hotspot-open-plan')
    };
    
    const animationLayer = document.getElementById('animation-layer');
    const tooltip = document.getElementById('tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipText = document.getElementById('tooltip-text');
    const svgNS = "http://www.w3.org/2000/svg";

    let audioCtx = null;
    let ambientSources = {};

    // --- Audio Engine (No changes needed here) ---
    function setupAudio() { /* ... same as previous ... */
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        playAmbientSound('wind', true);
        playAmbientSound('fire', true);
    }
    document.body.addEventListener('click', setupAudio, { once: true });
    
    function playAmbientSound(type, start = true) { /* ... same as previous ... */
        if (!audioCtx) return;
        if (!start) { if (ambientSources[type]) { ambientSources[type].noise.stop(); delete ambientSources[type]; } return; }
        if (ambientSources[type]) return;
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer; noise.loop = true;
        if (type === 'wind') { filter.type = 'lowpass'; filter.frequency.value = 400; gainNode.gain.value = 0.02; } 
        else { filter.type = 'bandpass'; filter.frequency.value = 1000; filter.Q.value = 5; gainNode.gain.value = 0.06; }
        noise.connect(filter).connect(gainNode).connect(audioCtx.destination);
        noise.start();
        ambientSources[type] = { noise, gain: gainNode };
    }
    
    function playSound(type, options = {}) { /* ... same as previous ... */
         if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        const osc = audioCtx.createOscillator();
        osc.type = options.wave || 'sine';
        osc.frequency.setValueAtTime(options.freq || 220, now);
        osc.connect(gainNode);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(options.attackVol || 0.3, now + (options.attack || 0.01));
        gainNode.gain.linearRampToValueAtTime(0, now + (options.duration || 0.5));
        osc.start(now);
        osc.stop(now + (options.duration || 0.5));
    }
    
    // --- Dynamic Tooltip Positioning (THE FIX IS HERE) ---
    function showTooltip(key, event) {
        const info = content[key];
        tooltipTitle.textContent = info.title;
        tooltipText.textContent = info.text;

        const svgPoint = svg.createSVGPoint();
        svgPoint.x = event.clientX;
        svgPoint.y = event.clientY;
        const { x: cursorX, y: cursorY } = svgPoint.matrixTransform(svg.getScreenCTM().inverse());
        
        const tooltipWidth = 250;
        const tooltipHeight = 150;
        const offset = 20;
        const svgHeight = 500;
        const svgWidth = 800;

        let finalX = cursorX + offset;
        let finalY = cursorY + offset;

        // If tooltip goes off the right edge, flip it to the left of the cursor
        if (finalX + tooltipWidth > svgWidth) {
            finalX = cursorX - tooltipWidth - offset;
        }

        // If tooltip goes off the bottom edge, flip it above the cursor
        if (finalY + tooltipHeight > svgHeight) {
            finalY = cursorY - tooltipHeight - offset;
        }

        // Ensure it doesn't go off the top or left edges either
        if (finalX < 0) finalX = offset;
        if (finalY < 0) finalY = offset;


        tooltip.setAttribute('x', finalX);
        tooltip.setAttribute('y', finalY);
        tooltip.style.visibility = 'visible';

        if(info.action) info.action();
    }
    
    const removeElementAfter = (el, duration) => { /* ... same as previous ... */ 
        setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, duration);
    };

    // --- Interaction Definitions (No changes needed here) ---
    const content = {
        foundation: { /*...*/
             title: 'Organic Architecture',
            text: 'A house should be "of the hill," not on it. The building should grow from its site as a natural part of the landscape.',
            action: () => {
                playSound('note', { freq: 82.41, duration: 1.5, attackVol: 0.2 });
                const root = document.createElementNS(svgNS, 'path');
                root.setAttribute('d', 'M 300 450 C 250 520, 200 520, 150 550');
                root.setAttribute('class', 'foundation-root');
                animationLayer.appendChild(root);
                removeElementAfter(root, 1500);
            }
        },
        hearth: { /*...*/
             title: 'The Heart of the Home',
            text: 'The hearth is the psychological center. Wright believed the fireplace was the gathering point from which all other spaces should flow.',
            action: () => {
                playSound('note', { freq: 164.81, duration: 1.5, attack: 0.2, attackVol: 0.15 });
                const line1 = document.createElementNS(svgNS, 'path');
                line1.setAttribute('d', 'M 300 315 C 200 315, 150 280, 130 250');
                line1.setAttribute('class', 'hearth-radiate-line');
                animationLayer.appendChild(line1);
                removeElementAfter(line1, 1500);
            }
        },
        roof: { /*...*/
             title: 'Shelter & Openness',
            text: 'A long, low roof provides shelter, while "ribbons" of windows dissolve the walls, breaking the box and connecting the interior to nature.',
             action: () => {
                playSound('note', { freq: 329.63, attackVol: 0.1 }); 
                const line = document.createElementNS(svgNS, 'path');
                line.setAttribute('d', 'M 250 260 H 750');
                line.setAttribute('class', 'sight-line');
                animationLayer.appendChild(line);
                removeElementAfter(line, 1500);
            }
        },
        windows: { title: 'Connecting to Nature', text: 'Windows are not holes in walls, but transparent screens. Grouping them creates panoramic views that make the landscape part of the room.', action: () => content.roof.action() },
        openPlan: { /*...*/ 
            title: 'Destroying the Box',
            text: 'Wright rejected rigid rooms. He created flowing, open spaces that encouraged interaction and freedom of movement.',
            action: () => {
                playSound('note', { freq: 123.47, wave: 'square', duration: 1.0, attackVol: 0.05 });
                 const wall1 = document.createElementNS(svgNS, 'path');
                 wall1.setAttribute('d', 'M275, 225 V 335');
                 wall1.setAttribute('class', 'old-wall');
                 animationLayer.appendChild(wall1);
                 removeElementAfter(wall1, 1500);
            }
        }
    };
    
    // --- Event Listeners ---
    Object.keys(hotspots).forEach(key => {
        hotspots[key].addEventListener('click', (event) => {
            showTooltip(key, event);
        });
        hotspots[key].addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
        });
    });
});