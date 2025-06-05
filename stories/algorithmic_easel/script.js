// script.js for The Algorithmic Easel

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const styleSelect = document.getElementById('style-select');
    const paletteSelect = document.getElementById('palette-select');
    const densitySlider = document.getElementById('density-slider');
    const densityValue = document.getElementById('density-value');
    const generateBtn = document.getElementById('generate-btn');
    const saveBtn = document.getElementById('save-btn');
    const downloadBtn = document.getElementById('download-btn');
    const svgCanvas = document.getElementById('svg-canvas');
    const galleryGrid = document.getElementById('gallery-grid');

    // --- Data: The core of the PKC concept ---
    const palettes = {
        "Sunset Warmth": ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#90be6d"],
        "Oceanic Blues": ["#001219", "#005f73", "#0a9396", "#94d2bd", "#e0fbfc"],
        "Forest Greens": ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"],
        "Monochrome": ["#000000", "#495057", "#adb5bd", "#dee2e6", "#ffffff"],
        "Neon Dreams": ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"]
    };

    // --- State ---
    let isGenerating = false;
    let audioCtx = null;

    // --- Utility Functions ---
    const getRandomNumber = (min, max) => Math.random() * (max - min) + min;
    const getRandomColor = () => {
        const currentPalette = palettes[paletteSelect.value];
        return currentPalette[Math.floor(Math.random() * currentPalette.length)];
    };

    // --- Web Audio API Sound Engine ---
    const playSound = (style) => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        gainNode.connect(audioCtx.destination);
        
        if (style === 'stroke' || style === 'curve') {
            const oscillator = audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(getRandomNumber(300, 800), now);
            oscillator.connect(gainNode);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
        } else if (style === 'shape') {
            const noise = audioCtx.createBufferSource();
            const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            noise.connect(gainNode);
            noise.start(now);
            noise.stop(now + 0.1);
        }
    };

    // --- Drawing Helper Functions ---
    const drawChaoticStroke = (svg) => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', getRandomNumber(0, 100));
        line.setAttribute('y1', getRandomNumber(0, 100));
        line.setAttribute('x2', getRandomNumber(0, 100));
        line.setAttribute('y2', getRandomNumber(0, 100));
        line.setAttribute('stroke', getRandomColor());
        line.setAttribute('stroke-width', getRandomNumber(0.1, 1.5));
        line.setAttribute('opacity', getRandomNumber(0.5, 1));
        svg.appendChild(line);
        playSound('stroke');
    };

    const drawGeometricField = (svg) => {
        const choice = Math.random();
        if (choice > 0.5) { // Draw a rectangle
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute('x', getRandomNumber(0, 90));
            rect.setAttribute('y', getRandomNumber(0, 90));
            rect.setAttribute('width', getRandomNumber(5, 40));
            rect.setAttribute('height', getRandomNumber(5, 40));
            rect.setAttribute('fill', getRandomColor());
            rect.setAttribute('opacity', getRandomNumber(0.6, 1));
            svg.appendChild(rect);
        } else { // Draw a circle
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', getRandomNumber(10, 90));
            circle.setAttribute('cy', getRandomNumber(10, 90));
            circle.setAttribute('r', getRandomNumber(5, 25));
            circle.setAttribute('fill', getRandomColor());
            circle.setAttribute('opacity', getRandomNumber(0.6, 1));
            svg.appendChild(circle);
        }
        playSound('shape');
    };

    const drawFlowingCurve = (svg) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M ${getRandomNumber(0, 100)} ${getRandomNumber(0, 100)} Q ${getRandomNumber(0, 100)} ${getRandomNumber(0, 100)}, ${getRandomNumber(0, 100)} ${getRandomNumber(0, 100)}`;
        path.setAttribute('d', d);
        path.setAttribute('stroke', getRandomColor());
        path.setAttribute('stroke-width', getRandomNumber(0.2, 1));
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', getRandomNumber(0.7, 1));
        svg.appendChild(path);
        playSound('curve');
    };

    // --- Core Generation Function ---
    const generateArt = async () => {
        if (isGenerating) return;
        isGenerating = true;
        generateBtn.disabled = true;
        generateBtn.textContent = 'Creating...';
        
        svgCanvas.innerHTML = '';
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svgCanvas.appendChild(svg);
        
        const style = styleSelect.value;
        const density = densitySlider.value;

        for (let i = 0; i < density; i++) {
            switch (style) {
                case 'chaotic-strokes':
                    drawChaoticStroke(svg);
                    break;
                case 'geometric-fields':
                    drawGeometricField(svg);
                    break;
                case 'flowing-curves':
                    drawFlowingCurve(svg);
                    break;
            }
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    };

    // --- Gallery & Download Functions ---
    const saveToGallery = () => {
        const currentSVG = svgCanvas.querySelector('svg');
        if (!currentSVG) return;
        
        const thumbnail = document.createElement('div');
        thumbnail.classList.add('gallery-thumbnail');
        thumbnail.innerHTML = currentSVG.outerHTML;
        thumbnail.addEventListener('click', () => {
            svgCanvas.innerHTML = thumbnail.innerHTML;
        });
        galleryGrid.prepend(thumbnail);
    };
    
    const downloadSVG = () => {
        const svgData = svgCanvas.innerHTML;
        if (!svgData) return;
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `algorithmic-easel-${new Date().getTime()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // --- Initialization & Event Listeners ---
    function init() {
        // Populate palettes
        for (const name in palettes) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            paletteSelect.appendChild(option);
        }
        
        densitySlider.addEventListener('input', () => {
            densityValue.textContent = densitySlider.value;
        });
        
        generateBtn.addEventListener('click', generateArt);
        saveBtn.addEventListener('click', saveToGallery);
        downloadBtn.addEventListener('click', downloadSVG);

        // Create initial artwork
        generateArt();
    }

    init();
});