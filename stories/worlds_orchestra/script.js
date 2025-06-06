// script.js for The World's Orchestra (v2 - Refactored)

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const yearSlider = document.getElementById('year-slider');
    const yearDisplay = document.getElementById('year-display');
    const mapPaths = document.querySelectorAll('#world-map path');
    const tooltip = document.getElementById('tooltip');

    // --- State, Audio Context, and Constants ---
    let audioCtx = null;
    const regionAudioNodes = {};
    const baseFrequencies = { 'na': 110, 'sa': 130.8, 'eu': 146.8, 'af': 164.8, 'as': 196, 'au': 220 }; // A2 to A3
    const MASTER_VOLUME = 0.15; // Controls the orchestra's max volume

    // --- Data: The Single Source of Truth (Interpolated) ---
    const climateData = { /* ... your data object remains the same ... */ 
        'na': { 1980: 0.43, 1990: 0.58, 2000: 0.73, 2010: 1.03, 2020: 1.63, 2022: 1.81 },
        'sa': { 1980: 0.12, 1990: 0.29, 2000: 0.45, 2010: 0.82, 2020: 1.18, 2022: 1.35 },
        'eu': { 1980: 0.65, 1990: 1.05, 2000: 1.48, 2010: 1.70, 2020: 2.31, 2022: 2.50 },
        'af': { 1980: 0.22, 1990: 0.48, 2000: 0.65, 2010: 0.95, 2020: 1.29, 2022: 1.40 },
        'as': { 1980: 0.38, 1990: 0.45, 2000: 1.01, 2010: 1.45, 2020: 1.88, 2022: 2.10 },
        'au': { 1980: 0.18, 1990: 0.73, 2000: 0.61, 2010: 0.90, 2020: 1.15, 2022: 1.25 }
    };
    for(const region in climateData) {
        const years = Object.keys(climateData[region]).map(Number);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        for(let year = minYear; year <= maxYear; year++) {
            if(!climateData[region][year]) {
                const prevYear = Math.max(...years.filter(y => y < year));
                const nextYear = Math.min(...years.filter(y => y > year));
                const prevVal = climateData[region][prevYear];
                const nextVal = climateData[region][nextYear];
                const interpolated = prevVal + (nextVal - prevVal) * (year - prevYear) / (nextYear - prevYear);
                climateData[region][year] = Math.round(interpolated * 100) / 100;
            }
        }
    }

    // --- Data Mapping Functions ---
    // Barista's Note: Improved color function for better visual distinction at lower values.
    function getColorForValue(value) {
        const clampedVal = Math.max(-0.5, Math.min(2.5, value));
        const t = (clampedVal + 0.5) / 3.0;
        let r, g, b;
        if (t < 0.5) {
            const localT = t * 2;
            r = 100 + (240 - 100) * localT; g = 100 + (240 - 100) * localT; b = 255;
        } else {
            const localT = (t - 0.5) * 2;
            r = 255; g = 240 - (240 - 80) * localT; b = 240 - (240 - 80) * localT;
        }
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    function getFrequencyForValue(value, regionId) {
        return baseFrequencies[regionId] * Math.pow(2, value / 6);
    }

    // --- Web Audio Setup & Control ---
    // Barista's Note: This is the core audio fix. We control volume (gain) instead of starting/stopping.
    function setupAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioCtx) {
            console.error("Web Audio API not supported.");
            return;
        }

        for (const id in baseFrequencies) {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = baseFrequencies[id];
            gainNode.gain.value = 0; // START SILENTLY

            oscillator.connect(gainNode).connect(audioCtx.destination);
            oscillator.start();
            
            regionAudioNodes[id] = { oscillator, gainNode };
        }
    }

    function startOrchestra() {
        if (!audioCtx) setupAudio();
        // Resume audio context if it was suspended
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        for (const id in regionAudioNodes) {
            regionAudioNodes[id].gainNode.gain.setTargetAtTime(MASTER_VOLUME, audioCtx.currentTime, 0.05);
        }
    }
    
    function stopOrchestra() {
        if (!audioCtx) return;
        for (const id in regionAudioNodes) {
            regionAudioNodes[id].gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2); // Slower fade out
        }
    }

    // --- Core Update Function ---
    function updateStateForYear(year) {
        yearDisplay.textContent = year;

        for (const regionId in climateData) {
            const path = document.getElementById(regionId);
            const dataPoint = climateData[regionId][year];
            
            if (path && dataPoint !== undefined) {
                path.style.fill = getColorForValue(dataPoint);

                if (regionAudioNodes[regionId]) {
                    const { oscillator } = regionAudioNodes[regionId];
                    const newFreq = getFrequencyForValue(dataPoint, regionId);
                    oscillator.frequency.setTargetAtTime(newFreq, audioCtx.currentTime, 0.1);
                }
            }
        }
    }

    // --- Event Listeners ---
    // Barista's Note: New listeners to control the audio start/stop via gain.
    yearSlider.addEventListener('mousedown', startOrchestra);
    yearSlider.addEventListener('touchstart', startOrchestra, { passive: true });

    document.addEventListener('mouseup', stopOrchestra);
    document.addEventListener('touchend', stopOrchestra);

    yearSlider.addEventListener('input', () => {
        updateStateForYear(yearSlider.value);
    });
    
    mapPaths.forEach(path => {
        path.addEventListener('mousemove', (e) => {
            const regionName = path.getAttribute('name');
            const year = yearSlider.value;
            const dataValue = climateData[path.id][year];
            if(dataValue === undefined) return;
            
            tooltip.innerHTML = `<strong>${regionName}</strong><br>${year}: ${dataValue > 0 ? '+' : ''}${dataValue}°C`;
            tooltip.classList.remove('hidden');
            tooltip.style.left = `${e.pageX}px`;
            tooltip.style.top = `${e.pageY}px`;
        });
        
        path.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
    });

    // --- Initial State ---
    function init() {
       updateStateForYear(yearSlider.value);
    }

    init();
});