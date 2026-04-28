import * as PIXI from 'pixi.js';
import { Config } from './config.js';
import { World } from './world.js';
import { Creature } from './creature.js';
import { Genome } from './genome.js';

const canvasContainer = document.getElementById('canvas-container');
const app = new PIXI.Application({
	width: Config.GRID_W * Config.CELL_SIZE,
	height: Config.GRID_H * Config.CELL_SIZE,
	backgroundColor: 0x111111,
	resolution: window.devicePixelRatio || 1,
});
canvasContainer.appendChild(app.view);

const world = new World(app);
let selectedEntity = null;

const selectionBox = new PIXI.Graphics();
app.stage.addChild(selectionBox);

const hoverBox = new PIXI.Graphics();
app.stage.addChild(hoverBox);
let isDrawing = false;

// UI Bindings
document.getElementById('set-speed').addEventListener('input', (e) => {
	Config.speed = parseFloat(e.target.value);
	document.getElementById('val-speed').innerText = Config.speed.toFixed(1);
});

document.getElementById('set-photo').addEventListener('input', (e) => {
	Config.photosynthesisRate = parseFloat(e.target.value);
	document.getElementById('val-photo').innerText = Config.photosynthesisRate.toFixed(1);
});

document.getElementById('set-mutation').addEventListener('input', (e) => {
	Config.mutationVolatility = parseFloat(e.target.value);
	document.getElementById('val-mutation').innerText = Config.mutationVolatility.toFixed(1);
});

document.getElementById('set-corpse-energy').addEventListener('input', (e) => {
	Config.corpseEnergyMultiplier = parseFloat(e.target.value) / 100;
	document.getElementById('val-corpse-energy').innerText = e.target.value + '%';
});

function updateFoodRateDisplay(val) {
	if (val < 1) {
		document.getElementById('val-food-rate').innerText = `1 every ${Math.round(1 / val)} turns`;
	} else {
		document.getElementById('val-food-rate').innerText = `${val.toFixed(2)} / turn`;
	}
}

document.getElementById('set-food-rate').addEventListener('input', (e) => {
	Config.foodSpawnRate = parseFloat(e.target.value);
	updateFoodRateDisplay(Config.foodSpawnRate);
});

document.getElementById('btn-toggle-food').addEventListener('click', (e) => {
	Config.foodSpawnEnabled = !Config.foodSpawnEnabled;
	if (Config.foodSpawnEnabled) {
		e.target.innerText = "ON";
		e.target.classList.remove('btn-danger');
		e.target.classList.add('btn-success');
	} else {
		e.target.innerText = "OFF";
		e.target.classList.remove('btn-success');
		e.target.classList.add('btn-danger');
	}
});

// Added: Tool selection logic for the canvas overlay buttons
let currentTool = null;
const tools = ['food', 'red', 'blue'];
tools.forEach(tool => {
	document.getElementById(`tool-${tool}`).addEventListener('click', (e) => {
		if (currentTool === tool) {
			currentTool = null;
			e.target.classList.remove('active');
		} else {
			tools.forEach(t => document.getElementById(`tool-${t}`).classList.remove('active'));
			currentTool = tool;
			e.target.classList.add('active');
		}
	});
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
	selectedEntity = null;
	document.getElementById('inspector-content').innerHTML = '<p>Select an entity on the map.</p>';
});

document.getElementById('btn-clear').addEventListener('click', () => {
	world.clearMap();
	Config.cycles = 0;
	selectedEntity = null;
	document.getElementById('inspector-content').innerHTML = '<p>Select an entity on the map.</p>';
});

function getGridCoords(e) {
	const rect = app.view.getBoundingClientRect();
	const logicalWidth = Config.GRID_W * Config.CELL_SIZE;
	const logicalHeight = Config.GRID_H * Config.CELL_SIZE;
	
	const scaleX = logicalWidth / rect.width;
	const scaleY = logicalHeight / rect.height;
	
	const clickX = (e.clientX - rect.left) * scaleX;
	const clickY = (e.clientY - rect.top) * scaleY;
	
	return {
		x: Math.max(0, Math.min(Config.GRID_W - 1, Math.floor(clickX / Config.CELL_SIZE))),
		y: Math.max(0, Math.min(Config.GRID_H - 1, Math.floor(clickY / Config.CELL_SIZE)))
	};
}

app.view.addEventListener('mousemove', (e) => {
	const coords = getGridCoords(e);
	
	hoverBox.clear();
	hoverBox.lineStyle(1, 0xffffff, 0.8);
	hoverBox.drawRect(coords.x * Config.CELL_SIZE, coords.y * Config.CELL_SIZE, Config.CELL_SIZE, Config.CELL_SIZE);
	
	if (isDrawing) {
		applyBrush(coords.x, coords.y, true);
	}
});

app.view.addEventListener('mousedown', (e) => {
	isDrawing = true;
	const coords = getGridCoords(e);
	applyBrush(coords.x, coords.y, false);
});

