// script.js for The Myth Maker's Compendium (v3 - The Final Director's Cut)

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const appContainer = document.querySelector('.app-container');
    const formContainer = document.getElementById('myth-form-container');
    const storyContainer = document.getElementById('story-container');
    const mythForm = document.getElementById('myth-form');
    const storyContent = document.querySelector('.story-content');
    const storyTitle = document.getElementById('story-title');
    const storyIllustration = document.getElementById('story-illustration');
    const storyText = document.getElementById('story-text');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const restartButton = document.getElementById('restart-button');
    const styleSelector = document.getElementById('visual-style');

    // --- State ---
    let userInputs = {};
    let storyPages = [];
    let currentPage = 0;
    let audioCtx = null; // Audio context for sound effects

    // --- Barista's Note: Added an audio engine for UI sounds. ---
    function setupAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playSound(type) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'weave') {
            oscillator.type = 'triangle';
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.8);
        } else if (type === 'pageTurn') {
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.5);
        }
        
        oscillator.start(now);
        oscillator.stop(now + 1);
    }

    // --- Barista's Note: Illustrations now contain embedded CSS animations! ---
    const illustrations = {
        home: `<svg viewBox="0 0 200 100"><style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}#sun{transform-origin:center;animation:pulse 4s ease-in-out infinite}</style><rect width="200" height="100" fill="var(--svg-bg)"/><circle id="sun" cx="170" cy="30" r="10" fill="var(--svg-accent)"/><path d="M 0 100 C 40 80, 80 90, 120 70 L 200 100 Z" fill="var(--svg-c1)"/><path d="M 80 60 L 85 80 L 75 80 Z" fill="var(--svg-c2)"/><circle cx="80" cy="55" r="5" fill="var(--svg-c3)"/></svg>`,
        mentor: `<svg viewBox="0 0 200 100"><style>@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.5)}}#treasure-glow{animation:glow 3s ease-in-out infinite}</style><rect width="200" height="100" fill="var(--svg-bg)"/><path d="M 50 90 L 55 50 L 45 50 Z" fill="var(--svg-c3)"/><circle cx="50" cy="45" r="5" fill="var(--svg-c3)"/><path d="M 140 90 L 145 30 L 135 30 Z" fill="var(--svg-c2)"/><circle cx="140" cy="25" r="5" fill="var(--svg-c2)"/><rect id="treasure-glow" x="80" y="50" width="40" height="30" fill="var(--svg-accent)" stroke="var(--header-color)" rx="2"/></svg>`,
        journey: `<svg viewBox="0 0 200 100"><style>@keyframes dash{to{stroke-dashoffset:100}}#road{animation:dash 3s linear infinite}</style><rect width="200" height="100" fill="var(--svg-bg)"/><path d="M 20 80 L 25 60 L 15 60 Z" fill="var(--svg-c3)"/><circle cx="20" cy="55" r="5" fill="var(--svg-c3)"/><path id="road" d="M 0 90 Q 100 50, 200 90" stroke="var(--svg-c1)" stroke-width="4" fill="none" stroke-dasharray="10,10"/></svg>`,
        beast: `<svg viewBox="0 0 200 100"><style>@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}@keyframes glare{0%,100%{r:4}50%{r:5;filter:brightness(1.5)}}#beast-body{transform-origin:center;animation:breathe 5s ease-in-out infinite}#beast-eye{animation:glare 2s ease-in-out infinite}</style><rect width="200" height="100" fill="var(--svg-bg)"/><path id="beast-body" d="M 150 80 C 120 110, 80 20, 50 50" stroke="var(--svg-c3)" stroke-width="8" fill="none"/><circle id="beast-eye" cx="160" cy="30" r="4" fill="var(--svg-accent)"/><path d="M 30 90 L 35 70 L 25 70 Z" fill="var(--svg-c2)"/><circle cx="30" cy="65" r="5" fill="var(--svg-c2)"/></svg>`,
        triumph: `<svg viewBox="0 0 200 100"><style>@keyframes radiate{0%{stroke-width:2;opacity:1}100%{stroke-width:10;opacity:0}}#halo{animation:radiate 2s ease-out infinite}</style><rect width="200" height="100" fill="var(--svg-bg)"/><circle cx="170" cy="30" r="10" fill="var(--svg-accent)"/><path d="M 0 100 C 40 80, 80 90, 120 70 L 200 100 Z" fill="var(--svg-c1)"/><path d="M 80 60 L 85 80 L 75 80 Z" fill="var(--svg-c2)"/><circle cx="80" cy="55" r="5" fill="var(--svg-c3)"/><circle id="halo" cx="80" cy="40" r="10" fill="none" stroke="var(--svg-accent)"/></svg>`
    };

    // --- Core Functions ---
    function weaveMyth(e) {
        e.preventDefault();
        setupAudio(); // Initialize audio on first user interaction
        playSound('weave');

        const formData = new FormData(mythForm);
        userInputs = Object.fromEntries(formData.entries());
        if (Object.values(userInputs).some(val => typeof val === 'string' && val.trim() === '')) {
            alert('Please fill out all fields to weave your myth!');
            return;
        }
        appContainer.dataset.style = userInputs.visualStyle;
        generateStoryPages();
        formContainer.classList.add('hidden');
        storyContainer.classList.remove('hidden');
        currentPage = 0;
        renderPageContent();
    }
    
    function generateStoryPages() { /* ... this function is the same ... */
        const { hero, homeland, skill, treasure, beast, mentor } = userInputs;
        const twists = [
            { title: "A Shocking Betrayal", text: `But as ${hero} reached for the ${treasure}, a shadow fell upon them. It was ${mentor}! The wise mentor had orchestrated the entire quest, seeking the treasure's power for themself.`, illustration: illustrations.mentor },
            { title: "A Misunderstood Guardian", text: `As ${hero} prepared for a final blow, the ${beast} spoke, its voice weary. It was not a monster, but an ancient guardian protecting the ${treasure} from those who would misuse its power.`, illustration: illustrations.beast },
            { title: "The Treasure's True Nature", text: `Upon touching the ${treasure}, ${hero} was flooded with visions. It was not a source of power, but a key—a map to a hidden world, far beyond ${homeland}. The real journey was just beginning.`, illustration: illustrations.triumph }
        ];
        const randomTwist = twists[Math.floor(Math.random() * twists.length)];
        storyPages = [
            { title: "The Call to Adventure", text: `In the land of ${homeland}, a hero named ${hero} lived a quiet life, known for their incredible skill in ${skill}. But peace was not to last.`, illustration: illustrations.home },
            { title: "A Dire Warning", text: `The wise mentor, ${mentor}, arrived with grave news. The legendary ${treasure} was in peril, supposedly guarded by the fearsome ${beast} that terrorized the regions.`, illustration: illustrations.mentor },
            { title: "The Perilous Journey", text: `Heeding the call, ${hero} journeyed through treacherous lands, their resolve tested at every turn. The stories of the ${beast} echoed in their mind, fueling their determination.`, illustration: illustrations.journey },
            randomTwist,
            { title: "A Hero's Legacy", text: `And so, the tale of ${hero} became legend. Not just for their mastery of ${skill}, but for the unexpected wisdom they gained. The story of the ${treasure} and the ${beast} would be told for generations, a testament to a hero unlike any other.`, illustration: illustrations.triumph }
        ];
    }

    function renderPageContent() {
        const page = storyPages[currentPage];
        storyTitle.textContent = page.title;
        storyText.textContent = page.text;
        storyIllustration.innerHTML = page.illustration;
        updateButtons();
    }

    function changePage(direction) {
        if (storyContent.classList.contains('is-fading')) return;
        playSound('pageTurn');
        currentPage += direction;
        storyContent.classList.add('is-fading');
        setTimeout(() => {
            renderPageContent();
            storyContent.classList.remove('is-fading');
        }, 400);
    }

    function updateButtons() {
        prevButton.disabled = (currentPage === 0);
        nextButton.disabled = (currentPage === storyPages.length - 1);
        restartButton.classList.toggle('hidden', currentPage !== storyPages.length - 1);
        nextButton.classList.toggle('hidden', currentPage === storyPages.length - 1);
    }
    
    function startOver() {
        storyContainer.classList.add('hidden');
        formContainer.classList.remove('hidden');
        mythForm.reset();
        appContainer.dataset.style = 'parchment';
    }

    // --- Event Listeners ---
    mythForm.addEventListener('submit', weaveMyth);
    nextButton.addEventListener('click', () => changePage(1));
    prevButton.addEventListener('click', () => changePage(-1));
    restartButton.addEventListener('click', startOver);
    styleSelector.addEventListener('change', (e) => {
        appContainer.dataset.style = e.target.value;
    });
});