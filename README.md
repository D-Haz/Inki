# Inki 2D

**Dynamic Ink Blot Simulation**
=============================

A JavaScript implementation of the Game of Life algorithm, rendered on a canvas element.

**Features**
------------

* **Game of Life rules**: The simulation follows the standard Game of Life rules.
* **Customizable**: Adjustable parameters include cell size, speed, initial cell probability, and mutation rate.
* **Interactive**: The simulation adapts to window resizes.
* **Random mutations and resets**: Prevents stagnation and introduces new patterns.

**Technical Details**
--------------------

* **Language**: JavaScript
* **Canvas element**: Used for rendering the simulation
* **Game of Life algorithm**: Implemented using a 2D grid and cellular automaton rules
* **Customization options**: Cell size, speed, initial cell probability, and mutation rate can be adjusted

**Getting Started**
-------------------

1. Clone the repository: `git clone https://github.com/your-username/dynamic-ink-blot-simulation.git`
2. Open the `index.html` file in a web browser to see the simulation in action.

**Dynamic Ink Blot Simulation Documentation**
=====================================================

**Overview**
------------

This code simulates a dynamic ink blot effect using the Game of Life algorithm. The simulation is rendered on a canvas element and can be controlled through various parameters.

**Classes**
------------

### InkBlotLife

This class represents the ink blot simulation. It encapsulates the game logic, rendering, and animation.

#### Constructor

* `canvas`: The canvas element to render the simulation on.
* Initializes the simulation with default parameters.

#### Methods

* `createGrid()`: Creates a 2D grid with random initial cell states.
* `countNeighbors(x, y)`: Counts the number of live neighbors for a given cell.
* `nextGeneration()`: Updates the grid to the next generation based on the Game of Life rules.
* `drawInkBlot()`: Renders the current state of the grid on the canvas.
* `randomlyResetGrid()`: Randomly resets a portion of the grid to introduce new patterns.
* `animate()`: Animates the simulation by updating the grid and rendering the next frame.
* `start()`: Starts the animation loop.

#### Properties

* `canvas`: The canvas element to render the simulation on.
* `ctx`: The 2D drawing context of the canvas.
* `width` and `height`: The dimensions of the canvas.
* `cellSize`: The size of each cell in the grid.
* `speed`: The speed of the simulation in milliseconds.
* `initialCellProbability`: The probability of a cell being alive in the initial grid.
* `mutationRate`: The probability of a cell mutating to a different state.
* `cols` and `rows`: The dimensions of the grid.
* `grid`: The 2D grid representing the current state of the simulation.
* `frameCount`: The number of frames rendered.

**Game of Life Rules**
----------------------

The simulation follows the standard Game of Life rules:

* Any live cell with fewer than two live neighbors dies (underpopulation).
* Any live cell with two or three live neighbors lives (normal life).
* Any live cell with more than three live neighbors dies (overpopulation).
* Any dead cell with exactly three live neighbors becomes a live cell (reproduction).

**Mutation and Random Reset**
-----------------------------

To prevent stagnation, the simulation introduces random mutations and resets:

* `mutationRate`: The probability of a cell mutating to a different state.
* `randomlyResetGrid()`: Randomly resets a portion of the grid to introduce new patterns.

**Animation and Rendering**
---------------------------

The simulation uses the `animate()` method to update the grid and render the next frame. The `drawInkBlot()` method renders the current state of the grid on the canvas using a radial gradient to create the ink blot effect.

**Resize Handling**
-------------------

The simulation listens for window resize events and updates the canvas dimensions, grid dimensions, and grid state accordingly.

**Customization**
-----------------

You can customize the simulation by adjusting the following parameters:

* `cellSize`: The size of each cell in the grid.
* `speed`: The speed of the simulation in milliseconds.
* `initialCellProbability`: The probability of a cell being alive in the initial grid.
* `mutationRate`: The probability of a cell mutating to a different state.

These parameters can be adjusted by modifying the `InkBlotLife` class constructor or by creating a new instance with custom parameters.
