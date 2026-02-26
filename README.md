# Snakes On a Window

A lightweight Snake game built with plain HTML, CSS, and JavaScript. It runs directly in the browser with no backend or build step.

## Run

### Option 1: Open directly
- Open `index.html` in a modern browser.

### Option 2: Static server (recommended)
From the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls

### Keyboard
- **Arrow keys** or **WASD**: Move snake
- **Space**: Start / Pause / Resume
- **R**: Restart immediately
- **M**: Open/close the options menu
- **F**: Toggle fullscreen

### Touch / Mobile
- Use the on-screen D-pad buttons (Up / Down / Left / Right).

## Gameplay Rules

- The game is played on a fixed grid (`24x24`) rendered to an HTML canvas.
- The snake moves in fixed ticks (time-step based), not frame-rate based.
- Eating food increases score and grows the snake.
- Food spawns only on empty cells.
- You lose on collision with wall or self (unless wrap mode is enabled).
- If the snake fills the entire board, you win.

## Main UI

To reduce clutter, only these are always visible:
- **Score**
- **High Score**
- **Tick (ms)**

Everything else is grouped into a single **Game Menu** that opens from the **⚙ settings button** or by pressing **M**.
You can fullscreen the game container from the **⛶ fullscreen button** or by pressing **F**.

## Game Menu Features

- Start/Pause and Restart buttons
- Wrap mode toggle
- Barrier mode toggle
- Barrier density selector (Low / Medium / High)
- Speed scaling toggle
- Difficulty selector (Easy / Normal / Hard / Expert / Insane)
- Audio toggle
- Light theme toggle
- Snake cosmetics:
  - Shape (Block / Rounded / Diamond)
  - Body color picker
  - Head style (Auto darker / Match body / Brighter)

## Barrier Mode

Barrier Mode is supported. When enabled, random barrier objects spawn at the start of each run and act as lethal obstacles. They remain fixed for the match and are regenerated on restart (or when barrier settings change).

## Notes

- Direction reversal is prevented (you cannot instantly move into the opposite direction).
- Input is buffered to allow at most one direction change per movement tick for consistency.
- Overlays are shown for START, PAUSED, GAME OVER, and WIN states.
- The app gracefully handles restricted environments where `localStorage` or WebAudio may be unavailable.
