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
		this.guardTurns = 0; // Added: Turns to wait after a kill
		
		this.lastDx = 0;
		this.lastDy = 0;
		
		this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
		// Modified: Draw creatures as 2x2
		this.sprite.width = 2;
		this.sprite.height = 2;
		this.sprite.tint = faction === 'blue' ? Config.COLOR_BLUE : Config.COLOR_RED;
		this.updatePosition();
	}
	
	updatePosition() {
		// Modified: Offset by 1.5 to center the 2x2 sprite in the 5x5 cell
		this.sprite.x = this.x * Config.CELL_SIZE + 1.5;
		this.sprite.y = this.y * Config.CELL_SIZE + 1.5;
	}
	
	die(world) {
		this.isDead = true;
		this.sprite.tint = Config.COLOR_CORPSE;
		
		// Modified: Clean up spatial grid references
		world.grid[this.x][this.y].occupied = false;
		world.grid[this.x][this.y].creature = null;
		
		let baseEnergy = 50 + (this.energy * 0.5 * (this.age / 100));
		let corpseObj = {
			x: this.x, y: this.y,
			energy: baseEnergy * Config.corpseEnergyMultiplier,
			sprite: this.sprite,
			isCorpse: true
		};
		
		world.corpses.push(corpseObj);
		world.grid[this.x][this.y].corpseList.push(corpseObj); // Register corpse to spatial grid
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
		
		// Added: Check if resting/guarding a kill
		if (this.guardTurns > 0) {
			this.guardTurns--;
		} else {
			for(let s = 0; s < speedLimit; s++) {
				let moves =[];
				
				// 1. Generate all possible valid moves
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
				let visRange = Math.round(3 + (this.genome.traits.visionFocus * 4));
				visRange = Math.max(1, Math.min(7, visRange));
				
				let seeEntity = (ex, ey) => {
					let dist = Math.max(Math.abs(ex - this.x), Math.abs(ey - this.y));
					if (dist > visRange || dist === 0) return false;
					
					if (this.genome.traits.visionFocus > 0 && (this.lastDx !== 0 || this.lastDy !== 0)) {
						let vx = ex - this.x;
						let vy = ey - this.y;
						let dot = (vx * this.lastDx + vy * this.lastDy) / (Math.sqrt(vx*vx+vy*vy) * Math.sqrt(this.lastDx*this.lastDx+this.lastDy*this.lastDy));
						if (dot < 0.5) return false;
					}
					return true;
				};
				
				// 3. Evaluate each valid move based on genes
				let hungerFactor = Math.max(0, 1.0 - (this.energy / 100));
				let effectiveRestlessness = this.genome.traits.restlessness + hungerFactor;
				
				for (let m of moves) {
					if (m.dx === 0 && m.dy === 0) {
						m.score -= effectiveRestlessness * 10;
						continue; // Skip pheromones and walls for the tile we are already standing on
					}
					
					if (m.dx === this.lastDx && m.dy === this.lastDy) {
						m.score += this.genome.traits.searchPattern * 5;
					} else if (m.dx === -this.lastDx && m.dy === -this.lastDy) {
						m.score -= 2; // Penalty for immediately backtracking/vibrating
					}
					
					let walls = 0;
					for (let wx = -1; wx <= 1; wx++) {
						for (let wy = -1; wy <= 1; wy++) {
							let cx = m.nx + wx;
							let cy = m.ny + wy;
							if (cx === this.x && cy === this.y) continue; // Don't count self as a wall
							if (cx < 0 || cx >= Config.GRID_W || cy < 0 || cy >= Config.GRID_H || world.grid[cx][cy].occupied) {
								walls++;
							}
						}
					}
					m.score += this.genome.traits.thigmotaxis * walls * 2;
					
					let cell = world.grid[m.nx][m.ny];
					m.score += cell.n * this.genome.traits.neutralPhero * 0.1; // Reduced weight so it doesn't overpower vision
					m.score += cell.f * this.genome.traits.foodPhero * 0.3;
					m.score += cell.d * this.genome.traits.dangerPhero * 0.3;
				}
				
				// 4. Entity Vision Evaluation (Optimized with Dot Products for Pathing)
				let minX = Math.max(0, this.x - visRange);
				let maxX = Math.min(Config.GRID_W - 1, this.x + visRange);
				let minY = Math.max(0, this.y - visRange);
				let maxY = Math.min(Config.GRID_H - 1, this.y + visRange);
				
				for (let cx = minX; cx <= maxX; cx++) {
					for (let cy = minY; cy <= maxY; cy++) {
						if (!seeEntity(cx, cy)) continue;
						
						let cell = world.grid[cx][cy];
						
						// Food
						for (let f of cell.foodList) {
							let dirX = Math.sign(f.x - this.x);
							let dirY = Math.sign(f.y - this.y);
							let dist = Math.max(Math.abs(f.x - this.x), Math.abs(f.y - this.y));
							let bonus = (this.genome.traits.foodPhero * 20) / dist;
							for (let m of moves) {
								if (m.dx === 0 && m.dy === 0) continue;
								let dot = (m.dx * dirX) + (m.dy * dirY);
								if (dot > 0) m.score += bonus * dot; // Rewards any move in the general direction
							}
						}
						
						// Corpses
						if (this.genome.traits.predation > -0.5) {
							for (let c of cell.corpseList) {
								let dirX = Math.sign(c.x - this.x);
								let dirY = Math.sign(c.y - this.y);
								let dist = Math.max(Math.abs(c.x - this.x), Math.abs(c.y - this.y));
								let bonus = (this.genome.traits.foodPhero * 20) / dist;
								for (let m of moves) {
									if (m.dx === 0 && m.dy === 0) continue;
									let dot = (m.dx * dirX) + (m.dy * dirY);
									if (dot > 0) m.score += bonus * dot;
								}
							}
						}
						
						// Creatures
						let other = cell.creature;
						if (other && !other.isDead && other !== this) {
							let dirX = Math.sign(other.x - this.x);
							let dirY = Math.sign(other.y - this.y);
							let dist = Math.max(Math.abs(other.x - this.x), Math.abs(other.y - this.y));
							
							if (other.faction === this.faction) {
								let bonus = (this.genome.traits.herding * 15) / dist;
								for (let m of moves) {
									if (m.dx === 0 && m.dy === 0) continue;
									let dot = (m.dx * dirX) + (m.dy * dirY);
									if (dot > 0) m.score += bonus * dot;
								}
							} else {
								let bonus = (this.genome.traits.aggression * 25) / dist;
								for (let m of moves) {
									if (m.dx === 0 && m.dy === 0) continue;
									let dot = (m.dx * dirX) + (m.dy * dirY);
									
									if (this.genome.traits.aggression >= 0) {
										// Aggressive: move toward
										if (dot > 0) m.score += bonus * dot;
										if (dot < 0) m.score -= bonus * Math.abs(dot);
									} else {
										// Fleeing: move away
										if (dot < 0) m.score += Math.abs(bonus) * Math.abs(dot);
										if (dot > 0) m.score -= Math.abs(bonus) * dot;
									}
								}
							}
						}
					}
				}
				
				// 5. Pick the best move
				if (moves.length > 0) {
					moves.forEach(m => m.score += Math.random() * 0.1);
					moves.sort((a, b) => b.score - a.score);
					let best = moves[0];
					
					if (best.dx !== 0 || best.dy !== 0) {
						world.grid[this.x][this.y].occupied = false;
						world.grid[this.x][this.y].creature = null;
						
						this.x = best.nx;
						this.y = best.ny;
						
						world.grid[this.x][this.y].occupied = true;
						world.grid[this.x][this.y].creature = this;
						
						this.lastDx = best.dx;
						this.lastDy = best.dy;
					}
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
							
							let mutRate = Config.mutationVolatility * Math.max(0.1, 1.0 + this.genome.traits.mutationRate);
							let childGenome = new Genome(this.genome, mutRate);
							
							let child = new Creature(nx, ny, this.faction, childGenome, this.generation + 1);
							
							world.spawnQueue.push(child);
							
							world.grid[nx][ny].occupied = true;
							world.grid[nx][ny].creature = child;
							
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
		let consumeRatio = 1.0 - Math.max(0, this.genome.traits.altruism * 0.9);
		
		let interactedFood = false;
		let interactedCorpse = false;
		let interactedCreature = false;
		
		let minX = Math.max(0, this.x - 1);
		let maxX = Math.min(Config.GRID_W - 1, this.x + 1);
		let minY = Math.max(0, this.y - 1);
		let maxY = Math.min(Config.GRID_H - 1, this.y + 1);
		
		for (let cx = minX; cx <= maxX; cx++) {
			for (let cy = minY; cy <= maxY; cy++) {
				let cell = world.grid[cx][cy];
				
				// Food
				if (!interactedFood && cell.foodList.length > 0) {
					for (let i = cell.foodList.length - 1; i >= 0; i--) {
						let f = cell.foodList[i];
						f.energy = f.energy || 50;
						let amount = f.energy * consumeRatio;
						
						this.energy += amount;
						f.energy -= amount;
						
						if (f.energy <= 5) {
							world.container.removeChild(f.sprite);
							world.food.splice(world.food.indexOf(f), 1);
							cell.foodList.splice(i, 1);
						}
						
						if (this.genome.traits.emitFood > 0) world.addPheromone(this.x, this.y, 'food', 20);
						interactedFood = true;
						break;
					}
				}
				
				// Corpses
				if (this.genome.traits.predation > -0.5 && !interactedCorpse && cell.corpseList.length > 0) {
					for (let i = cell.corpseList.length - 1; i >= 0; i--) {
						let c = cell.corpseList[i];
						let amount = c.energy * consumeRatio;
						
						this.energy += amount;
						c.energy -= amount;
						
						if (c.energy <= 5) {
							world.container.removeChild(c.sprite);
							world.corpses.splice(world.corpses.indexOf(c), 1);
							cell.corpseList.splice(i, 1);
						}
						interactedCorpse = true;
						break;
					}
				}
				
				// Creatures
				if (this.genome.traits.aggression > 0 && !interactedCreature) {
					let other = cell.creature;
					if (other && !other.isDead && other.faction !== this.faction) {
						let dmg = 20 + (this.genome.traits.aggression * 10) - (other.genome.traits.armor * 10);
						other.energy -= Math.max(5, dmg);
						
						if (other.genome.traits.emitDanger > 0) {
							world.addPheromone(other.x, other.y, 'danger', other.genome.traits.emitDanger * 50);
						}
						
						if (other.energy <= 0) {
							this.kills++;
							if(this.genome.traits.emitFood > 0) world.addPheromone(this.x, this.y, 'food', 30);
							
							// Added: Spend 10-20 turns besides their kill before moving on
							this.guardTurns = Math.floor(Math.random() * 11) + 10;
						}
						world.showFight(this.x, this.y);
						interactedCreature = true;
					}
				}
			}
		}
	}
}
