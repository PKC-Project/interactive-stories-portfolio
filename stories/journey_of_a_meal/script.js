// script.js for The Journey of a Meal (Universal Template)

document.addEventListener('DOMContentLoaded', () => {
    let currentScene = 1;
    let chosenIngredients = [];
    let audioCtx;

    const scenes = document.querySelectorAll('.scene');
    const plate = document.getElementById('plate');
    const ingredientOptionsContainer = document.getElementById('ingredient-options');
    const scene1NextButton = document.getElementById('scene-1-next');
    const storyContainer = document.getElementById('story-container');

    const setupAudio = () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    };
    document.body.addEventListener('click', setupAudio, { once: true });

    const playSound = (type, value = 0) => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain).connect(audioCtx.destination);
        gain.gain.setValueAtTime(0, now);

        switch (type) {
            case 'place':
                osc.type = 'sine';
                gain.gain.linearRampToValueAtTime(0.3, now + 0.05).linearRampToValueAtTime(0, now + 0.2);
                osc.frequency.setValueAtTime(392, now);
                break;
            case 'sustainable':
                osc.type = 'triangle';
                gain.gain.linearRampToValueAtTime(0.2, now + 0.1).linearRampToValueAtTime(0, now + 1);
                osc.frequency.setValueAtTime(523, now).exponentialRampToValueAtTime(784, now + 1);
                break;
            case 'conventional':
                osc.type = 'sawtooth';
                gain.gain.linearRampToValueAtTime(0.1, now + 0.2).linearRampToValueAtTime(0, now + 1.2);
                osc.frequency.setValueAtTime(110, now);
                break;
            case 'waste':
                gain.gain.linearRampToValueAtTime(0.1, now + 0.02).linearRampToValueAtTime(0, now + 0.2);
                osc.frequency.setValueAtTime(150 - value * 1.2, now);
                break;
            case 'action':
                 gain.gain.linearRampToValueAtTime(0.3, now + 0.05).linearRampToValueAtTime(0, now + 0.5);
                osc.frequency.setValueAtTime(587, now);
        }
        osc.start(now);
        osc.stop(now + 2);
    };

    const ingredientsData = {
        fish: { name: 'Local Fish', sustainable: true, origin: 'local', miles: 50, svg: `<svg viewBox="0 0 100 100"><g transform="translate(5, 15)"><path d="M90,35 C70,10 30,10 10,30 C-10,50 15,80 40,70 L80,75 C95,65 100,45 90,35 Z" fill="#a8dadc"/><path d="M88,37 C70,20 40,20 20,35" stroke="#6c9a9c" stroke-width="3" fill="none"/><circle cx="80" cy="38" r="4" fill="#0c2036"/><path d="M40,70 C45,60 55,55 65,58" stroke="#6c9a9c" stroke-width="2" fill="none"/></g></svg>`},
        steak: { name: 'Imported Steak', sustainable: false, origin: 'global_south', miles: 9000, svg: `<svg viewBox="0 0 100 100"><g transform="translate(10, 10)"><path d="M10,30 C-10,50 10,90 30,80 C50,100 80,80 80,50 C100,20 70,0 50,10 C30,-10 30,10 10,30 Z" fill="#d90429"/><path d="M45,25 C55,30 60,50 50,65 C40,80 25,70 25,50 C25,30 35,20 45,25 Z" fill="#edf2f4" opacity="0.8"/></g></svg>`},
        carrots: { name: 'Local Carrots', sustainable: true, origin: 'local', miles: 20, svg: `<svg viewBox="0 0 100 100"><g transform="rotate(45 50 50)"><path d="M50,10 L60,90 L40,90 Z" fill="#fca311"/><path d="M50,10 C40,20 45,5 50,10" fill="#5a8b5a" stroke="#2c4a3b" stroke-width="2"/><path d="M50,10 C60,20 55,5 50,10" fill="#5a8b5a" stroke="#2c4a3b" stroke-width="2"/><line x1="45" y1="30" x2="55" y2="35" stroke="#e85d04" stroke-width="1.5"/><line x1="45" y1="50" x2="55" y2="55" stroke="#e85d04" stroke-width="1.5"/><line x1="45" y1="70" x2="55" y2="75" stroke="#e85d04" stroke-width="1.5"/></g></svg>`},
        strawberries: { name: 'Imported Strawberries', sustainable: false, origin: 'global_north', miles: 2000, svg: `<svg viewBox="0 0 100 100"><g transform="translate(5,0)"><path d="M45,20 C0,30 10,80 45,95 C80,80 90,30 45,20 Z" fill="#e63946"/><path d="M45,20 Q55,10 60,5 L55,25 Z" fill="#5a8b5a" stroke="#2c4a3b" stroke-width="2"/><circle cx="30" cy="45" r="2" fill="#fca311" opacity="0.7"/><circle cx="60" cy="40" r="2.5" fill="#fca311" opacity="0.7"/><circle cx="45" cy="60" r="2.2" fill="#fca311" opacity="0.7"/><circle cx="25" cy="65" r="1.8" fill="#fca311" opacity="0.7"/><circle cx="65" cy="68" r="2" fill="#fca311" opacity="0.7"/></g></svg>`}
    };
    
    window.goToScene = (sceneNum) => {
        currentScene = sceneNum;
        scenes.forEach((s, i) => s.classList.toggle('active', (i + 1) === sceneNum));
        runSceneLogic(sceneNum);
    };

    const runSceneLogic = (sceneNum) => {
        const logic = [null, null, setupFarmScene, setupMapScene, setupWasteScene, setupActionScene][sceneNum];
        if (logic) logic();
    };

    function setupPlateScene() {
        Object.keys(ingredientsData).forEach(key => {
            const item = ingredientsData[key];
            const div = document.createElement('div');
            div.className = 'ingredient-icon';
            div.draggable = true;
            div.dataset.id = key;
            div.innerHTML = item.svg;
            div.title = item.name;
            ingredientOptionsContainer.appendChild(div);
        });

        let draggedItem = null;
        document.addEventListener('dragstart', e => { if (e.target.classList.contains('ingredient-icon')) { draggedItem = e.target; setTimeout(() => e.target.classList.add('dragging'), 0); }});
        document.addEventListener('dragend', () => { if(draggedItem) {draggedItem.classList.remove('dragging'); draggedItem = null;}});
        plate.addEventListener('dragover', e => { e.preventDefault(); plate.classList.add('highlight'); });
        plate.addEventListener('dragleave', () => plate.classList.remove('highlight'));
        plate.addEventListener('drop', e => {
            e.preventDefault();
            if (draggedItem && chosenIngredients.length < 5) {
                const id = draggedItem.dataset.id;
                if (!chosenIngredients.some(item => item.id === id)) {
                    playSound('place');
                    const newIcon = document.createElement('div');
                    newIcon.className = 'ingredient-icon on-plate';
                    newIcon.innerHTML = draggedItem.innerHTML;
                    newIcon.style.left = `${e.offsetX - 30}px`;
                    newIcon.style.top = `${e.offsetY - 30}px`;
                    plate.appendChild(newIcon);
                    chosenIngredients.push({ id, ...ingredientsData[id], element: newIcon });
                }
            }
            plate.classList.remove('highlight');
            if(chosenIngredients.length > 0) scene1NextButton.classList.remove('hidden');
        });
        scene1NextButton.addEventListener('click', () => goToScene(2));
    }

    function setupFarmScene() {
        document.querySelector('#sustainable-farm .farm-land').innerHTML = '';
        document.querySelector('#conventional-farm .farm-land').innerHTML = '';
        let susCount = 0, conCount = 0;
        chosenIngredients.forEach(item => {
            const icon = document.createElement('div');
            icon.className = 'ingredient-icon';
            icon.innerHTML = item.svg;
            if (item.sustainable) { playSound('sustainable'); icon.style.left = `${10 + susCount * 25}%`; document.querySelector('#sustainable-farm .farm-land').appendChild(icon); susCount++;
            } else { playSound('conventional'); icon.style.left = `${10 + conCount * 25}%`; document.querySelector('#conventional-farm .farm-land').appendChild(icon); conCount++; }
        });
    }
    
    function setupMapScene() {
        const mapSVG = document.getElementById('world-map');
        const homeBaseCoords = { x: 500, y: 250 }; // A generic central point
        const origins = { local: homeBaseCoords, global_north: { x: 480, y: 150 }, global_south: { x: 280, y: 350 } };
        mapSVG.innerHTML = `<g><path class="land" d="M153.2,56.1L...I have elided the very long SVG path data...-0.3,0.1C471.4,213.9,471.4,213.9,153.2,56.1z"></path><circle class="home-base" cx="${homeBaseCoords.x}" cy="${homeBaseCoords.y}" r="5"></circle></g>`;

        let totalMiles = 0;
        chosenIngredients.forEach(item => {
            const origin = origins[item.origin];
            totalMiles += item.miles;
            if (item.origin !== 'local') {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const controlX = (origin.x + homeBaseCoords.x) / 2 + (homeBaseCoords.y - origin.y) * 0.3;
                const controlY = (origin.y + homeBaseCoords.y) / 2 + (origin.x - homeBaseCoords.x) * 0.3;
                const pathData = `M ${origin.x} ${origin.y} Q ${controlX} ${controlY} ${homeBaseCoords.x} ${homeBaseCoords.y}`;
                line.setAttribute('d', pathData);
                line.setAttribute('class', 'travel-line');
                line.style.stroke = item.sustainable ? 'var(--sustainable-color)' : 'var(--conventional-color)';
                line.style.filter = `drop-shadow(0 0 3px ${item.sustainable ? 'var(--sustainable-color)' : 'var(--conventional-color)'})`;
                const length = line.getTotalLength();
                line.style.strokeDasharray = length;
                line.style.strokeDashoffset = length;
                mapSVG.querySelector('g').appendChild(line);
            }
        });
        document.querySelector('#food-miles-counter strong').textContent = totalMiles.toLocaleString();
    }
    
