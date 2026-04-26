## genome

The Complete Cooperative Genome (Scale: -1.0 to +1.0)

I. Metabolism & Diet (Energy Generation)

1. Photosynthesis Efficiency:
   +1.0: Generates high energy passively from empty/lit tiles.
   -1.0: Cannot generate passive energy.

2. Predation Efficiency:
   +1.0: Gains massive energy from attacking/eating other creatures.
   -1.0: Herbivore/Pacifist. Cannot extract energy from meat.

3. Metabolic Rate:
   +1.0: High energy burn per turn, but allows for high-performance actions.
   -1.0: Low energy burn, highly efficient but sluggish.


II. Movement & Foraging (The "Blind" State)
These genes dictate how a creature moves when it sees no entities and smells no pheromones.

4. Base Speed:
   +1.0: Moves multiple squares per turn.
   -1.0: Moves only 1 square per turn.

5. Restlessness:
   +1.0 (Hyperactive): Always moving, constantly burning energy to search.
   -1.0 (Idle): Stops moving entirely when there is nothing of interest, saving energy.

6. Search Pattern:
   +1.0 (Cruiser): Moves in a perfectly straight line until hitting a wall. (Covers maximum distance).
   -1.0 (Sweeper): Moves erratically/randomly. (Thoroughly searches a localized area).

7. Thigmotaxis (Obstacle Preference):
   +1.0 (Wall-Hugger): Seeks out and moves alongside walls/obstacles.
   -1.0 (Center-Seeker): Actively paths away from walls into wide-open spaces.


III. Senses & Pheromone Responses (The Navigation System)

8. Vision Focus:
   +1.0 (Tunnel Vision): Sees very far, but only in a narrow cone in front of it.
   -1.0 (Prey Vision): Sees in a 360-degree circle, but with very short range.

9. Neutral Pheromone Response (The Pathing Gene):
   +1.0 (Highway Follower): Seeks out Neutral pheromones to walk where others have walked.
   -1.0 (Pioneer/Explorer): Actively avoids Neutral pheromones to force itself into unexplored, scentless territory.

10. Food Pheromone Response (The Hunger Gene):
    +1.0 (Gatherer): Strongly steers toward Food pheromones.
    -1.0 (Ignore): Ignores food markers (useful for dedicated guards/fighters).

11. Danger Pheromone Response (The Fight or Flight Gene):
    +1.0 (The Enforcer): Seeks out Danger pheromones. Rushes toward the threat to fight it.
    -1.0 (The Coward): Flees from Danger pheromones, using them as an early-warning system to escape.


IV. Pheromone Emission (The Communication System)

12. Neutral Emission (Footprints):
    +1.0: Passively leaves a Neutral trail on every tile it steps on.
    -1.0: Leaves no footprint (Stealthy).

13. Food Emission (The Dinner Bell):
    +1.0: Drops a massive Food pheromone burst when it eats or kills.
    -1.0: Eats in absolute silence, leaving no scent.

14. Danger Emission (The Distress Beacon):
    +1.0: Emits a massive Danger pheromone burst when it spots a predator or takes damage.
    -1.0: Dies quietly; alerts no one.


V. Social & Cooperation (Pack Dynamics)

15. Herding Instinct:
    +1.0: Actively moves toward creatures of its own species if they enter visual range.
    -1.0: Loner; avoids its own species if it sees them.

16. Altruism (Resource Sharing):
    +1.0 (Provider): Consumes only a small fraction of a food source/corpse, leaving the rest for the herd.
    -1.0 (Glutton): Consumes 100% of the food instantly.


VI. Reproduction, Defense & Lifespan

17. Aggression Level:
    +1.0: Will attack non-herd members on sight.
    -1.0: Will never initiate an attack, relying entirely on fleeing.

18. Armor/Shell:
    +1.0: High damage reduction.
    -1.0: Unarmored/squishy.

19. Reproduction Threshold: (Energy required to clone).

20. Mutation Rate: (How wildly offspring vary).

21. Maximum Lifespan: (Hard turn limit before death).


write the game requirements in an organized fashion add features that will make the game more fun to play and watch. the game is mostly a simulation where user interacts occasionally only.

------

# 🧬 Game Design Document: "EvoGrid: Red vs. Blue"

## 1. Core Overview
**Game Type:** Zero-Player Artificial Life Simulation (Ant-Farm style) with "God Mode" interactions.

**Technology:** HTML5, JavaScript/TypeScript, PixiJS (WebGL rendering for high performance).

**Objective:** Observe the evolutionary arms race between two factions (Red and Blue) as they mutate, adapt, fight, and survive based on a 21-trait cooperative genome.

