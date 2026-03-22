# EchoWalker - The Blind Audio Maze

> Navigate through darkness using only 3D spatial audio. No vision required.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://krunalkadtan.github.io/EchoWalker/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

**EchoWalker** is an immersive web-based audio maze game designed to be navigated using 3D spatial audio instead of visual cues. Players are trapped in an underground cave system and must follow the sound of ocean waves and seabird chirps to find the exit, using sonar echolocation to detect walls.

### Key Features

- **6 Difficulty Levels**: From 7×7 Demo to 31×31 Nightmare
- **3D Spatial Audio**: HRTF-based binaural sound positioning
- **Sonar Echolocation**: Press SPACEBAR for 4-direction wall detection
- **Realistic Ocean Waves**: Multi-layer synthesis with LFO modulation
- **Procedural Seabirds**: Random chirps positioned near the exit
- **Dynamic Footsteps**: Varies by movement speed (Creep/Walk/Run)
- **Tank Controls**: WASD for intuitive navigation

## Quick Start

### Play Online
**[Click here to play](https://krunalkadtan.github.io/EchoWalker/)** (Headphones recommended!)

### Run Locally
```bash
# Clone the repository
git clone https://github.com/KrunalKadtan/EchoWalker.git
cd EchoWalker

# Open index.html in your browser
# (No build process required - pure vanilla JavaScript!)
```

## Controls

| Key | Action |
|-----|--------|
| **W** | Move Forward |
| **S** | Move Backward |
| **A** | Rotate Left |
| **D** | Rotate Right |
| **SPACEBAR** | Fire Sonar Ping |
| **Q** | Cycle Speed Mode (Creep → Walk → Run) |
| **V** | Toggle View Mode (Coming soon) |

## Project Structure
```
EchoWalker/
├── index.html              # Main entry point
├── css/
│   └── style.css          # Stylesheets
├── js/
│   ├── game.js            # Main game controller
│   ├── maze.js            # Maze generation (recursive backtracking)
│   ├── player.js          # Movement & collision detection
│   ├── audio/
│   │   ├── audioEngine.js # Web Audio API initialization
│   │   ├── oceanWaves.js  # Multi-layer wave synthesis
│   │   ├── sonar.js       # Echolocation system
│   │   └── sounds.js      # Footsteps, collisions, victory
│   └── utils/
│       └── raycasting.js  # Wall detection utilities
├── assets/
│   └── screenshots/       # Game screenshots
├── docs/
│   └── TESTING.md         # Test documentation
└── README.md              # This file
```

## Technical Details

### Technologies Used
- **Pure Vanilla JavaScript (ES6+)** - No frameworks or libraries
- **Web Audio API** - HRTF spatial audio, LFO modulation, procedural synthesis
- **HTML5 Canvas** - Rendering (view modes)
- **CSS3** - Styling and animations

### Audio Architecture

#### Ocean Wave Synthesis
- **3 Frequency Layers**:
  - Low (200-800Hz): Deep rumble
  - Mid (400-1200Hz): Main wash
  - High (800-2000Hz): Surface splash
- **LFO Modulation**: 0.3Hz, 0.5Hz, 0.8Hz for wave motion
- **Random Crashes**: 3-7 second intervals

#### Sonar Echolocation
- **4-Direction Raycasting**: Front, Left, Right, Back
- **Distinct Frequencies**:
  - Front: 600Hz (center pan)
  - Left: 450Hz (left pan)
  - Right: 750Hz (right pan)
  - Back: 300Hz (center pan)
- **Distance Modulation**: Pitch ↑ and volume ↑ when closer to walls

#### 3D Spatial Audio
- **HRTF Panning**: True binaural audio
- **Distance Model**: Inverse rolloff
- **Listener Orientation**: Updates with player rotation

### Game Logic

#### Maze Generation
- **Algorithm**: Recursive backtracking
- **Guaranteed Solvable**: Always a valid path from start to exit
- **Difficulty Scaling**: 7×7 to 31×31 tiles

#### Collision Detection
- **Directional Awareness**: Detects front/back/left/right collisions
- **Sub-tile Precision**: 0.1 tile step resolution
- **Audio Feedback**: Thud sound on impact

## Team

| Name | Role | Contributions |
|------|------|---------------|
| **Krunal Kadtan** | Backend/Audio Engineer | Core game engine, audio systems, maze generation, collision detection, sonar system |
| **Vansh** | Frontend/UX Designer | UI/UX design, visual feedback systems, documentation, deployment |

## 📊 Development Timeline

### Week 1-2: Foundation
- ✅ Maze generation algorithm
- ✅ Player movement system
- ✅ Collision detection

### Week 3-4: Audio Engine
- ✅ Web Audio API initialization
- ✅ Multi-layer ocean wave synthesis
- ✅ 3D spatial audio positioning

### Week 5-6: Features
- ✅ Sonar echolocation system
- ✅ Footstep synthesis
- ✅ Victory detection

### Week 7: Polish & Testing
- ✅ Code optimization
- ✅ Testing across browsers
- ✅ Documentation

## 🙏 Acknowledgments

- Web Audio API Documentation
- Recursive Backtracking Algorithm Research
- HRTF Spatial Audio Research

## 📞 Contact

**Krunal Kadtan**
- GitHub: [@KrunalKadtan](https://github.com/KrunalKadtan)

**Vansh Bhanushali**
- Github: [@vanshapple](https://github.com/vanshapple)

- Project: [EchoWalker](https://github.com/KrunalKadtan/EchoWalker)

---

**Made with 🎧 for accessibility and immersion**
