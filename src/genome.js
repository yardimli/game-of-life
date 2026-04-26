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
			// Math.random() generates 0.0 to 1.0.
			// Multiplying by 2 gives 0.0 to 2.0.
			// Subtracting 1 gives -1.0 to 1.0.
			traitNames.forEach(t => this.traits[t] = (Math.random() * 2) - 1.0);
		}
	}
	
	/**
	 * Helper function to add randomness to the initial faction archetypes.
	 * @param {number} targetValue - The ideal starting trait value
	 * @param {number} variance - How much it can randomly deviate (±)
	 */
	static vary(targetValue, variance = 0.3) {
		let val = targetValue + (Math.random() * variance * 2 - variance);
		return Math.max(-1.0, Math.min(1.0, val)); // Keep it within -1.0 to 1.0
	}
	
	static createBaseBlue() {
		let g = new Genome(); // Starts with completely random traits
		
		// Override specific traits to make them "Blue", but with ±0.3 variance
		g.traits.photoEfficiency = Genome.vary(0.8, 0.3);
		g.traits.predation       = Genome.vary(-0.8, 0.2); // Mostly Herbivore
		g.traits.aggression      = Genome.vary(-0.9, 0.2); // Mostly Flee
		g.traits.speed           = Genome.vary(0.2, 0.4);  // Speed varies wildly
		g.traits.foodPhero       = Genome.vary(0.8, 0.3);
		g.traits.herding         = Genome.vary(0.8, 0.3);
		
		return g;
	}
	
	static createBaseRed() {
		let g = new Genome(); // Starts with completely random traits
		
		// Override specific traits to make them "Red", but with ±0.3 variance
		g.traits.photoEfficiency = Genome.vary(-0.5, 0.3); // Poor at photosynthesis
		g.traits.predation       = Genome.vary(0.9, 0.1);  // Strict Carnivore
		g.traits.aggression      = Genome.vary(0.9, 0.2);  // Highly Aggressive
		g.traits.speed           = Genome.vary(0.6, 0.3);  // Generally fast
		g.traits.visionFocus     = Genome.vary(0.8, 0.4);  // Tunnel vision
		g.traits.herding         = Genome.vary(-0.5, 0.5); // Usually loners
		
		return g;
	}
}