## 2. Screen Layout & UI Architecture
The application will be split into two main sections:

### A. The Left Control Panel (approx. 400px wide)
*   **Global Stats:** Current Cycle count, Total Population (Red vs Blue), FPS counter.
*   **Simulation Controls:** Play, Pause, Speed Slider (1x to 100x), Step Forward.
*   **Environment Settings:** Sliders to adjust global variables (see Section 6).
*   **Entity Inspector:** When a creature is clicked, this displays:
    *   Creature ID, Age, Generation, Faction, Energy Level, and Kill Count.
    *   **[Fun Factor] Radar View:** A small UI canvas showing exactly what the creature currently sees in its vision cone.
    *   **Genome Readout:** A visual bar chart showing their 21 traits (-1.0 to +1.0).
*   **God Powers:** Toggle buttons for user click actions (e.g., "Place Food", "Place Wall", "Kill Entity").

### B. The Game Canvas (1500x500 pixels)
*   **Grid System:** 300 x 100 grid. Each cell is exactly 5x5 pixels.
*   **Rendering:** PixiJS `ParticleContainer` or instanced meshes should be used for creatures and pheromones to maintain 60FPS with thousands of entities.

---

## 3. Factions & Initial State
*   **The Blue Faction (Left Side):** Spawns with 5x the population of Red. Initial genome is biased toward Herbivore, Gatherer, High Photosynthesis, and Fleeing.
*   **The Red Faction (Right Side):** Spawns with 1x population. Initial genome is biased toward Carnivore, High Aggression, High Speed, and Tunnel Vision.
*   **Friend or Foe:** Creatures are color-blind to pheromones. They only identify Friend (same color) or Foe (opposite color) when an entity enters their visual range/cone.

---

## 4. World Entities & Mechanics

### A. Creatures
*   **Energy System:** Every action (moving, turning, existing) costs energy based on *Metabolic Rate*. If energy reaches 0, the creature dies of starvation.
*   **Reproduction:** Asexual cloning. When a creature exceeds its *Reproduction Threshold* energy, it splits into two. The offspring inherits the parent's genome, altered by the *Mutation Rate*.
*   **Aging:** Creatures die instantly when they hit their *Maximum Lifespan*.

### B. Corpses (The Afterlife)
*   When a creature dies, it turns into a Corpse (visually turns grey/brown).
*   **Energy Yield:** The corpse contains energy equal to: `Base Meat Value + (Remaining Stored Energy * Age Multiplier)`. (Older creatures are more nutritious).
*   Corpses have a specific "Edible" flag. They remain on the map permanently until consumed entirely by scavengers/predators.

### C. Food Caches
*   Spawn randomly across the map over time.
*   Users can click any empty grid cell to manually drop a massive food cache.

### D. Pheromones (The Grid Memory)
*   Pheromones are rendered as translucent colored overlays on the 5x5 grid cells.
*   **Colors:** Neutral (White/Grey), Food (Green), Danger (Orange/Red).
*   **Decay:** Pheromones slowly fade over time.
*   **[Fun Factor] Pheromone Map Toggle:** A hotkey to hide creatures and *only* show the glowing, swirling pheromone trails, creating beautiful generative art.

### E. Combat
*   When two opposing creatures occupy adjacent tiles and one has an Aggression > 0, an attack occurs.
*   Damage is calculated based on Aggression vs. Armor.
*   **[Fun Factor] Visual Combat:** When a fight happens, PixiJS will render a brief "clash" animation (e.g., a bright yellow spark/flash on the tile) so the player can easily spot skirmishes across the massive map.

---

## 5. The 21-Trait Genome System
*(As requested, mapped precisely from -1.0 to +1.0)*

**I. Metabolism & Diet**
1.  **Photosynthesis Efficiency:** (+1.0 High passive energy in empty space | -1.0 No passive energy).
2.  **Predation Efficiency:** (+1.0 Gains huge energy from eating meat/corpses | -1.0 Herbivore, gets 0 energy from meat).
3.  **Metabolic Rate:** (+1.0 High energy burn, fast action cooldowns | -1.0 Low energy burn, slow actions).

**II. Movement & Foraging**
4.  **Base Speed:** (+1.0 Moves multiple tiles per tick | -1.0 Moves 1 tile).
5.  **Restlessness:** (+1.0 Constantly moves | -1.0 Stops completely if nothing is sensed).
6.  **Search Pattern:** (+1.0 Straight lines/Cruiser | -1.0 Erratic/Sweeper).
7.  **Thigmotaxis:** (+1.0 Hugs walls/edges | -1.0 Seeks open center space).

