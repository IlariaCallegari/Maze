const newGame = () => {
  //acquiring properties from Matter
  const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

  const cellsHorizontal = 20;
  const cellsVertical = 15;
  const width = window.innerWidth;
  const height = window.innerHeight;

  //define our dimensions for the walls
  const unitLenghtX = width / cellsHorizontal;
  const unitLenghtY = height / cellsVertical;

  //Boilerplate code
  const engine = Engine.create();
  //disable gravity
  engine.world.gravity.y = 0;
  const { world } = engine;
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width,
      height,
      wireframes: false,
    },
  });

  //draw the updates of our world onto the screen
  Render.run(render);
  Runner.run(Runner.create(), engine);

  //walls
  const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
  ];

  World.add(world, walls);

  //Maze Generation
  //function to shuffle the neighbours array
  const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);
      counter--;
      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }
    return arr;
  };

  //Grid
  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  //pick a random cell to start the maze
  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  const stepThoroughCell = (row, column) => {
    //if I have visited the cell at row, column then return
    if (grid[row][column]) {
      //don't need to specify === true as it is a boolean value and can be evaluated also this way
      return;
      //Mark this cell as being visited -- true
    } else {
      grid[row][column] = true;
    }
    //Assemble randomly order list of neighbours
    const neighbours = shuffle([
      [row - 1, column, "up"],
      [row, column + 1, "right"],
      [row + 1, column, "down"],
      [row, column - 1, "left"],
    ]);
    //for each neighbour...
    for (let neighbour of neighbours) {
      const [nextRow, nextColumn, direction] = neighbour;
      //check if that neighbour is out of bounds
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal
      ) {
        continue;
      }
      //if we have visited that neighbour, continue to next neighbour
      if (grid[nextRow][nextColumn]) {
        continue;
      }
      //remove a wall either horizontal or vertical
      if (direction === "left") {
        verticals[row][column - 1] = true;
      } else if (direction === "right") {
        verticals[row][column] = true;
      } else if (direction === "up") {
        horizontals[row - 1][column] = true;
      } else {
        horizontals[row][column] = true;
      }
      //visit that next cell
      stepThoroughCell(nextRow, nextColumn);
    }
  };
  stepThoroughCell(startRow, startColumn);

  //iterate through horizontals to draw the walls
  horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      } else {
        const wall = Bodies.rectangle(
          columnIndex * unitLenghtX + unitLenghtX / 2,
          rowIndex * unitLenghtY + unitLenghtY,
          unitLenghtX,
          3,
          {
            isStatic: true,
            label: "wall",
            render: {
              fillStyle: "#fbbbb9",
            },
          }
        );
        World.add(world, wall);
      }
    });
  });

  //iterate through verticals to draw the walls
  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      } else {
        const wall = Bodies.rectangle(
          columnIndex * unitLenghtX + unitLenghtX,
          rowIndex * unitLenghtY + unitLenghtY / 2,
          3,
          unitLenghtY,
          {
            isStatic: true,
            label: "wall",
            render: {
              fillStyle: "#fbbbb9",
            },
          }
        );
        World.add(world, wall);
      }
    });
  });

  //goal
  const goal = Bodies.rectangle(
    width - unitLenghtX / 2,
    height - unitLenghtY / 2,
    unitLenghtX * 0.7,
    unitLenghtY * 0.7,
    {
      label: "goal",
      isStatic: true,
      render: {
        fillStyle: "#008080",
      },
    }
  );
  World.add(world, goal);

  //ball
  const ballRadius = Math.min(unitLenghtX, unitLenghtY) * 0.4;
  const ball = Bodies.circle(unitLenghtX / 2, unitLenghtY / 2, ballRadius, {
    label: "ball",
    render: {
      fillStyle: "#95B9C7",
    },
  });
  World.add(world, ball);

  //Keyword presses commands
  document.addEventListener("keydown", (event) => {
    const { x, y } = ball.velocity;

    if (event.code === "KeyW" || event.code === "ArrowUp") {
      Body.setVelocity(ball, { x, y: y - 5 });
    }
    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      Body.setVelocity(ball, { x: x - 5, y });
    }
    if (event.code === "KeyS" || event.code === "ArrowDown") {
      Body.setVelocity(ball, { x, y: y + 5 });
    }
    if (event.code === "KeyD" || event.code === "ArrowRight") {
      Body.setVelocity(ball, { x: x + 5, y });
    }
  });

  //Win condition
  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((collision) => {
      const labels = ["ball", "goal"];
      if (
        labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
      ) {
        document.querySelector(".hidden").classList.add("winner");
        world.gravity.y = 1;
        world.bodies.forEach((body) => {
          if (body.label === "wall") {
            Body.setStatic(body, false);
          }
        });
      }
    });
  });

  //start a new game when button is clicked
  const button = document.querySelector("button");
  button.addEventListener("click", () => {
    World.clear(world);
    Engine.clear(engine);
    Render.stop(render);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.texture = {};
    document.querySelector(".hidden").classList.remove("winner");
    newGame();
  });
};

newGame();
