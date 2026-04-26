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
			Array.from({ length: Config.GRID_H }, () => ({ n: 0, f: 0, d: 0 }))
		);
		
		this.initSpawns();
	}
	
	initSpawns() {
		for(let i=0; i<Config.INIT_BLUES; i++) {
			let x = Math.floor(Math.random() * (Config.GRID_W / 3));
			let y = Math.floor(Math.random() * Config.GRID_H);
			let c = new Creature(x, y, 'blue', Genome.createBaseBlue());
			this.creatures.push(c);
			this.container.addChild(c.sprite);
		}
		
		for(let i=0; i<Config.INIT_REDS; i++) {
			let x = Math.floor(Config.GRID_W * 0.66) + Math.floor(Math.random() * (Config.GRID_W / 3));
			let y = Math.floor(Math.random() * Config.GRID_H);
			let c = new Creature(x, y, 'red', Genome.createBaseRed());
			this.creatures.push(c);
			this.container.addChild(c.sprite);
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
		
		this.food.push({ x, y, sprite });
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
		
		if (Math.random() < 0.05) {
			this.spawnFood(Math.floor(Math.random()*Config.GRID_W), Math.floor(Math.random()*Config.GRID_H));
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
				
				if (cell.f > 5) {
					this.pheroGraphics.beginFill(0x00ff00, cell.f / 200);
					this.pheroGraphics.drawRect(x * Config.CELL_SIZE, y * Config.CELL_SIZE, Config.CELL_SIZE, Config.CELL_SIZE);
					this.pheroGraphics.endFill();
				}
			}
		}
	}
	
	reset() {
		// 1. Clear arrays
		this.creatures = [];
		this.food = [];
		this.corpses = [];
		this.spawnQueue = [];
		
		// 2. Clear Pheromone Grid
		for(let x=0; x<Config.GRID_W; x++) {
			for(let y=0; y<Config.GRID_H; y++) {
				this.grid[x][y] = { n: 0, f: 0, d: 0 };
			}
		}
		
		// 3. Clear PixiJS Container (Remove all sprites)
		this.container.removeChildren();
		
		// 4. Re-add the pheromone graphics layer
		this.pheroGraphics.clear();
		this.container.addChild(this.pheroGraphics);
		
		// 5. Spawn fresh creatures
		this.initSpawns();
	}
}
