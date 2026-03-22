# EchoWalker - The Blind Audio Maze

> Navigate through darkness using only 3D spatial audio. No vision required.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://krunalkadtan.github.io/EchoWalker/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

**EchoWalker** is a browser-based maze survival game where the screen stays intentionally blank. Players navigate procedurally generated labyrinths using only synthesized 3D spatial audio — a guiding ocean wave beacon, sonar echolocation, and audio-only AI enemies called Monsters. No vision. No visual map. Just sound.

Built with **pure Vanilla JavaScript (ES6+)**, **HTML5**, and **CSS3** — no frameworks, no npm, no build process.

---

## Gameplay

You are trapped in an underground labyrinth. Find the exit by listening.

| Audio Cue | What it means |
|---|---|
| **Ocean waves** | Getting louder = moving toward the exit |
| **Sonar echo** | Short delay = wall is near. Long delay = open space ahead |
| **Heavy stomping** | A Monster is nearby — locate it by the direction of the sound |

**The Monster Horde** hunts by sound. Walk or run and they hear your footsteps. Ping sonar and they come running. Switch to **Creep mode** to go silent and shake them off.

---

## Controls

| Key | Action |
|---|---|
| **W / S** | Move Forward / Backward |
| **A / D** | Rotate Left / Right |
| **SPACEBAR** | Fire Sonar Ping (costs 2% energy) |
| **Q** | Cycle Speed: Creep → Walk → Run |
| **M** | Toggle Neon Debug Map |

---

## Difficulty Levels

| Difficulty | Maze Size | Monsters | Monster Behavior |
|---|---|---|---|
| Demo | 11×11 | 0 | — |
| Easy | 20×20 | 1 | Investigate (reacts to noise) |
| Medium | 30×30 | 3 | Investigate (reacts to noise) |
| Hard | 40×40 | 6 | Hunt (tracks you relentlessly) |

**Investigate mode:** Monsters wander randomly until they hear a footstep or sonar ping, then converge on the sound's origin. Creeping makes you silent — they lose your trail.

**Hunt mode:** Monsters path directly toward you at all times via BFS. No stealth, no escape.

---

## Features

- **Zero dependencies** — No npm, no CDN, no build pipeline. Open `index.html` and play.
- **Procedural Maze Generation** — Recursive Backtracking with a Braid Labyrinth post-processor that introduces loops for stealth-based evasion.
- **BFS Acoustic Path Guide** — The ocean beacon is repositioned along the BFS shortest solution path each frame, curving around corners instead of through walls.
- **HRTF 3D Spatial Audio** — All monster and exit sounds spatialized using the Web Audio API's HRTF PannerNode for true binaural positioning.
- **Psychoacoustic Monster Audio** — Sub-bass stomps (unlocalizable by human ears alone) are layered with a 3 kHz high-frequency crunch transient, making each monster's position pinpointable in 3D space.
- **Synthesized Cavern Reverb** — A 2.5-second exponential-decay impulse response generates a realistic underground acoustic environment in real time.
- **Sonar Echolocation** — Echo return delay and pitch are mathematically calibrated to physical wall distance (100 ms → 1000 ms; 1400 Hz → 800 Hz).
- **Energy Battery System** — Collisions and sonar pings drain energy. Zero energy = game over.
- **High Score Persistence** — Personal best times saved to `localStorage` per difficulty.
- **Premium Glassmorphism UI** — Animated fade transitions, neon debug map, live HUD (speed mode, sonar status, energy).

---

## Quick Start

### Play Online
**[Click here to play](https://krunalkadtan.github.io/EchoWalker/)** — Headphones strongly recommended!

---

## Project Structure

```
EchoWalker/
├── index.html              # Entry point, UI screens, HUD
├── css/
│   └── style.css           # Glassmorphism UI, animations
├── js/
│   ├── game.js             # Game controller, game loop, debug map, win/lose
│   ├── maze.js             # Maze generation (Recursive Backtracking + Braid) + BFS engines
│   ├── monster.js          # Monster AI (Investigate / Hunt), jump scare, noise alerts
│   ├── player.js           # Movement, collision detection, speed modes
│   ├── audio/
│   │   ├── audioEngine.js  # AudioContext, master gain, cavern reverb
│   │   ├── oceanWaves.js   # Multi-layer wave synthesis + BFS acoustic guide
│   │   ├── sonar.js        # Echolocation system
│   │   └── sounds.js       # Footsteps, monster horde audio, jump scare
│   └── utils/
│       └── raycasting.js   # DDA wall detection algorithm
├── screenshots/            # Game screenshots
└── EchoWalker_Mini_Project_Report.docx
```

---

## Technical Architecture

### Audio Engine (`audioEngine.js`)
- Creates the `AudioContext` and master gain chain
- Synthesizes a 2.5-second stereo cavern reverb impulse response using exponentially-decaying white noise
- Generates a 2-second white noise PCM buffer used by all wave synthesis modules

### Ocean Wave Synthesizer (`oceanWaves.js`)
Three simultaneous LFO-modulated bandpass noise layers:

| Layer | LFO Rate | Freq Range | Effect |
|---|---|---|---|
| Low | 0.3 Hz | 200–800 Hz | Deep ocean rumble |
| Mid | 0.5 Hz | 400–1200 Hz | Main wave wash |
| High | 0.8 Hz | 800–2000 Hz | Surface ripple |

The `exitPanner` (HRTF 3D PannerNode) is repositioned each frame to a BFS waypoint 6 hops ahead of the player along the solution path, with 2% exponential interpolation per frame for smooth corner transitions.

### Sonar Echolocation (`sonar.js`)
- DDA raycasting measures forward wall distance
- Outgoing ping: triangle wave 400→100 Hz sweep, 100 ms
- Echo return delay: `0.1 + (distance / 10) × 0.9` seconds
- Echo pitch: `1400 − (distance / 10) × 600` Hz
- 1-second cooldown between pings; error sound on early re-trigger

### Monster (`monster.js`)
- `spawnMonsters(level)` — populates the monster array based on difficulty
- `updateMonsters(now)` — per-tick AI state machine (Investigate / Hunt / Wander)
- `alertMonsters(x, y)` — broadcast acoustic disturbance to all Investigators
- `triggerJumpScare()` — audio cut + FM screech + SYSTEM FAILURE screen
- Each monster has an independent HRTF `PannerNode`; psychoacoustic 3 kHz crunch layered over sub-bass stomp for accurate spatial localization

### Maze Generation (`maze.js`)
1. **Recursive Backtracking** — perfect maze with exactly one path between any two tiles
2. **Braid Labyrinth post-processor** — dissolves ~N²/18 walls to create bypass loops for stealth evasion
3. **`buildPathMap()`** — BFS solution tree from exit to all tiles for the acoustic guide
4. **`findShortestPath()`** — point-to-point BFS for monster navigation

---

## Team

| Name | Role | Contributions |
|---|---|---|
| **Krunal Kadtan** | Developer | Game engine, audio systems, maze generation, monster AI, sonar, BFS acoustic guide |
| **Vansh Bhanushali** | Developer | UI/UX design, visual systems, HUD, glassmorphism, documentation, deployment |

---

## Acknowledgments

- W3C Web Audio API Specification
- Jamis Buck — Recursive Backtracking Maze Algorithms
- Jens Blauert — *Spatial Hearing: The Psychophysics of Human Sound Localization*

