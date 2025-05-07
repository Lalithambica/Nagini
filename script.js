// Game constants and variables
const GRID_SIZE = 18;
const FOOD_SPAWN_RANGE = {min: 2, max: 16}; // Grid range for food/bomb spawn
let inputDir = {x: 0, y: 0};
const moveSound = new Audio("/move.mp3");
const foodSound = new Audio("/food.mp3");
const gameOverSound = new Audio("/Game_Over.mp3");
let speed = 6;
let foodSpeed = 4;
let lastPaintTime = 0;
let lastFoodMoveTime = 0;
let snakeArr = [{x: 13, y: 15}];
let food = {x: 6, y: 7};
let bomb = null;
let score = 0;

// Game functions

// Main game loop
function main(ctime) {
    window.requestAnimationFrame(main);

    // Control game speed
    if ((ctime - lastPaintTime) / 1000 < 1/speed) return;
    lastPaintTime = ctime;

    moveFood(ctime);
    gameEngine();
}

// Collision check: snake collides with itself or walls
function collide(snake) {
    // Snake collides with itself
    for (let i = 1; i < snakeArr.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }

    // Snake collides with wall
    if (snake[0].x >= GRID_SIZE || snake[0].x <= 0 || snake[0].y >= GRID_SIZE || snake[0].y <= 0) {
        return true;
    }

    return false;
}



// Move food with intelligence
function moveFood(ctime) {
    if ((ctime - lastFoodMoveTime) / 1000 < 1 / foodSpeed) return;
    lastFoodMoveTime = ctime;

    const dx = food.x - snakeArr[0].x;
    const dy = food.y - snakeArr[0].y;
    const snakeDist = Math.sqrt(dx * dx + dy * dy);
    const threshold = 4;

    let moveX = 0, moveY = 0;

    // Move food away from snake
    if (snakeDist <= threshold) {
        if (Math.abs(dx) >= Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }
    } else if (bomb) {
        // Move toward bomb
        const bdx = bomb.x - food.x;
        const bdy = bomb.y - food.y;
        if (Math.abs(bdx) >= Math.abs(bdy)) {
            moveX = bdx > 0 ? 1 : -1;
        } else {
            moveY = bdy > 0 ? 1 : -1;
        }
    }

    const newFoodPos = {
        x: food.x + moveX,
        y: food.y + moveY
    };

    // Avoid overlap with snake and boundaries
    if (isPositionValid(newFoodPos)) {
        food = newFoodPos;
    }
}

// Helper function: Check if food position is valid
function isPositionValid(newPos) {
    return newPos.x > 0 && newPos.x < GRID_SIZE &&
           newPos.y > 0 && newPos.y < GRID_SIZE &&
           !snakeArr.some(seg => seg.x === newPos.x && seg.y === newPos.y);
}



// Game engine: logic for snake movement, food consumption, and collisions
function gameEngine() {
    if (collide(snakeArr)) {
        gameOverSound.play();
        gameOver();
        return;
    }

    if (bomb && snakeArr[0].x === bomb.x && snakeArr[0].y === bomb.y) {
        gameOverSound.play();
        gameOver("Boom! You hit a bomb 💣 Game Over!");
        return;
    }

    // Snake eats food
    if (snakeArr[0].x === food.x && snakeArr[0].y === food.y) {
        foodSound.play();
        score++;
        updateHighScore();
        scorebox.innerHTML = "Score: " + score;

        snakeArr.unshift({
            x: snakeArr[0].x + inputDir.x,
            y: snakeArr[0].y + inputDir.y
        });

        spawnFoodAndBomb();
    }

    // Move snake
    moveSnake();

    // Render the game
    renderGame();
}

// Update high score if current score exceeds previous
function updateHighScore() {
    if (score > hiscoreval) {
        hiscoreval = score;
        localStorage.setItem("hiscore", JSON.stringify(hiscoreval));
        hiscorebox.innerHTML = "HiScore: " + hiscoreval;
    }
}

// Handle game over
function gameOver(message = "Game Over :( Press Ctrl + R to restart") {
    
    inputDir = {x: 0, y: 0};
    alert(message);
    resetGame();
}

// Reset game state
function resetGame() {
    snakeArr = [{x: 13, y: 15}];
    score = 0;
    scorebox.innerHTML = "Score: 0";
    bomb = null;
}

// Move snake based on input direction
function moveSnake() {
    for (let i = snakeArr.length - 2; i >= 0; i--) {
        snakeArr[i + 1] = {...snakeArr[i]};
    }

    snakeArr[0].x += inputDir.x;
    snakeArr[0].y += inputDir.y;
}

// Render snake, food, and bomb
function renderGame() {
    playArea.innerHTML = "";

    // Render snake
    snakeArr.forEach((e, index) => {
        let snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        snakeElement.classList.add(index === 0 ? 'head' : 'snake');
        playArea.appendChild(snakeElement);
    });

    // Render food
    renderElement(food, 'food');

    // Render bomb if exists
    if (bomb) {
        renderElement(bomb, 'bomb');
    }
}

// Render an element (food or bomb)
function renderElement(pos, className) {
    let element = document.createElement('div');
    element.style.gridRowStart = pos.y;
    element.style.gridColumnStart = pos.x;
    element.classList.add(className);
    playArea.appendChild(element);
}

// Spawn new food and bomb
function spawnFoodAndBomb() {
    let newFoodPos;
    do {
        newFoodPos = {
            x: Math.floor(Math.random() * (FOOD_SPAWN_RANGE.max - FOOD_SPAWN_RANGE.min + 1)) + FOOD_SPAWN_RANGE.min,
            y: Math.floor(Math.random() * (FOOD_SPAWN_RANGE.max - FOOD_SPAWN_RANGE.min + 1)) + FOOD_SPAWN_RANGE.min
        };
    } while (snakeArr.some(seg => seg.x === newFoodPos.x && seg.y === newFoodPos.y));

    food = newFoodPos;

    // Randomly generate a bomb (50% chance)
    if (Math.random() < 0.4) {
        let newBombPos;
        do {
            newBombPos = {
                x: Math.floor(Math.random() * (FOOD_SPAWN_RANGE.max - FOOD_SPAWN_RANGE.min + 1)) + FOOD_SPAWN_RANGE.min,
                y: Math.floor(Math.random() * (FOOD_SPAWN_RANGE.max - FOOD_SPAWN_RANGE.min + 1)) + FOOD_SPAWN_RANGE.min
            };
        } while (
            (newBombPos.x === food.x && newBombPos.y === food.y) ||
            snakeArr.some(seg => seg.x === newBombPos.x && seg.y === newBombPos.y)
        );
        bomb = newBombPos;
    } else {
        bomb = null;
    }
}

// Main logic for high score
let hiscore = localStorage.getItem("hiscore");

if (hiscore === null) {
    hiscoreval = 0;
    localStorage.setItem("hiscore", JSON.stringify(hiscoreval));
} else {
    hiscoreval = JSON.parse(hiscore);
    hiscorebox.innerHTML = "HiScore: " + hiscoreval;
}

window.requestAnimationFrame(main);

// Keyboard input handling
window.addEventListener('keydown', e => {
    moveSound.play();
    switch (e.key) {
        case "ArrowUp":
            inputDir = {x: 0, y: -1};
            break;
        case "ArrowDown":
            inputDir = {x: 0, y: 1};
            break;
        case "ArrowLeft":
            inputDir = {x: -1, y: 0};
            break;
        case "ArrowRight":
            inputDir = {x: 1, y: 0};
            break;
    }
});
