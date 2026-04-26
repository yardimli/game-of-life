import * as PIXI from 'pixi.js';
import { Config } from './config.js';
import { World } from './world.js';

const canvasContainer = document.getElementById('canvas-container');
const app = new PIXI.Application({
	width: Config.GRID_W * Config.CELL_SIZE,
	height: Config.GRID_H * Config.CELL_SIZE,
	backgroundColor: 0x111111,
	resolution: window.devicePixelRatio || 1,
});
canvasContainer.appendChild(app.view);

const world = new World(app);
let selectedCreature = null;

// Create a graphics object to draw a box around the selected creature
const selectionBox = new PIXI.Graphics();
app.stage.addChild(selectionBox);

// UI Bindings
document.getElementById('set-speed').addEventListener('input', (e) => {
	Config.speed = parseFloat(e.target.value);
	document.getElementById('val-speed').innerText = Config.speed.toFixed(1);
});

document.getElementById('set-photo').addEventListener('input', (e) => {
	Config.photosynthesisRate = parseFloat(e.target.value);
});

document.getElementById('set-mutation').addEventListener('input', (e) => {
	Config.mutationVolatility = parseFloat(e.target.value);
});

document.getElementById('btn-spawn-food').addEventListener('click', () => {
	for(let i=0; i<10; i++) {
		world.spawnFood(Math.floor(Math.random()*Config.GRID_W), Math.floor(Math.random()*Config.GRID_H));
	}
});

document.getElementById('btn-play').addEventListener('click', () => {
	Config.paused = false;
});

document.getElementById('btn-pause').addEventListener('click', () => {
	Config.paused = true;
});

document.getElementById('btn-reset').addEventListener('click', () => {
	world.reset();
	Config.cycles = 0;
	selectedCreature = null;
	document.getElementById('inspector-content').innerHTML = '<p>Select a creature on the map.</p>';
});

// Fixed Click Logic
app.view.addEventListener('mousedown', (e) => {
	const rect = app.view.getBoundingClientRect();
	
	// Use LOGICAL width/height, not app.view.width (which is affected by devicePixelRatio)
	const logicalWidth = Config.GRID_W * Config.CELL_SIZE;
	const logicalHeight = Config.GRID_H * Config.CELL_SIZE;
	
	const scaleX = logicalWidth / rect.width;
	const scaleY = logicalHeight / rect.height;
	
	const clickX = (e.clientX - rect.left) * scaleX;
	const clickY = (e.clientY - rect.top) * scaleY;
	
	const gridX = Math.floor(clickX / Config.CELL_SIZE);
	const gridY = Math.floor(clickY / Config.CELL_SIZE);
	
	// Find the CLOSEST creature within a 5-tile radius (makes clicking much easier)
	let closestCreature = null;
	let minDistance = 6; // Max distance to register a click
	
	for (let c of world.creatures) {
		// Calculate distance in grid cells
		let dist = Math.max(Math.abs(c.x - gridX), Math.abs(c.y - gridY));
		if (dist < minDistance) {
			minDistance = dist;
			closestCreature = c;
		}
	}
	
	selectedCreature = closestCreature;
	
	if (!selectedCreature) {
		world.spawnFood(gridX, gridY);
	}
	
	updateInspector();
});

function updateInspector() {
	const panel = document.getElementById('inspector-content');
	if (!selectedCreature) {
		panel.innerHTML = '<p>Select a creature on the map.</p>';
		return;
	}
	
	let status = selectedCreature.isDead ? '<span style="color:red;">(DEAD)</span>' : '';
	
	let html = `
        <p><strong>ID:</strong> ${selectedCreature.id} ${status}</p>
        <p><strong>Faction:</strong> <span style="color:${selectedCreature.faction==='blue'?'#4da6ff':'#ff4d4d'}">${selectedCreature.faction.toUpperCase()}</span></p>
        <p><strong>Age:</strong> ${selectedCreature.age}</p>
        <p><strong>Energy:</strong> ${Math.floor(selectedCreature.energy)}</p>
        <p><strong>Kills:</strong> ${selectedCreature.kills}</p>
        <hr style="border-color:#444; margin: 10px 0;">
        <p><strong>Genome:</strong></p>
    `;
	
	for (const [trait, value] of Object.entries(selectedCreature.genome.traits)) {
		let percent = ((value + 1) / 2) * 100;
		let color = value > 0 ? '#55ff55' : '#ff5555';
		html += `
            <div class="genome-bar">
                <div class="genome-label">${trait}</div>
                <div class="genome-track">
                    <div class="genome-fill" style="width: ${percent}%; background: ${color};"></div>
                </div>
            </div>
        `;
	}
	panel.innerHTML = html;
}

let tickCounter = 0;
let speedAccumulator = 0;

app.ticker.add(() => {
	// 1. Update UI Stats every 10 frames (UI updates even when paused)
	if (tickCounter % 10 === 0) {
		document.getElementById('stat-fps').innerText = Math.floor(app.ticker.FPS);
		let blues = world.creatures.filter(c => c.faction === 'blue').length;
		let reds = world.creatures.filter(c => c.faction === 'red').length;
		document.getElementById('stat-blues').innerText = blues;
		document.getElementById('stat-reds').innerText = reds;
		document.getElementById('stat-cycle').innerText = Config.cycles;
		if(selectedCreature) updateInspector();
	}
	tickCounter++;
	
	// 2. Fractional Speed Logic (ONLY run if not paused)
	if (!Config.paused) {
		speedAccumulator += Config.speed;
		
		while (speedAccumulator >= 1) {
			world.update();
			Config.cycles++;
			speedAccumulator -= 1;
		}
	}
	
	// 3. Draw Selection Box
	selectionBox.clear();
	if (selectedCreature && !selectedCreature.isDead) {
		selectionBox.lineStyle(1, 0xFFFFFF, 1); // White border
		selectionBox.drawRect(
			selectedCreature.x * Config.CELL_SIZE - 2,
			selectedCreature.y * Config.CELL_SIZE - 2,
			Config.CELL_SIZE + 4,
			Config.CELL_SIZE + 4
		);
	}
});
