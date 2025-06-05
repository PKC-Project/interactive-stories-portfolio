// script.js for Melody Maker (V2 with color themes)

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const sequencerContainer = document.querySelector('.sequencer-container'); // Get main container
    const gridContainer = document.getElementById('grid-container');
    const playStopBtn = document.getElementById('play-stop-btn');
    const tempoSlider = document.getElementById('tempo-slider');
    const tempoDisplay = document.getElementById('tempo-display');
    const instrumentToggleBtn = document.getElementById('instrument-toggle-btn');
    const clearGridBtn = document.getElementById('clear-grid-btn');
    const playhead = document.getElementById('playhead');

    // --- Constants & State ---
    const NUM_BEATS = 8;
    const NUM_NOTES = 5;
    let gridState = Array(NUM_NOTES).fill(null).map(() => Array(NUM_BEATS).fill(false));
    let isPlaying = false;
    let tempo = 120;
    let currentBeat = 0;
    let intervalId = null;
    let instrumentType = 'sine'; // 'sine' or 'square'

    const scaleFrequencies = [523.25, 440, 392.00, 329.63, 261.63]; // C5, A4, G4, E4, C4

    // --- Web Audio API Setup ---
    let audioCtx = null;

    function playNote(frequency) {
        if (!audioCtx) return;

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const now = audioCtx.currentTime;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);

        oscillator.type = instrumentType;
        oscillator.frequency.setValueAtTime(frequency, now);

        oscillator.connect(gainNode).connect(audioCtx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    // --- Sequencer Logic ---
    function advanceBeat() {
        playhead.style.opacity = '1';
        playhead.style.left = `${(100 / NUM_BEATS) * currentBeat}%`;

        for (let noteIndex = 0; noteIndex < NUM_NOTES; noteIndex++) {
            const cell = document.querySelector(`.grid-cell[data-note='${noteIndex}'][data-beat='${currentBeat}']`);
            
            const prevBeat = (currentBeat === 0) ? NUM_BEATS - 1 : currentBeat - 1;
            const prevCell = document.querySelector(`.grid-cell[data-note='${noteIndex}'][data-beat='${prevBeat}']`);
            if (prevCell) prevCell.classList.remove('playing');
            
            if (gridState[noteIndex][currentBeat]) {
                playNote(scaleFrequencies[noteIndex]);
                if(cell) cell.classList.add('playing');
            }
        }
        currentBeat = (currentBeat + 1) % NUM_BEATS;
    }

    function startStop() {
        if (isPlaying) {
            clearInterval(intervalId);
            playStopBtn.innerHTML = '<span class="icon">▶</span><span class="text">Play</span>';
            playhead.style.opacity = '0';
            document.querySelectorAll('.playing').forEach(c => c.classList.remove('playing'));
        } else {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            currentBeat = 0;
            const interval = (60 / tempo) * 1000 / 2;
            intervalId = setInterval(advanceBeat, interval);
            playStopBtn.innerHTML = '<span class="icon">■</span><span class="text">Stop</span>';
        }
        isPlaying = !isPlaying;
    }

    // --- UI & Grid Initialization ---
    function createGrid() {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${NUM_BEATS}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${NUM_NOTES}, 1fr)`;
        playhead.style.width = `${100 / NUM_BEATS}%`;

        for (let noteIndex = 0; noteIndex < NUM_NOTES; noteIndex++) {
            for (let beatIndex = 0; beatIndex < NUM_BEATS; beatIndex++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.note = noteIndex;
                cell.dataset.beat = beatIndex;
                cell.addEventListener('click', () => {
                    gridState[noteIndex][beatIndex] = !gridState[noteIndex][beatIndex];
                    cell.classList.toggle('cell-on', gridState[noteIndex][beatIndex]);
                });
                gridContainer.appendChild(cell);
            }
        }
    }

    function updateTempo() {
        tempo = tempoSlider.value;
        tempoDisplay.textContent = `${tempo} bpm`;
        if (isPlaying) {
            clearInterval(intervalId);
            const interval = (60 / tempo) * 1000 / 2;
            intervalId = setInterval(advanceBeat, interval);
        }
    }

    function toggleInstrument() {
        instrumentType = instrumentType === 'sine' ? 'square' : 'sine';
        instrumentToggleBtn.textContent = instrumentType.charAt(0).toUpperCase() + instrumentType.slice(1);
        
        // --- THIS IS THE KEY CHANGE ---
        // Set the data attribute on the main container
        sequencerContainer.dataset.instrument = instrumentType;
    }
    
    function clearGrid() {
        gridState = Array(NUM_NOTES).fill(null).map(() => Array(NUM_BEATS).fill(false));
        document.querySelectorAll('.grid-cell.cell-on').forEach(c => c.classList.remove('cell-on'));
    }

    // --- Event Listeners ---
    playStopBtn.addEventListener('click', startStop);
    tempoSlider.addEventListener('input', updateTempo);
    instrumentToggleBtn.addEventListener('click', toggleInstrument);
    clearGridBtn.addEventListener('click', clearGrid);

    // --- Initial Call ---
    function init() {
        createGrid();
        // Set the initial data attribute
        sequencerContainer.dataset.instrument = instrumentType;
    }

    init();
});