**III. Senses & Pheromone Responses**
8.  **Vision Focus:** (+1.0 Long narrow cone | -1.0 Short 360-degree circle).
9.  **Neutral Pheromone Response:** (+1.0 Follows trails | -1.0 Avoids trails/Explorer).
10. **Food Pheromone Response:** (+1.0 Rushes to food scent | -1.0 Ignores food scent).
11. **Danger Pheromone Response:** (+1.0 Rushes to danger/Fighter | -1.0 Flees danger/Coward).

**IV. Pheromone Emission**
12. **Neutral Emission:** (+1.0 Leaves heavy footprints | -1.0 Stealth, no footprints).
13. **Food Emission:** (+1.0 Emits scent when eating | -1.0 Silent eater).
14. **Danger Emission:** (+1.0 Screams/emits scent when hurt | -1.0 Dies quietly).

**V. Social & Cooperation**
15. **Herding Instinct:** (+1.0 Moves toward friends | -1.0 Avoids friends/Loner).
16. **Altruism:** (+1.0 Eats only 10% of a food source | -1.0 Eats 100% of the food instantly).

**VI. Reproduction, Defense & Lifespan**
17. **Aggression Level:** (+1.0 Attacks foes on sight | -1.0 Never attacks, only flees).
18. **Armor/Shell:** (+1.0 High damage reduction | -1.0 Squishy).
19. **Reproduction Threshold:** (+1.0 Requires massive energy to clone | -1.0 Clones easily).
20. **Mutation Rate:** (+1.0 Offspring genome varies wildly | -1.0 Perfect clones).
21. **Maximum Lifespan:** (+1.0 Lives for many cycles | -1.0 Short-lived).

---

## 6. Player Settings & "God Mode" Parameters
To make the simulation highly interactive, the left panel will feature the following adjustable sliders that update the game in real-time:

*   **Photosynthesis Base Rate:** How much energy the sun provides globally. (Turn this to 0 to force an extinction event or force Blues to become scavengers).
*   **Pheromone Evaporation Rate:** How fast trails disappear.
*   **Global Food Spawn Rate:** How often random food caches appear.
*   **Age Multiplier for Corpses:** How much extra energy an old creature leaves behind.
*   **Global Mutation Volatility:** A multiplier applied to all reproduction. (Crank this up to force rapid, chaotic evolution).
*   **[Fun Factor] The "Mutagen" Brush:** Allow the user to paint an area on the grid. Any creature walking through it gets its genome randomized.
*   **[Fun Factor] The "Wall" Brush:** Allow the user to draw impassable terrain (walls) to create mazes, choke points, or safe zones.

---

## 7. "Fun to Watch" Features (Analytics & Visuals)

To elevate the game from a simple grid to an engaging simulation:

1.  **The Evolutionary Graph:** A small live line-chart at the bottom of the UI showing the average "Aggression" or "Speed" of the Blue faction over time. Watching the peaceful Blues slowly evolve into armored killers to survive the Reds is incredibly satisfying.
2.  **Hall of Fame (Leaderboard):** A UI tab tracking historical data:
    *   *The Apex Predator:* The creature with the highest kill count currently alive. (Given a visual crown icon on the map).
    *   *The Methuselah:* The oldest living creature.
3.  **Camera Tracking:** If a user clicks a creature, the camera can optionally "lock on" and pan with them, showing a highlighted overlay of their vision cone and the pheromones they are currently smelling.
4.  **Dynamic Coloring:** While Reds are red and Blues are blue, their *shade* can represent their genome. A highly aggressive Blue might be a dark, purplish-blue, while a fast, cowardly Blue is a bright cyan. This allows the player to visually identify evolutionary branches just by looking at the map.

## 8. Development / Technical Steps
1.  **Setup PixiJS Application:** Initialize a 1500x500 canvas. Create a 2D Array `Grid[300][100]` to hold spatial data (walls, food, corpses, pheromones).
2.  **Spatial Hashing:** Implement a spatial hash grid or QuadTree for creature vision and collision. Checking distance between thousands of entities every frame will kill performance without this.
3.  **Entity Class:** Create the base Creature class containing the 21-array genome, current energy, x/y coordinates, and facing angle.
4.  **The Brain (Update Loop):**
    *   *Sense:* Check vision cone for entities. Check current tile for pheromones.
    *   *Decide:* Use Genome weights to calculate a movement vector (e.g., if Danger scent is high and Gene 11 is -1.0, vector points away from scent).
    *   *Act:* Move, Attack, Eat, Emit Pheromones, or Reproduce.
5.  **UI Binding:** Connect HTML/CSS sliders to the JavaScript global variables.
