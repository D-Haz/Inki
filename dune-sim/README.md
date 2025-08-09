# Sand Dune Wind Simulation (Microphone Reactive)

A browser-based particle simulation that mimics soft desert dunes being shaped by wind. The wind intensity is driven by microphone input (blowing into your mic increases wind). Particles wrap at the edges for seamless dunes.

## Run locally
- Open `index.html` in a modern browser (Chrome/Edge/Safari/Firefox).
- For microphone access, most browsers require a secure context (HTTPS or `localhost`). The simplest way is to serve the folder with a local server:
  - Python 3: `python3 -m http.server 8080`
  - Node: `npx serve -l 8080`
- Then open `http://localhost:8080` in your browser.

No deployment is required.

## Controls
- Reset dunes: Click the "Reset" button or press `R`.
- Blow into the microphone to increase wind speed.

## Notes
- If the microphone is blocked/unavailable, the simulation falls back to a gentle ambient breeze.
- Particle count scales with screen resolution (capped to keep performance reasonable).