app.view.addEventListener('mouseup', () => { isDrawing = false; });
app.view.addEventListener('mouseleave', () => {
	isDrawing = false;
	hoverBox.clear();
});

function applyBrush(gridX, gridY, isDrag) {
	let cell = world.grid[gridX][gridY];
	let occupiedBy = cell.creature || cell.corpseList[0] || cell.foodList[0] || null;
	
	// Modified: If cell is occupied, just select it and don't overwrite
	if (occupiedBy) {
		if (!isDrag) {
			selectedEntity = occupiedBy;
			updateInspector();
		}
		return;
	}
	
	// Modified: Add entity based on selected tool and update inspector
	if (currentTool) {
		if (currentTool === 'food') {
			world.spawnFood(gridX, gridY);
			selectedEntity = cell.foodList[cell.foodList.length - 1];
		} else if (currentTool === 'red') {
			let c = new Creature(gridX, gridY, 'red', Genome.createBaseRed());
			world.creatures.push(c);
			world.container.addChild(c.sprite);
			
			cell.occupied = true;
			cell.creature = c;
			selectedEntity = c;
		} else if (currentTool === 'blue') {
			let c = new Creature(gridX, gridY, 'blue', Genome.createBaseBlue());
			world.creatures.push(c);
			world.container.addChild(c.sprite);
			
			cell.occupied = true;
			cell.creature = c;
			selectedEntity = c;
		}
		// Focus inspector on the newly added entity
		updateInspector();
	} else {
		// If no tool is selected and clicked an empty cell
		if (!isDrag) {
			selectedEntity = null;
			updateInspector();
		}
	}
}

function updateInspector() {
	const panel = document.getElementById('inspector-content');
	if (!selectedEntity) {
		panel.innerHTML = '<p>Select an entity on the map.</p>';
		return;
	}
	
	if (selectedEntity.isCorpse) {
		panel.innerHTML = `
			<p><strong>Type:</strong> <span style="color:#888;">Corpse</span></p>
			<p><strong>Energy:</strong> ${Math.floor(selectedEntity.energy)}</p>
		`;
		return;
	}
	
	if (selectedEntity.isFood) {
		panel.innerHTML = `
			<p><strong>Type:</strong> <span style="color:#55ff55;">Food</span></p>
			<p><strong>Energy:</strong> 50</p>
		`;
		return;
	}
	
	let status = selectedEntity.isDead ? '<span style="color:red;">(DEAD)</span>' : '';
	
	let html = `
		<p><strong>ID:</strong> ${selectedEntity.id} ${status}</p>
		<p><strong>Faction:</strong> <span style="color:${selectedEntity.faction==='blue'?'#4da6ff':'#ff4d4d'}">${selectedEntity.faction.toUpperCase()}</span></p>
		<p><strong>Generation:</strong> ${selectedEntity.generation}</p>
		<p><strong>Age:</strong> ${selectedEntity.age}</p>
		<p><strong>Energy:</strong> ${Math.floor(selectedEntity.energy)}</p>
		<p><strong>Kills:</strong> ${selectedEntity.kills}</p>
		<hr style="border-color:#444; margin: 10px 0;">
		<p><strong>Genome:</strong></p>
	`;
	
	for (const [trait, value] of Object.entries(selectedEntity.genome.traits)) {
		let percent = ((value + 1) / 2) * 100;
		let color = value > 0 ? '#55ff55' : '#ff5555';
		
		let displayVal = (value > 0 ? '+' : '') + value.toFixed(2);
		
		html += `
			<div class="genome-bar">
				<div class="genome-label">${trait} <span style="color:#888;">[${displayVal}]</span></div>
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

// Initialize the food rate display on load
updateFoodRateDisplay(Config.foodSpawnRate);

app.ticker.add(() => {
	if (tickCounter % 10 === 0) {
		document.getElementById('stat-fps').innerText = Math.floor(app.ticker.FPS);
		let blues = world.creatures.filter(c => c.faction === 'blue').length;
		let reds = world.creatures.filter(c => c.faction === 'red').length;
		document.getElementById('stat-blues').innerText = blues;
		document.getElementById('stat-reds').innerText = reds;
		document.getElementById('stat-cycle').innerText = Config.cycles;
		if(selectedEntity) updateInspector();
	}
	tickCounter++;
	
	if (!Config.paused) {
		speedAccumulator += Config.speed;
		
		while (speedAccumulator >= 1) {
			world.update();
			Config.cycles++;
			speedAccumulator -= 1;
		}
	}
	
	selectionBox.clear();
	if (selectedEntity && !selectedEntity.isDead && selectedEntity.sprite && selectedEntity.sprite.parent) {
		selectionBox.lineStyle(1, 0xFFFFFF, 1);
		selectionBox.drawRect(
			selectedEntity.x * Config.CELL_SIZE - 2,
			selectedEntity.y * Config.CELL_SIZE - 2,
			Config.CELL_SIZE + 4,
			Config.CELL_SIZE + 4
		);
	}
});
