export class Genome {
	constructor(parentGenome = null, mutationRate = 0.5) {
		this.traits = {};
		
		const traitNames = [
			"photoEfficiency", "predation", "metabolism",
			"speed", "restlessness", "searchPattern", "thigmotaxis",
			"visionFocus", "neutralPhero", "foodPhero", "dangerPhero",
			"emitNeutral", "emitFood", "emitDanger",
			"herding", "altruism",
			"aggression", "armor", "reproThreshold", "mutationRate", "lifespan"
		];
		
		if (parentGenome) {
			// Inherit and mutate
			traitNames.forEach(t => {
				let val = parentGenome.traits[t];
				if (Math.random() < 0.2) { // 20% chance to mutate a specific gene
					val += (Math.random() * 0.4 - 0.2) * mutationRate;
				}
				this.traits[t] = Math.max(-1.0, Math.min(1.0, val)); // Clamp -1 to 1
			});
		} else {
			// Random base
			traitNames.forEach(t => this.traits[t] = 0);
		}
	}
	
	static createBaseBlue() {
		let g = new Genome();
		g.traits.photoEfficiency = 0.8;
		g.traits.predation = -0.8; // Herbivore
		g.traits.aggression = -0.9; // Flee
		g.traits.speed = 0.2;
		g.traits.foodPhero = 0.8;
		g.traits.herding = 0.8;
		return g;
	}
	
	static createBaseRed() {
		let g = new Genome();
		g.traits.photoEfficiency = -0.5;
		g.traits.predation = 0.9; // Carnivore
		g.traits.aggression = 0.9; // Attack
		g.traits.speed = 0.6;
		g.traits.visionFocus = 0.8; // Tunnel vision
		g.traits.herding = -0.5;
		return g;
	}
}
