import * as PIXI from 'pixi.js';
import { Config } from './config.js';
import { Genome } from './genome.js';

export class Creature {
	constructor(x, y, faction, genome, generation = 1) {
		this.id = Math.random().toString(36).substr(2, 9);
		this.x = x;
		this.y = y;
		this.faction = faction;
		this.genome = genome;
		
		this.generation = generation;
		
		this.age = 0;
		this.energy = 100;
		this.kills = 0;
		this.isDead = false;
		
		this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
		this.sprite.width = Config.CELL_SIZE;
		this.sprite.height = Config.CELL_SIZE;
		this.sprite.tint = faction === 'blue' ? Config.COLOR_BLUE : Config.COLOR_RED;
		this.updatePosition();
	}
	
	updatePosition() {
		this.sprite.x = this.x * Config.CELL_SIZE;
		this.sprite.y = this.y * Config.CELL_SIZE;
	}
	
	die(world) {
		this.isDead = true;
		this.sprite.tint = Config.COLOR_CORPSE;
		world.corpses.push({
			x: this.x, y: this.y,
			energy: 50 + (this.energy * 0.5 * (this.age / 100)),
			sprite: this.sprite
		});
	}
	
	update(world) {
		if (this.isDead) return;
		
		this.age++;
		let baseBurn = 0.5 + (this.genome.traits.metabolism * 0.3);
		this.energy -= baseBurn;
		
		if (this.genome.traits.photoEfficiency > 0) {
			this.energy += this.genome.traits.photoEfficiency * Config.photosynthesisRate;
		}
		
		if (this.energy <= 0 || this.age > 500 + (this.genome.traits.lifespan * 200)) {
			this.die(world);
			return;
		}
		
		let speedLimit = this.genome.traits.speed > 0 ? 2 : 1;
		for(let s=0; s<speedLimit; s++) {
			let dx = Math.floor(Math.random() * 3) - 1;
			let dy = Math.floor(Math.random() * 3) - 1;
			
			let nx = this.x + dx;
			let ny = this.y + dy;
			
			if (nx >= 0 && nx < Config.GRID_W && ny >= 0 && ny < Config.GRID_H) {
				this.x = nx;
				this.y = ny;
			}
		}
		this.updatePosition();
		
		if (this.genome.traits.emitNeutral > -0.5) {
			world.addPheromone(this.x, this.y, 'neutral', 5);
		}
		
		this.interact(world);
		
		// Reproduce
		let reproThresh = 150 + (this.genome.traits.reproThreshold * 50);
		if (this.energy > reproThresh) {
			this.energy /= 2;
			let childGenome = new Genome(this.genome, Config.mutationVolatility);
			let child = new Creature(this.x, this.y, this.faction, childGenome, this.generation + 1);
			world.spawnQueue.push(child);
		}
	}
	
	interact(world) {
		for (let i = world.food.length - 1; i >= 0; i--) {
			let f = world.food[i];
			if (Math.abs(f.x - this.x) <= 1 && Math.abs(f.y - this.y) <= 1) {
				this.energy += 50;
				world.container.removeChild(f.sprite);
				world.food.splice(i, 1);
				if (this.genome.traits.emitFood > 0) world.addPheromone(this.x, this.y, 'food', 20);
				break;
			}
		}
		
		if (this.genome.traits.predation > -0.5) {
			for (let i = world.corpses.length - 1; i >= 0; i--) {
				let c = world.corpses[i];
				if (Math.abs(c.x - this.x) <= 1 && Math.abs(c.y - this.y) <= 1) {
					this.energy += c.energy;
					world.container.removeChild(c.sprite);
					world.corpses.splice(i, 1);
					break;
				}
			}
		}
		
		if (this.genome.traits.aggression > 0) {
			for (let other of world.creatures) {
				if (other.isDead || other.faction === this.faction) continue;
				if (Math.abs(other.x - this.x) <= 1 && Math.abs(other.y - this.y) <= 1) {
					let dmg = 20 + (this.genome.traits.aggression * 10) - (other.genome.traits.armor * 10);
					other.energy -= Math.max(5, dmg);
					if (other.energy <= 0) {
						this.kills++;
						if(this.genome.traits.emitFood > 0) world.addPheromone(this.x, this.y, 'food', 30);
					}
					world.showFight(this.x, this.y);
					break;
				}
			}
		}
	}
}
