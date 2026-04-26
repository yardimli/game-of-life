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

document.getElementById('set-food-rate').addEventListener('input', (e) => {
	Config.foodSpawnRate = parseFloat(e.target.value);
	document.getElementById('val-food-rate').innerText = e.target.value;
});

document.getElementById('set-click-action').addEventListener('change', (e) => {
	Config.clickAction = e.target.value;
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

app.view.addEventListener('mousedown', (e) => {
	const rect = app.view.getBoundingClientRect();
	
	const logicalWidth = Config.GRID_W * Config.CELL_SIZE;
	const logicalHeight = Config.GRID_H * Config.CELL_SIZE;
	
	const scaleX = logicalWidth / rect.width;
	const scaleY = logicalHeight / rect.height;
	
	const clickX = (e.clientX - rect.left) * scaleX;
	const clickY = (e.clientY - rect.top) * scaleY;
	
	const gridX = Math.floor(clickX / Config.CELL_SIZE);
	const gridY = Math.floor(clickY / Config.CELL_SIZE);
	
	let closestEntity = null;
	let minDistance = 6;
	
	for (let c of world.creatures) {
		let dist = Math.max(Math.abs(c.x - gridX), Math.abs(c.y - gridY));
		if (dist < minDistance) {
			minDistance = dist;
			closestEntity = c;
		}
	}
	
	for (let c of world.corpses) {
		let dist = Math.max(Math.abs(c.x - gridX), Math.abs(c.y - gridY));
		if (dist < minDistance) {
			minDistance = dist;
			closestEntity = c;
		}
	}
	
	for (let f of world.food) {
		let dist = Math.max(Math.abs(f.x - gridX), Math.abs(f.y - gridY));
		if (dist < minDistance) {
			minDistance = dist;
			closestEntity = f;
		}
	}
	
	selectedEntity = closestEntity;
	
	if (!selectedEntity) {
		if (Config.clickAction === 'food') {
			world.spawnFood(gridX, gridY);
		} else if (Config.clickAction === 'red') {
			// Modified: Check if tile is occupied before manual spawn
			if (!world.grid[gridX][gridY].occupied) {
				let c = new Creature(gridX, gridY, 'red', Genome.createBaseRed());
				world.creatures.push(c);
				world.container.addChild(c.sprite);
				world.grid[gridX][gridY].occupied = true;
			}
		} else if (Config.clickAction === 'blue') {
			// Modified: Check if tile is occupied before manual spawn
			if (!world.grid[gridX][gridY].occupied) {
				let c = new Creature(gridX, gridY, 'blue', Genome.createBaseBlue());
				world.creatures.push(c);
				world.container.addChild(c.sprite);
				world.grid[gridX][gridY].occupied = true;
			}
		}
	}
	
	updateInspector();
});

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
	if (selectedEntity) {
		selectionBox.lineStyle(1, 0xFFFFFF, 1);
		selectionBox.drawRect(
			selectedEntity.x * Config.CELL_SIZE - 2,
			selectedEntity.y * Config.CELL_SIZE - 2,
			Config.CELL_SIZE + 4,
			Config.CELL_SIZE + 4
		);
	}
});
