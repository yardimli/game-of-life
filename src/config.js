export const Config = {
	GRID_W: 300,
	GRID_H: 100,
	CELL_SIZE: 5,
	
	// Simulation Settings
	cycles: 0,
	speed: 1,
	paused: false, // <--- ADD THIS LINE
	photosynthesisRate: 1.0,
	mutationVolatility: 0.5,
	
	// Initial Spawn Counts
	INIT_BLUES: 500,
	INIT_REDS: 100,
	
	// Colors
	COLOR_BLUE: 0x4da6ff,
	COLOR_RED: 0xff4d4d,
	COLOR_FOOD: 0x55ff55,
	COLOR_CORPSE: 0x888888,
	COLOR_FIGHT: 0xffff00
};
