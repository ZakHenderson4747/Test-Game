# Snake (Browser, Single Player)

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

### Touch / Mobile
- Use the on-screen D-pad buttons (Up / Down / Left / Right).

## Gameplay Rules

- The game is played on a fixed grid (`24x24`) rendered to an HTML canvas.
- The snake moves in fixed ticks (time-step based), not frame-rate based.
- Eating food increases score and grows the snake.
- Food spawns only on empty cells.
- You lose on collision with wall or self (unless wrap mode is enabled).
- If the snake fills the entire board, you win.

## UI / Modes / Toggles

- **Score**: Current run points
- **High Score**: Persisted using `localStorage`
- **Tick (ms)**: Current movement interval
- **Wrap mode**: Switch between walls and wrap-around edges
- **Speed scaling**: If enabled, speed increases as score grows
- **Difficulty**: Easy / Normal / Hard base speed
- **Audio**: Enables generated WebAudio SFX for eat and game over
- **Light theme**: Toggle between dark and light color themes

## Notes

- Direction reversal is prevented (you cannot instantly move into the opposite direction).
- Input is buffered to allow at most one direction change per movement tick for consistency.
- Overlays are shown for START, PAUSED, GAME OVER, and WIN states.
