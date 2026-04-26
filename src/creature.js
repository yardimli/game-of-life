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
		
		// Added: Track last movement direction for vision cones and search patterns
		this.lastDx = 0;
		this.lastDy = 0;
		
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
		
		world.grid[this.x][this.y].occupied = false;
		
		let baseEnergy = 50 + (this.energy * 0.5 * (this.age / 100));
		world.corpses.push({
			x: this.x, y: this.y,
			energy: baseEnergy * Config.corpseEnergyMultiplier,
			sprite: this.sprite,
			isCorpse: true
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
		
		for(let s = 0; s < speedLimit; s++) {
			let moves = [];
			
			// 1. Generate all possible valid moves (including staying still)
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					let nx = this.x + dx;
					let ny = this.y + dy;
					
					if (nx >= 0 && nx < Config.GRID_W && ny >= 0 && ny < Config.GRID_H) {
						if (!world.grid[nx][ny].occupied || (dx === 0 && dy === 0)) {
							moves.push({ dx, dy, nx, ny, score: 0 });
						}
					}
				}
			}
			
			// 2. Vision Range Calculation
			// visionFocus gene: +1.0 -> range 7 (narrow), -1.0 -> range 1 (360 deg)
			let visRange = Math.round(3 + (this.genome.traits.visionFocus * 4));
			visRange = Math.max(1, Math.min(7, visRange));
			
			let seeEntity = (ex, ey) => {
				let dist = Math.max(Math.abs(ex - this.x), Math.abs(ey - this.y));
				if (dist > visRange || dist === 0) return false;
				
				// visionFocus gene: Tunnel vision check
				if (this.genome.traits.visionFocus > 0 && (this.lastDx !== 0 || this.lastDy !== 0)) {
					let vx = ex - this.x;
					let vy = ey - this.y;
					let dot = (vx * this.lastDx + vy * this.lastDy) / (Math.sqrt(vx*vx+vy*vy) * Math.sqrt(this.lastDx*this.lastDx+this.lastDy*this.lastDy));
					if (dot < 0.5) return false; // Outside forward cone
				}
				return true;
			};
			
			// 3. Evaluate each valid move based on genes
			for (let m of moves) {
				// restlessness gene: Penalize staying still if highly restless
				if (m.dx === 0 && m.dy === 0) {
					m.score -= this.genome.traits.restlessness * 10;
				}
				
				// searchPattern gene: Bonus for continuing in the same direction (Cruiser) vs changing (Sweeper)
				if (m.dx === this.lastDx && m.dy === this.lastDy && (m.dx !== 0 || m.dy !== 0)) {
					m.score += this.genome.traits.searchPattern * 5;
				}
				
				// thigmotaxis gene: Preference for walls/obstacles
				let walls = 0;
				for (let wx = -1; wx <= 1; wx++) {
					for (let wy = -1; wy <= 1; wy++) {
						let cx = m.nx + wx;
						let cy = m.ny + wy;
						if (cx < 0 || cx >= Config.GRID_W || cy < 0 || cy >= Config.GRID_H || world.grid[cx][cy].occupied) {
							walls++;
						}
					}
				}
				m.score += this.genome.traits.thigmotaxis * walls * 2;
				
				// neutralPhero, foodPhero, dangerPhero genes: Pheromone responses
				let cell = world.grid[m.nx][m.ny];
				m.score += cell.n * this.genome.traits.neutralPhero * 0.2;
				m.score += cell.f * this.genome.traits.foodPhero * 0.5;
				m.score += cell.d * this.genome.traits.dangerPhero * 0.5;
			}
			
			// 4. Entity Vision Evaluation
			// Food
			for (let f of world.food) {
				if (seeEntity(f.x, f.y)) {
					let dirX = Math.sign(f.x - this.x);
					let dirY = Math.sign(f.y - this.y);
					let dist = Math.max(Math.abs(f.x - this.x), Math.abs(f.y - this.y));
					// foodPhero gene: Steer towards food
					let bonus = (this.genome.traits.foodPhero * 20) / dist;
					for (let m of moves) if (m.dx === dirX && m.dy === dirY) m.score += bonus;
				}
			}
			
			// Corpses
			if (this.genome.traits.predation > -0.5) {
				for (let c of world.corpses) {
					if (seeEntity(c.x, c.y)) {
						let dirX = Math.sign(c.x - this.x);
						let dirY = Math.sign(c.y - this.y);
						let dist = Math.max(Math.abs(c.x - this.x), Math.abs(c.y - this.y));
						// foodPhero gene: Steer towards edible corpses
						let bonus = (this.genome.traits.foodPhero * 20) / dist;
						for (let m of moves) if (m.dx === dirX && m.dy === dirY) m.score += bonus;
					}
				}
			}
			
			// Creatures
			for (let other of world.creatures) {
				if (other.isDead || other === this) continue;
				if (seeEntity(other.x, other.y)) {
					let dirX = Math.sign(other.x - this.x);
					let dirY = Math.sign(other.y - this.y);
					let dist = Math.max(Math.abs(other.x - this.x), Math.abs(other.y - this.y));
					
					if (other.faction === this.faction) {
						// herding gene: Move towards friends
						let bonus = (this.genome.traits.herding * 15) / dist;
						for (let m of moves) if (m.dx === dirX && m.dy === dirY) m.score += bonus;
					} else {
						// aggression gene: Move towards enemies (if > 0) or away (if < 0)
						let bonus = (this.genome.traits.aggression * 25) / dist;
						for (let m of moves) {
							if (m.dx === dirX && m.dy === dirY) m.score += bonus;
							// Fleeing: Give a bonus for moving in the opposite direction
							if (this.genome.traits.aggression < 0 && m.dx === -dirX && m.dy === -dirY) m.score -= bonus;
						}
					}
				}
			}
			
			// 5. Pick the best move
			if (moves.length > 0) {
				// Add slight randomness to break ties
				moves.forEach(m => m.score += Math.random() * 0.1);
				moves.sort((a, b) => b.score - a.score);
				let best = moves[0];
				
				if (best.dx !== 0 || best.dy !== 0) {
					world.grid[this.x][this.y].occupied = false;
					this.x = best.nx;
					this.y = best.ny;
					world.grid[this.x][this.y].occupied = true;
					
					this.lastDx = best.dx;
					this.lastDy = best.dy;
				}
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
			let spawned = false;
			
			for(let dx = -1; dx <= 1; dx++) {
				for(let dy = -1; dy <= 1; dy++) {
					if (dx === 0 && dy === 0) continue;
					
					let nx = this.x + dx;
					let ny = this.y + dy;
					
					if (nx >= 0 && nx < Config.GRID_W && ny >= 0 && ny < Config.GRID_H) {
						if (!world.grid[nx][ny].occupied) {
							this.energy /= 2;
							
							// mutationRate gene: Modifies the global mutation volatility
							let mutRate = Config.mutationVolatility * Math.max(0.1, 1.0 + this.genome.traits.mutationRate);
							let childGenome = new Genome(this.genome, mutRate);
							
							let child = new Creature(nx, ny, this.faction, childGenome, this.generation + 1);
							
							world.spawnQueue.push(child);
							world.grid[nx][ny].occupied = true;
							spawned = true;
							break;
						}
					}
				}
				if (spawned) break;
			}
		}
	}
	
	interact(world) {
		// altruism gene: Determine how much of the food source is consumed (10% to 100%)
		let consumeRatio = 1.0 - Math.max(0, this.genome.traits.altruism * 0.9);
		
		for (let i = world.food.length - 1; i >= 0; i--) {
			let f = world.food[i];
			if (Math.abs(f.x - this.x) <= 1 && Math.abs(f.y - this.y) <= 1) {
				f.energy = f.energy || 50; // Initialize food energy if not present
				let amount = f.energy * consumeRatio;
				
				this.energy += amount;
				f.energy -= amount;
				
				if (f.energy <= 5) {
					world.container.removeChild(f.sprite);
					world.food.splice(i, 1);
				}
				
				if (this.genome.traits.emitFood > 0) world.addPheromone(this.x, this.y, 'food', 20);
				break;
			}
		}
		
		if (this.genome.traits.predation > -0.5) {
			for (let i = world.corpses.length - 1; i >= 0; i--) {
				let c = world.corpses[i];
				if (Math.abs(c.x - this.x) <= 1 && Math.abs(c.y - this.y) <= 1) {
					let amount = c.energy * consumeRatio;
					
					this.energy += amount;
					c.energy -= amount;
					
					if (c.energy <= 5) {
						world.container.removeChild(c.sprite);
						world.corpses.splice(i, 1);
					}
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
					
					// emitDanger gene: Emits danger pheromones when hurt
					if (other.genome.traits.emitDanger > 0) {
						world.addPheromone(other.x, other.y, 'danger', other.genome.traits.emitDanger * 50);
					}
					
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
