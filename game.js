const GRID_SIZE = 24;
const CELL_SIZE = 20;
const BOARD_SIZE = GRID_SIZE * CELL_SIZE;
const BASE_TICK_MS_BY_DIFFICULTY = {
  easy: 180,
  normal: 140,
  hard: 110,
};
const MIN_TICK_MS = 70;
const SPEED_STEP_MS = 4;
const STORAGE_KEY_HIGH_SCORE = 'snake-high-score';

const STATES = {
  START: 'START',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  WIN: 'WIN',
};

const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const KEY_TO_DIRECTION = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};

const canvas = document.getElementById('gameCanvas');
canvas.width = BOARD_SIZE;
canvas.height = BOARD_SIZE;
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const speedEl = document.getElementById('speed');
const overlayEl = document.getElementById('overlay');
const overlayTitleEl = document.getElementById('overlayTitle');
const overlayTextEl = document.getElementById('overlayText');

const startPauseBtn = document.getElementById('startPauseBtn');
const restartBtn = document.getElementById('restartBtn');
const wrapToggle = document.getElementById('wrapToggle');
const speedScaleToggle = document.getElementById('speedScaleToggle');
const difficultySelect = document.getElementById('difficultySelect');
const audioToggle = document.getElementById('audioToggle');
const themeToggle = document.getElementById('themeToggle');

let state = STATES.START;
let snake = [];
let direction = 'right';
let bufferedDirection = null;
let hasBufferedThisTick = false;
let food = null;
let score = 0;
let highScore = Number(localStorage.getItem(STORAGE_KEY_HIGH_SCORE) || 0);
let accumulator = 0;
let lastFrameTime = performance.now();
let wrapMode = false;
let speedScalingEnabled = true;
let difficulty = 'normal';
let audioEnabled = true;
let tickMs = BASE_TICK_MS_BY_DIFFICULTY[difficulty];

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, duration = 0.08, type = 'square', gainValue = 0.04) {
  if (!audioEnabled) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playEatSound() {
  playTone(660, 0.06, 'triangle', 0.05);
}

function playGameOverSound() {
  playTone(180, 0.23, 'sawtooth', 0.05);
}

function updateTickMs() {
  const base = BASE_TICK_MS_BY_DIFFICULTY[difficulty];
  if (!speedScalingEnabled) {
    tickMs = base;
  } else {
    tickMs = Math.max(MIN_TICK_MS, base - score * SPEED_STEP_MS);
  }
  speedEl.textContent = `${tickMs} ms`;
}

function isCellOccupied(x, y) {
  return snake.some((segment) => segment.x === x && segment.y === y);
}

function spawnFood() {
  if (snake.length >= GRID_SIZE * GRID_SIZE) {
    food = null;
    setState(STATES.WIN);
    return;
  }

  const emptyCells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!isCellOccupied(x, y)) {
        emptyCells.push({ x, y });
      }
    }
  }

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  food = emptyCells[randomIndex] || null;
}

function checkCollision(nextHead) {
  if (wrapMode) {
    return snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
  }

  const outOfBounds =
    nextHead.x < 0 ||
    nextHead.x >= GRID_SIZE ||
    nextHead.y < 0 ||
    nextHead.y >= GRID_SIZE;

  if (outOfBounds) return true;

  return snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
}

function setState(nextState) {
  state = nextState;
  if (state === STATES.RUNNING) {
    overlayEl.classList.remove('show');
  } else {
    overlayEl.classList.add('show');
  }

  switch (state) {
    case STATES.START:
      overlayTitleEl.textContent = 'Press Space to Start';
      overlayTextEl.textContent = 'Arrow keys / WASD to move • R to restart';
      startPauseBtn.textContent = 'Start (Space)';
      break;
    case STATES.PAUSED:
      overlayTitleEl.textContent = 'Paused';
      overlayTextEl.textContent = 'Press Space to resume';
      startPauseBtn.textContent = 'Resume (Space)';
      break;
    case STATES.GAME_OVER:
      overlayTitleEl.textContent = 'Game Over';
      overlayTextEl.textContent = `Final score: ${score} • Press R to restart`;
      startPauseBtn.textContent = 'Start (Space)';
      break;
    case STATES.WIN:
      overlayTitleEl.textContent = 'You Win!';
      overlayTextEl.textContent = `Final score: ${score} • Press R to play again`;
      startPauseBtn.textContent = 'Start (Space)';
      break;
    case STATES.RUNNING:
      startPauseBtn.textContent = 'Pause (Space)';
      break;
    default:
      break;
  }
}

function updateScoreUI() {
  scoreEl.textContent = String(score);
  highScoreEl.textContent = String(highScore);
}

function saveHighScoreIfNeeded() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore));
    highScoreEl.textContent = String(highScore);
  }
}

function resetGame() {
  const mid = Math.floor(GRID_SIZE / 2);
  snake = [
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
    { x: mid - 3, y: mid },
  ];
  direction = 'right';
  bufferedDirection = null;
  hasBufferedThisTick = false;
  score = 0;
  accumulator = 0;
  updateTickMs();
  spawnFood();
  updateScoreUI();
  setState(STATES.START);
}

