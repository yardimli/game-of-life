export const Config = {
	GRID_W: 300,
	GRID_H: 100,
	CELL_SIZE: 5,
	
	// Simulation Settings
	cycles: 0,
	speed: 1,
	paused: false,
	photosynthesisRate: 1.0,
	mutationVolatility: 0.5,
	
	// Added: New simulation settings
	corpseEnergyMultiplier: 1.0,
	foodSpawnRate: 1,
	foodSpawnEnabled: true, // Added: Toggle for random food
	clickAction: 'select',
	
	// Initial Spawn Counts
	INIT_BLUES: 20,
	INIT_REDS: 20,
	
	// Colors
	COLOR_BLUE: 0x4da6ff,
	COLOR_RED: 0xff4d4d,
	COLOR_FOOD: 0x55ff55,
	COLOR_CORPSE: 0x888888,
	COLOR_FIGHT: 0xffff00
};
