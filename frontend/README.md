# 🎧 SysAmp v2.91 (Frontend)

**SysAmp** is a full-stack system observability and Docker management dashboard disguised as the iconic **1997 Winamp 2.x interface**. Built for developers who miss the tactile joy of retro software, it replaces boring cloud metric tables and heavy desktop apps with a real-time, skinnable, chiptune-enabled telemetry deck.

---

## ✨ Core Features

*   **Classic Winamp 2.x Multi-Window UI:** 
    *   Authentic bevels, pixel fonts, and draggable layout panels (Main Player, 10-Band Equalizer, Playlist Editor).
    *   **Windowshade Mini-Mode:** Double-click the title bar to collapse the entire application into a sleek 14px horizontal status strip for your workspace.
*   **Live Hardware & Docker Telemetry:** 
    *   Connects to the Node.js/Docker bridge (`localhost:4091`) to stream real-time CPU core loads, RAM utilization, network KB/s, and container states.
    *   **Fallback Resilience:** If Docker is offline, it seamlessly switches to tracking your top local OS processes.
*   **Interactive Visualizer Canvas:** 
    *   Toggle instantly between an 18-bar segmented LED Spectrum Analyzer (Green → Yellow → Red peak limits) and a real-time Oscilloscope Waveform.
*   **⚡ "Whip the Llama" AI Doctor:** 
    *   Integrates directly with local **Ollama (`gemma3:4b`)**. Click the lightning bolt icon to analyze crashed container or process logs, returning instant root-cause fixes across the green LED marquee.
*   **Retro Web Audio Chiptunes:** 
    *   Optional synthesized status beeps provide auditory feedback when interacting with container transport controls.
*   **📦 Playlist & Compose Exporter:** 
    *   Export your active container playlist instantly as a production-ready `docker-compose.yml` file (formatted like an old Winamp `.m3u` playlist).
*   **Skinnable Architecture:** 
    *   Switch between *Classic 1997*, *Cyber Matrix*, and *Amber CRT* colorways on the fly.

---

## 🛠️ Tech Stack

*   **Framework:** React 19 + Vite (Ultra-fast build tool)
*   **Styling:** Tailwind CSS v4 (Customized retro borders and dark-mode palettes)
*   **Icons:** Lucide React
*   **Graphics:** HTML5 Canvas API (Custom math-driven audio/telemetry rendering loop)
*   **Audio:** Native browser Web Audio API (Chiptune oscillator synth)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Node.js (v18+) installed on your machine.

### 2. Installation
Clone the repository and install dependencies inside the frontend folder:

```bash
git clone [https://github.com/kshitij9896/SysAmp-v2.91.git](https://github.com/kshitij9896/SysAmp-v2.91.git)
cd sysamp/frontend
npm install

```

3. Run Development Server

```bash
npm run dev

```

Open http://localhost:5173 in your browser.

🔌 Connecting to the Backend Bridge
To stream your real PC hardware stats and local Docker containers, make sure you have the companion backend running on port 4091:

1. Navigate to the backend folder:

```bash
cd ../backend
npm install
node server.js
```

2. In the SysAmp UI top bar, click the 🕹️ SIMULATOR MODE button to toggle it into ⚡ LIVE BRIDGE: ON. The status badge will light up green as CONNECTED.

⚡ Enabling Local Ollama AI ("Whip the Llama")
To let SysAmp query your local LLM (e.g., Gemma 3 or Gemma 2) without browser CORS restrictions:

1. Start Ollama with open origins enabled:

```bash
# PowerShell
$env:OLLAMA_ORIGINS="*"; ollama serve

# Command Prompt / Bash
set OLLAMA_ORIGINS=* && ollama serve
```

2. Select any container or process in SysAmp and click ⚡ WHIP LLAMA AI.

📜 License
MIT License © 2026 Kshitij & Contributors. Feel free to fork, skin, and whip your own servers!