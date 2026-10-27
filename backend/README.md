# ⚡ SysAmp Backend Bridge (Node.js & Docker Daemon)

> *The high-performance hardware telemetry and container orchestration engine powering SysAmp v2.91.*

The **SysAmp Backend** is a lightweight, zero-bloat Express server running on **`http://localhost:4091`**. It bridges your web frontend directly to your local operating system and Docker daemon, streaming live CPU core loads, RAM, network traffic, and container process states in real-time.

---

## 🚀 Core Architecture & Capabilities

*   **Dual-Engine Playlist Resolution:**
    *   **Docker Mode:** Automatically communicates with the local Docker daemon (`dockerode`) to inspect active containers, stream their actual stdout logs, and execute transport commands.
    *   **OS Process Fallback Mode:** If Docker Desktop is offline, it seamlessly falls back to querying the top memory-heavy Windows/Linux OS processes, allowing full testing and transport control without crashing.
*   **Real-Time Hardware Telemetry (`systeminformation`):**
    *   Polls core-by-core CPU utilization, active RAM usage, swap memory, and network I/O ($\text{KB/s}$) every second.
    *   Synthesizes a 10-band resource equalizer array (`[CPU1, CPU2, CPU3, CPU4, RAM, SWAP, DISK, NET-I, NET-O, TOTAL]`) for the frontend visualizer.
*   **Container Transport Control API:**
    *   Exposes secure REST endpoints to **Start**, **Pause**, **Unpause**, and **Stop** real containers or freeze OS process telemetry snapshots on the fly.
*   **Windows & Linux Safe:**
    *   Engineered with robust optional chaining and platform guards to handle Windows-specific file-system and network metrics without throwing unhandled exceptions.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js (REST API & CORS middleware)
*   **Hardware Diagnostics:** `systeminformation` npm package
*   **Docker API Wrapper:** `dockerode` (Communicates via local named pipes / Unix sockets)

---

## 📂 Project Structure

```text
backend/
├── server.js         # Main Express telemetry bridge & Docker orchestrator
├── package.json      # Dependencies and start scripts
└── README.md         # Backend documentation (this file)

```


## Installation & Setup

1. Prerequisites
Ensure you have Node.js and npm installed on your machine. For full container management capabilities, ensure Docker Desktop is installed and running.

2. Install Dependencies
Navigate into the backend folder and install the required modules:

```bash
cd backend
npm install

```

3. Start the Server
Run the telemetry bridge:

```bash
npm start
# or: node server.js

```


The server will output:

```text
====================================================
⚡ SysAmp Telemetry Bridge Online: http://localhost:4091
   - Telemetry URL : http://localhost:4091/api/telemetry
====================================================
```

🔌 API Endpoints Reference
1. Get Live Telemetry & Playlist
URL: GET /api/telemetry

Response (200 OK)

```bash
{
  "cpuPercent": 24,
  "netKbps": 184,
  "eqBands": [22, 28, 19, 31, 62, 25, 40, 18, 22, 24],
  "containers": [
    {
      "id": "a1b2c3d4e5f6",
      "name": "nginx-reverse-proxy",
      "image": "nginx:alpine",
      "port": "80:8080",
      "status": "RUNNING",
      "cpu": 12,
      "mem": 48,
      "uptime": "Up 4 hours",
      "logs": ["10.0.0.1 - GET /health 200 4ms"]
    }
  ]
}

```
2. Control Container State
URL: POST /api/container/:id/:action

Parameters:

:id — Container ID (12-char hex) or Process ID (pid-xxxx).

:action — Either start, pause, or stop.

Response (200 OK):

```bash
{
  "success": true,
  "id": "a1b2c3d4e5f6",
  "action": "stop"
}
```


📜 License
MIT License © 2026 Kshitij & Contributors.