function queueDirection(nextDirection) {
  const currentDirection = bufferedDirection || direction;
  if (OPPOSITES[currentDirection] === nextDirection) {
    return;
  }
  if (hasBufferedThisTick) {
    return;
  }
  bufferedDirection = nextDirection;
  hasBufferedThisTick = true;
}

function applyBufferedDirection() {
  if (!bufferedDirection) return;
  if (OPPOSITES[direction] !== bufferedDirection) {
    direction = bufferedDirection;
  }
  bufferedDirection = null;
}

function toggleStartPause() {
  if (state === STATES.START) {
    setState(STATES.RUNNING);
  } else if (state === STATES.RUNNING) {
    setState(STATES.PAUSED);
  } else if (state === STATES.PAUSED) {
    setState(STATES.RUNNING);
  } else if (state === STATES.GAME_OVER || state === STATES.WIN) {
    resetGame();
    setState(STATES.RUNNING);
  }
}

function step() {
  applyBufferedDirection();

  const vector = DIRECTION_VECTORS[direction];
  let nextHead = {
    x: snake[0].x + vector.x,
    y: snake[0].y + vector.y,
  };

  if (wrapMode) {
    nextHead = {
      x: (nextHead.x + GRID_SIZE) % GRID_SIZE,
      y: (nextHead.y + GRID_SIZE) % GRID_SIZE,
    };
  }

  // Tail may move away, so collision check should ignore last segment unless eating.
  const isEating = food && nextHead.x === food.x && nextHead.y === food.y;
  const tail = snake[snake.length - 1];
  if (!isEating && tail.x === nextHead.x && tail.y === nextHead.y) {
    // Moving into current tail cell is safe because tail vacates this tick.
  } else if (checkCollision(nextHead)) {
    playGameOverSound();
    saveHighScoreIfNeeded();
    setState(STATES.GAME_OVER);
    return;
  }

  snake.unshift(nextHead);

  if (isEating) {
    score += 1;
    updateTickMs();
    updateScoreUI();
    playEatSound();
    spawnFood();
    saveHighScoreIfNeeded();
  } else {
    snake.pop();
  }

  if (state === STATES.WIN) {
    saveHighScoreIfNeeded();
  }

  hasBufferedThisTick = false;
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim() || '#2a3447';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const pos = i * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, BOARD_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(BOARD_SIZE, pos);
    ctx.stroke();
  }
}

function draw() {
  const css = getComputedStyle(document.documentElement);
  const panel = css.getPropertyValue('--panel-2').trim();
  const snakeColor = css.getPropertyValue('--snake').trim();
  const snakeHeadColor = css.getPropertyValue('--snake-head').trim();
  const foodColor = css.getPropertyValue('--food').trim();

  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  drawGrid();

  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? snakeHeadColor : snakeColor;
    ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  });

  if (food) {
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE * 0.34,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function gameLoop(now) {
  const delta = Math.min(now - lastFrameTime, 250);
  lastFrameTime = now;

  if (state === STATES.RUNNING) {
    accumulator += delta;
    while (accumulator >= tickMs && state === STATES.RUNNING) {
      step();
      accumulator -= tickMs;
    }
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function handleKeyDown(event) {
  const directionFromKey = KEY_TO_DIRECTION[event.key];

  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault();
    toggleStartPause();
    return;
  }

  if (event.key === 'r' || event.key === 'R') {
    resetGame();
    setState(STATES.RUNNING);
    return;
  }

  if (!directionFromKey) {
    return;
  }

  event.preventDefault();

  if (state === STATES.START) {
    setState(STATES.RUNNING);
  } else if (state === STATES.PAUSED || state === STATES.GAME_OVER || state === STATES.WIN) {
    return;
  }

  queueDirection(directionFromKey);
}

function bindUI() {
  document.addEventListener('keydown', handleKeyDown);

  startPauseBtn.addEventListener('click', () => {
    toggleStartPause();
  });

  restartBtn.addEventListener('click', () => {
    resetGame();
    setState(STATES.RUNNING);
  });

  wrapToggle.addEventListener('change', (event) => {
    wrapMode = event.target.checked;
  });

  speedScaleToggle.addEventListener('change', (event) => {
    speedScalingEnabled = event.target.checked;
    updateTickMs();
  });

  difficultySelect.addEventListener('change', (event) => {
    difficulty = event.target.value;
    updateTickMs();
  });

  audioToggle.addEventListener('change', (event) => {
    audioEnabled = event.target.checked;
    if (audioEnabled && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  });

  themeToggle.addEventListener('change', (event) => {
    document.documentElement.setAttribute('data-theme', event.target.checked ? 'light' : 'dark');
  });

  document.querySelectorAll('.dpad button[data-dir]').forEach((button) => {
    const press = (event) => {
      event.preventDefault();
      const dir = button.getAttribute('data-dir');
      if (!dir) return;
      if (state === STATES.START) {
        setState(STATES.RUNNING);
      }
      if (state !== STATES.RUNNING) return;
      queueDirection(dir);
    };

    button.addEventListener('pointerdown', press, { passive: false });
    button.addEventListener('touchstart', press, { passive: false });
  });

  document.querySelector('.dpad').addEventListener(
    'touchmove',
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );
}

function init() {
  updateScoreUI();
  updateTickMs();
  bindUI();
  resetGame();
  draw();
  requestAnimationFrame(gameLoop);
}

init();