// script.js
// ... other code ...
	function setupWasteScene() {
		const finalPlate = document.getElementById('final-plate');
		finalPlate.innerHTML = '';
		plate.childNodes.forEach(node => finalPlate.appendChild(node.cloneNode(true)));

		const slider = document.getElementById('waste-slider');
		const percentageDisplay = document.getElementById('waste-percentage');
		const plateIcons = finalPlate.querySelectorAll('.ingredient-icon');
		const wasteBin = document.getElementById('waste-bin');
		
		slider.addEventListener('input', () => {
			const wasteValue = parseInt(slider.value, 10);
			const wasteRatio = wasteValue / 100; // Convert percentage to a 0-1 ratio

			percentageDisplay.textContent = `${wasteValue}%`;
			playSound('waste', wasteValue);

			// THIS IS THE NEW LOGIC
			// Loop through all icons and set the CSS variable on each one
			plateIcons.forEach(icon => {
				icon.style.setProperty('--waste-amount', wasteRatio);
			});

			wasteBin.classList.toggle('active', wasteValue > 0);
			storyContainer.style.filter = `saturate(${100 - wasteValue * 0.8}%)`;
		});
		
		// Reset on scene load
		slider.value = 0;
		percentageDisplay.textContent = '0%';
		plateIcons.forEach(icon => icon.style.setProperty('--waste-amount', 0));
		storyContainer.style.filter = 'saturate(100%)';
	}
// ... other code ...

    function setupActionScene() {
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                playSound('action');
                const action = card.dataset.action;
                const subject = `Sustainable Gastronomy Inquiry: ${action.charAt(0).toUpperCase() + action.slice(1)}`;
                const body = `To whom it may concern,\n\nI have just experienced the 'Journey of a Meal' and I am interested in getting involved with sustainable food initiatives.\n\nI would like to learn more about how I can contribute by sharing a ${action}.\n\nThank you for your guidance.\n\nBest regards,`;
                const mailtoLink = `mailto:contact@globalgastronomyproject.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(mailtoLink, '_blank');
            });
        });
    }

    // --- Initial Kick-off ---
    setupPlateScene();
});