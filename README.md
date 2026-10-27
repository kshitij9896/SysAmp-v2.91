# 🎧 SysAmp v2.91

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Daemon-2496ED.svg)](https://www.docker.com/)

**SysAmp** is a full-stack system observability deck and Docker container manager disguised as the iconic **1997 Winamp 2.x interface**. 

Built for developers who miss the tactile joy of retro software, SysAmp replaces boring cloud metric tables and heavy desktop apps with a real-time, skinnable, chiptune-enabled telemetry command center.

---

## 🏛️ System Architecture

```text
       +---------------------------------------------------------+
       |                  SYSAMP FRONTEND (React 19)             |
       |  - Retro Winamp UI, Windowshade Mode, Canvas Visualizer |
       +----------------------------+----------------------------+
                                    |
                 HTTP Polling (1s)  |  REST Control Actions
                 & WebSockets       |  (/api/telemetry, /action)
                                    v
       +---------------------------------------------------------+
       |             SYSAMP BACKEND BRIDGE (Node.js)             |
       |  - Express Server on port 4091                          |
       |  - Windows/Linux Hardware Diagnostics (systeminformation)|
       +-------+---------------------------------------+---------+
               |                                       |
               v                                       v
     [ Docker Daemon ]                       [ OS Process Fallback ]
     (dockerode / docker.sock)               (Active Windows/Linux PIDs)
               |
               v
     +---------------------------------------------------+
     |  ⚡ "Whip the Llama" Local Ollama AI Doctor      |
     |  (Queries localhost:11434 / Gemma models)         |
     +---------------------------------------------------+

```

##  Key Features

>*Classic Winamp 2.x Interface: Authentic pixel fonts, beveled window panels, and a draggable layout (Main Player, 10-Band Equalizer, Playlist Editor).*

>*Windowshade Mini-Mode: Double-click the title bar to collapse the app into a sleek 14px horizontal status strip for your workspace.*

>*Dual-Engine Telemetry: Streams real-time CPU core loads, RAM, network KB/s, and active Docker containers (with graceful fallback to top OS processes if Docker is offline).*

>*Interactive Visualizer Canvas: Toggle between an 18-bar segmented LED Spectrum Analyzer and a real-time Oscilloscope Waveform.*

>*⚡ "Whip the Llama" AI Doctor: Integrates with local Ollama (gemma3:4b) to analyze crashed container logs and scroll instant root-cause fixes across the green LED marquee.*

📦 Playlist Exporter: Export your running container playlist instantly as a production-ready docker-compose.yml file.


##  📂 Repository Structure

```text
sysamp/
├── frontend/         # React 19 + Vite + Tailwind CSS v4 UI
├── backend/          # Node.js + Express + Dockerode telemetry bridge
├── package.json      # Root orchestrator scripts (concurrently)
└── README.md         # Main project documentation (this file)

```
🚀 Quick Start Guide
1. Prerequisites
Node.js (v18+) installed.

Docker Desktop running (optional, falls back to OS processes if closed).

Ollama installed with a local model (optional, for AI diagnostics):

```bash

ollama pull gemma2:2b

```

2. Clone & Install

Clone the repository and install dependencies for both workspaces:

```bash

git clone [https://github.com/kshitij9896/SysAmp-v2.91.git](https://github.com/kshitij9896/SysAmp-v2.91.git)
cd SysAmp-v2.91

# Install root orchestrator
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

```

3. Launch with One Command
Run the unified root script to spin up both the backend bridge (localhost:4091) and frontend UI (localhost:5173) simultaneously:

```bash

npm run dev

```


Open http://localhost:5173 in your browser, click 🕹️ SIMULATOR MODE in the top bar to switch to ⚡ LIVE BRIDGE: ON, and watch your server come alive!


Documentation

[Frontend guide](frontend/README.md): Frontend guide 
[Backend guide](backend/README.md): Backend guide

📜 License
MIT License © 2026 Kshitij & Contributors.
