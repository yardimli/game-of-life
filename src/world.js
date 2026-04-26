import * as PIXI from 'pixi.js';
import { Config } from './config.js';
import { Creature } from './creature.js';
import { Genome } from './genome.js';

export class World {
	constructor(app) {
		this.app = app;
		this.container = new PIXI.Container();
		this.app.stage.addChild(this.container);
		
		this.pheroGraphics = new PIXI.Graphics();
		this.container.addChild(this.pheroGraphics);
		
		this.creatures = [];
		this.food = [];
		this.corpses = [];
		this.spawnQueue = [];
		
		this.grid = Array.from({ length: Config.GRID_W }, () =>
			Array.from({ length: Config.GRID_H }, () => ({
				n: 0, f: 0, d: 0,
				occupied: false,
				creature: null,
				foodList: [],
				corpseList: []
			}))
		);
		
		this.initSpawns();
	}
	
	initSpawns() {
		for(let i=0; i<Config.INIT_BLUES; i++) {
			let x, y;
			let attempts = 0;
			do {
				x = Math.floor(Math.random() * (Config.GRID_W / 3));
				y = Math.floor(Math.random() * Config.GRID_H);
				attempts++;
			} while(this.grid[x][y].occupied && attempts < 50);
			
			if (!this.grid[x][y].occupied) {
				this.grid[x][y].occupied = true;
				let c = new Creature(x, y, 'blue', Genome.createBaseBlue());
				this.grid[x][y].creature = c;
				this.creatures.push(c);
				this.container.addChild(c.sprite);
			}
		}
		
		for(let i=0; i<Config.INIT_REDS; i++) {
			let x, y;
			let attempts = 0;
			do {
				x = Math.floor(Config.GRID_W * 0.66) + Math.floor(Math.random() * (Config.GRID_W / 3));
				y = Math.floor(Math.random() * Config.GRID_H);
				attempts++;
			} while(this.grid[x][y].occupied && attempts < 50);
			
			if (!this.grid[x][y].occupied) {
				this.grid[x][y].occupied = true;
				let c = new Creature(x, y, 'red', Genome.createBaseRed());
				this.grid[x][y].creature = c;
				this.creatures.push(c);
				this.container.addChild(c.sprite);
			}
		}
	}
	
	addPheromone(x, y, type, amount) {
		if(x<0 || x>=Config.GRID_W || y<0 || y>=Config.GRID_H) return;
		if(type === 'neutral') this.grid[x][y].n = Math.min(100, this.grid[x][y].n + amount);
		if(type === 'food') this.grid[x][y].f = Math.min(100, this.grid[x][y].f + amount);
		if(type === 'danger') this.grid[x][y].d = Math.min(100, this.grid[x][y].d + amount);
	}
	
	spawnFood(x, y) {
		let sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
		sprite.width = Config.CELL_SIZE;
		sprite.height = Config.CELL_SIZE;
		sprite.tint = Config.COLOR_FOOD;
		sprite.x = x * Config.CELL_SIZE;
		sprite.y = y * Config.CELL_SIZE;
		
		let fObj = { x, y, sprite, isFood: true, energy: 50 };
		this.food.push(fObj);
		this.grid[x][y].foodList.push(fObj);
		
		this.container.addChild(sprite);
	}
	
	showFight(x, y) {
		let flash = new PIXI.Graphics();
		flash.beginFill(Config.COLOR_FIGHT);
		flash.drawRect(x * Config.CELL_SIZE - 2, y * Config.CELL_SIZE - 2, Config.CELL_SIZE + 4, Config.CELL_SIZE + 4);
		flash.endFill();
		this.container.addChild(flash);
		setTimeout(() => this.container.removeChild(flash), 100);
	}
	
	update() {
		for (let c of this.creatures) c.update(this);
		
		while(this.spawnQueue.length > 0) {
			let child = this.spawnQueue.pop();
			this.creatures.push(child);
			this.container.addChild(child.sprite);
		}
		
		this.creatures = this.creatures.filter(c => !c.isDead);
		
		// Modified: Only spawn random food if the toggle is enabled
		if (Config.foodSpawnEnabled) {
			let spawns = Math.floor(Config.foodSpawnRate);
			// The modulo logic handles fractional spawn rates perfectly
			// e.g., 0.01 % 1 is 0.01, so Math.random() < 0.01 is true 1% of the time (1 every 100 turns)
			if (Math.random() < (Config.foodSpawnRate % 1)) {
				spawns++;
			}
			for (let i = 0; i < spawns; i++) {
				this.spawnFood(Math.floor(Math.random() * Config.GRID_W), Math.floor(Math.random() * Config.GRID_H));
			}
		}
		
		this.renderPheromones();
	}
	
	renderPheromones() {
		this.pheroGraphics.clear();
		for(let x=0; x<Config.GRID_W; x++) {
			for(let y=0; y<Config.GRID_H; y++) {
				let cell = this.grid[x][y];
				if(cell.n > 0) cell.n -= 0.5;
				if(cell.f > 0) cell.f -= 1;
				if(cell.d > 0) cell.d -= 1;
				
				let maxPhero = Math.max(cell.n, cell.f, cell.d);
				if (maxPhero > 5) {
					let color = 0x0000ff; // Default Blue for Neutral
					if (maxPhero === cell.d) color = 0xff0000; // Red for Danger
					else if (maxPhero === cell.f) color = 0xffff00; // Yellow for Food
					
					this.pheroGraphics.lineStyle(1, color, maxPhero / 100);
					this.pheroGraphics.drawRect(x * Config.CELL_SIZE, y * Config.CELL_SIZE, Config.CELL_SIZE, Config.CELL_SIZE);
					this.pheroGraphics.lineStyle(0);
				}
			}
		}
	}
	
	clearCell(x, y) {
		let cell = this.grid[x][y];
		
		if (cell.creature) {
			cell.creature.isDead = true;
			this.container.removeChild(cell.creature.sprite);
			cell.creature = null;
			cell.occupied = false;
		}
		
		for (let f of cell.foodList) {
			this.container.removeChild(f.sprite);
			let idx = this.food.indexOf(f);
			if (idx > -1) this.food.splice(idx, 1);
		}
		cell.foodList = [];
		
		for (let c of cell.corpseList) {
			this.container.removeChild(c.sprite);
			let idx = this.corpses.indexOf(c);
			if (idx > -1) this.corpses.splice(idx, 1);
		}
		cell.corpseList = [];
		
		cell.n = 0;
		cell.f = 0;
		cell.d = 0;
	}
	
	clearMap() {
		this.creatures = [];
		this.food = [];
		this.corpses = [];
		this.spawnQueue = [];
		
		for(let x=0; x<Config.GRID_W; x++) {
			for(let y=0; y<Config.GRID_H; y++) {
				this.grid[x][y] = {
					n: 0, f: 0, d: 0,
					occupied: false,
					creature: null,
					foodList: [],
					corpseList: []
				};
			}
		}
		
		this.container.removeChildren();
		this.pheroGraphics.clear();
		this.container.addChild(this.pheroGraphics);
	}
	
	reset() {
		this.clearMap();
		this.initSpawns();
	}
}
