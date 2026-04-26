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
			// Inherit and mutate from parent
			traitNames.forEach(t => {
				let val = parentGenome.traits[t];
				if (Math.random() < 0.2) { // 20% chance to mutate a specific gene
					val += (Math.random() * 0.4 - 0.2) * mutationRate;
				}
				// Clamp between -1.0 and 1.0
				this.traits[t] = Math.max(-1.0, Math.min(1.0, val));
			});
		} else {
			// TRULY Random Base:
			traitNames.forEach(t => this.traits[t] = (Math.random() * 2) - 1.0);
		}
	}
	
	static vary(targetValue, variance = 0.3) {
		let val = targetValue + (Math.random() * variance * 2 - variance);
		return Math.max(-1.0, Math.min(1.0, val));
	}
	
	static createBaseBlue() {
		let g = new Genome();
		
		g.traits.photoEfficiency = Genome.vary(0.8, 0.3);
		g.traits.predation       = Genome.vary(-0.8, 0.2); // Mostly Herbivore
		g.traits.aggression      = Genome.vary(-0.9, 0.2); // Mostly Flee
		g.traits.speed           = Genome.vary(0.2, 0.4);  // Speed varies wildly
		
		// Added: New Blue Traits
		g.traits.restlessness    = Genome.vary(-0.5, 0.3); // Tends to stay put if safe
		g.traits.searchPattern   = Genome.vary(-0.6, 0.3); // Sweeper, thorough
		g.traits.thigmotaxis     = Genome.vary(0.5, 0.3);  // Hugs walls/friends
		g.traits.visionFocus     = Genome.vary(-0.8, 0.2); // 360 prey vision
		g.traits.neutralPhero    = Genome.vary(0.7, 0.3);  // Follows trails
		g.traits.foodPhero       = Genome.vary(0.8, 0.3);  // Loves food scent
		g.traits.dangerPhero     = Genome.vary(-0.9, 0.1); // Flees danger scent
		g.traits.emitDanger      = Genome.vary(0.9, 0.1);  // Screams when hurt
		g.traits.herding         = Genome.vary(0.8, 0.3);  // Highly social
		g.traits.altruism        = Genome.vary(0.7, 0.3);  // Shares food
		g.traits.mutationRate    = Genome.vary(-0.5, 0.3); // Stable genetics
		
		return g;
	}
	
	static createBaseRed() {
		let g = new Genome();
		
		g.traits.photoEfficiency = Genome.vary(-0.5, 0.3); // Poor at photosynthesis
		g.traits.predation       = Genome.vary(0.9, 0.1);  // Strict Carnivore
		g.traits.aggression      = Genome.vary(0.9, 0.2);  // Highly Aggressive
		g.traits.speed           = Genome.vary(0.6, 0.3);  // Generally fast
		
		// Added: New Red Traits
		g.traits.restlessness    = Genome.vary(0.8, 0.2);  // Always hunting
		g.traits.searchPattern   = Genome.vary(0.8, 0.2);  // Cruiser, straight lines
		g.traits.thigmotaxis     = Genome.vary(-0.7, 0.3); // Open space seeker
		g.traits.visionFocus     = Genome.vary(0.8, 0.2);  // Tunnel vision
		g.traits.neutralPhero    = Genome.vary(-0.5, 0.3); // Explorer
		g.traits.foodPhero       = Genome.vary(0.8, 0.3);  // Loves food scent
		g.traits.dangerPhero     = Genome.vary(0.9, 0.1);  // Rushes to fights
		g.traits.emitDanger      = Genome.vary(-0.8, 0.2); // Dies quietly
		g.traits.herding         = Genome.vary(-0.5, 0.5); // Loner
		g.traits.altruism        = Genome.vary(-0.9, 0.1); // Glutton
		g.traits.mutationRate    = Genome.vary(0.5, 0.3);  // High mutation
		
		return g;
	}
}
