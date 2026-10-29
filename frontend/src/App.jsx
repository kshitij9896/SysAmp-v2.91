import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Zap,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Download,
  Terminal,
  Cpu,
  Server,
  Activity,
  RefreshCw,
  Check,
  Copy,
  Radio,
  Sliders,
  ListMusic
} from 'lucide-react';

const API_TOKEN = import.meta.env.VITE_SYSAMP_API_TOKEN;

const INITIAL_CONTAINERS = [
  {
    id: 'c1',
    name: 'nginx-reverse-proxy',
    image: 'nginx:alpine',
    port: '80:8080',
    status: 'RUNNING',
    cpu: 12,
    mem: 48,
    uptime: '04:18:22',
    logs: [
      '10.0.0.1 - GET /api/v1/health 200 4ms',
      '10.0.0.4 - GET /static/main.js 200 12ms',
      'Worker process #1 accepting connections on 0.0.0.0:80'
    ]
  },
  {
    id: 'c2',
    name: 'postgres-primary-db',
    image: 'postgres:16-alpine',
    port: '5432:5432',
    status: 'RUNNING',
    cpu: 28,
    mem: 312,
    uptime: '12:04:11',
    logs: [
      'LOG: checkpoint starting: time',
      'LOG: checkpoint complete: wrote 42 buffers (8.4%)',
      'Connection authorized: user=admin database=production'
    ]
  },
  {
    id: 'c3',
    name: 'redis-session-cache',
    image: 'redis:7-alpine',
    port: '6379:6379',
    status: 'PAUSED',
    cpu: 2,
    mem: 64,
    uptime: '01:45:09',
    logs: [
      '1:M 27 Oct 2026 12:10:01.112 * DB saved on disk',
      'Process paused via SIGSTOP signal'
    ]
  },
  {
    id: 'c4',
    name: 'worker-queue-service',
    image: 'node:20-alpine',
    port: '4000:4000',
    status: 'EXITED',
    cpu: 0,
    mem: 0,
    uptime: '00:00:00',
    logs: [
      'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
      'Error: ECONNREFUSED 127.0.0.1:6379 at TCPConnectWrap.afterConnect',
      'npm ERR! Lifecycle script `start` failed with exit code 137 (OOMKilled)'
    ]
  },
  {
    id: 'c5',
    name: 'ollama-gemma-agent',
    image: 'ollama/ollama:latest',
    port: '11434:11434',
    status: 'RUNNING',
    cpu: 35,
    mem: 2450,
    uptime: '02:33:19',
    logs: [
      'GIN: 2026/10/27 - 12:55:10 | 200 | 1.42s | POST "/api/generate"',
      'Loaded model weights: gemma3:4b (Q4_K_M quantization)'
    ]
  }
];

const SKINS = {
  classic: {
    name: 'Classic 1997',
    bg: 'bg-[#29293d]',
    panel: 'bg-[#1a1a26]',
    border: 'border-[#52527a]',
    accent: '#00ff66',
    accentText: 'text-[#00ff66]',
    secondaryText: 'text-[#ffaa00]'
  },
  matrix: {
    name: 'Cyber Matrix',
    bg: 'bg-[#0a190f]',
    panel: 'bg-[#050d08]',
    border: 'border-[#1f5c32]',
    accent: '#00ff41',
    accentText: 'text-[#00ff41]',
    secondaryText: 'text-[#88ffaa]'
  },
  amber: {
    name: 'Amber CRT',
    bg: 'bg-[#2b1d0e]',
    panel: 'bg-[#140d06]',
    border: 'border-[#6e4823]',
    accent: '#ffb000',
    accentText: 'text-[#ffb000]',
    secondaryText: 'text-[#ffd980]'
  }
};

export default function App() {
  const [skin, setSkin] = useState('classic');
  const [windowshade, setWindowshade] = useState(false);
  const [showEq, setShowEq] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const [liveMode, setLiveMode] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState('SIMULATOR');
  const [ollamaModel, setOllamaModel] = useState('gemma3:4b');
  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [synthEnabled, setSynthEnabled] = useState(false);
  const [visMode, setVisMode] = useState('spectrum');
  const [stressPreset, setStressPreset] = useState('NORMAL');

  const [containers, setContainers] = useState(INITIAL_CONTAINERS);
  const [selectedId, setSelectedId] = useState('c1');
  const [eqBands, setEqBands] = useState([32, 28, 45, 30, 52, 48, 25, 40, 35, 22]);
  const [netKbps, setNetKbps] = useState(192);
  const [cpuKhz, setCpuKhz] = useState(44);
  const [marqueeText, setMarqueeText] = useState(
    '*** SYSAMP v2.91 READY — CLICK LIGHTNING BOLT TO WHIP THE LLAMA WITH OLLAMA AI ***'
  );
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef(null);
  const selectedContainer = containers.find((c) => c.id === selectedId) || containers[0];
  const currentSkin = SKINS[skin];

  const playBeep = (freq = 520, duration = 0.08, type = 'square') => {
    if (!synthEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (liveMode) {
        try {
          const res = await fetch('http://localhost:4091/api/telemetry', {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
          });
          if (!res.ok) throw new Error('Bridge unreachable');
          const data = await res.json();
          setBridgeStatus('CONNECTED');
          if (data.eqBands) setEqBands(data.eqBands);
          if (data.netKbps) setNetKbps(data.netKbps);
          if (data.cpuPercent) setCpuKhz(data.cpuPercent);
          if (data.containers && data.containers.length > 0) {
            setContainers(data.containers);
          }
          return;
        } catch {
          setBridgeStatus('OFFLINE');
        }
      } else {
        setBridgeStatus('SIMULATOR');
      }

      const multiplier =
        stressPreset === 'SPIKE'
          ? 1.9
          : stressPreset === 'LEAK'
          ? 1.5
          : stressPreset === 'DDOS'
          ? 2.2
          : 1.0;

      setEqBands((prev) =>
        prev.map((val) => {
          const delta = (Math.random() - 0.48) * 18 * multiplier;
          return Math.max(8, Math.min(98, Math.round(val + delta)));
        })
      );

      setNetKbps(Math.round((128 + Math.random() * 240) * multiplier));
      setCpuKhz(Math.min(99, Math.round((24 + Math.random() * 25) * multiplier)));
    }, 900);

    return () => clearInterval(interval);
  }, [liveMode, stressPreset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#191926';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      if (visMode === 'spectrum') {
        const numBars = 18;
        const barWidth = Math.floor(canvas.width / numBars) - 2;
        for (let i = 0; i < numBars; i++) {
          const baseVal = eqBands[i % eqBands.length] || 30;
          const jitter = Math.sin(Date.now() / 120 + i) * 10;
          const pct = Math.max(5, Math.min(100, baseVal + jitter));
          const barHeight = (pct / 100) * canvas.height;

          const segments = Math.floor(barHeight / 4);
          for (let s = 0; s < segments; s++) {
            const y = canvas.height - (s + 1) * 4;
            if (s > 9) ctx.fillStyle = '#ff2a2a';
            else if (s > 6) ctx.fillStyle = '#ffcc00';
            else ctx.fillStyle = currentSkin.accent;

            ctx.fillRect(i * (barWidth + 2) + 2, y, barWidth, 3);
          }
        }
      } else {
        ctx.strokeStyle = currentSkin.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const amp = (cpuKhz / 100) * (canvas.height / 2.2);
          const y =
            canvas.height / 2 +
            Math.sin(x * 0.12 + Date.now() / 70) * amp * Math.sin(x * 0.03);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [eqBands, visMode, cpuKhz, currentSkin]);

  const handleContainerAction = async (action) => {
    playBeep(action === 'START' ? 660 : action === 'PAUSE' ? 440 : 320, 0.1);
    const newStatus =
      action === 'START' ? 'RUNNING' : action === 'PAUSE' ? 'PAUSED' : 'EXITED';

    if (liveMode && bridgeStatus === 'CONNECTED') {
      try {
        await fetch(`http://localhost:4091/api/container/${selectedContainer.id}/${action.toLowerCase()}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
      } catch {}
    }

    setContainers((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContainer.id) return c;
        return {
          ...c,
          status: newStatus,
          cpu: newStatus === 'RUNNING' ? 18 : 0,
          mem: newStatus === 'EXITED' ? 0 : c.mem || 128,
          logs: [
            ...c.logs,
            `[SYSAMP ${new Date().toLocaleTimeString()}] Container state changed to ${newStatus}`
          ]
        };
      })
    );

    setMarqueeText(
      `>>> ${selectedContainer.name.toUpperCase()} [${newStatus}] — PORT ${selectedContainer.port} <<<`
    );
  };

  const whipTheLlamaAI = async () => {
    playBeep(880, 0.15, 'sawtooth');
    setAiLoading(true);
    setActiveModal('ai');

    const prompt = `You are SysAmp AI Doctor. Analyze this Docker container and give a 1-sentence root cause and exact CLI fix command.
Container: ${selectedContainer.name} (${selectedContainer.image})
Status: ${selectedContainer.status}
Recent Logs:
${selectedContainer.logs.join('\n')}`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt,
          stream: false
        })
      });

      if (!response.ok) throw new Error('Local Ollama not reachable');
      const data = await response.json();
      const cleanReply = data.response.trim();
      setAiDiagnosis(`[OLLAMA ${ollamaModel.toUpperCase()} LIVE]: ${cleanReply}`);
      setMarqueeText(`⚡ AI FIX (${selectedContainer.name}): ${cleanReply.replace(/\n/g, ' ')}`);
    } catch {
      const fallback =
        selectedContainer.status === 'EXITED'
          ? `OOMKilled (Exit 137) & Redis ECONNREFUSED on :6379. Fix: Resume redis-session-cache first, then run 'docker update --memory 512m ${selectedContainer.name} && docker restart ${selectedContainer.name}'.`
          : selectedContainer.status === 'PAUSED'
          ? `Container is frozen via SIGSTOP. Fix: Click Play (▶) or run 'docker unpause ${selectedContainer.name}'.`
          : `Container '${selectedContainer.name}' is healthy (${selectedContainer.cpu}% CPU, ${selectedContainer.mem}MB RAM). No anomalies in stdout.`;

      setAiDiagnosis(
        `[SMART DIAGNOSTIC ENGINE — Start Ollama with OLLAMA_ORIGINS="*" for live LLM]:\n\n${fallback}`
      );
      setMarqueeText(`⚡ AI DOCTOR: ${fallback}`);
    } finally {
      setAiLoading(false);
    }
  };

  const generateComposeYaml = () => {
    const services = containers
      .map(
        (c) => `  ${c.name}:
    image: ${c.image}
    container_name: ${c.name}
    ports:
      - "${c.port}"
    restart: ${c.status === 'RUNNING' ? 'always' : 'no'}`
      )
      .join('\n\n');

    return `#EXTM3U - Generated by SysAmp v2.91 Playlist Exporter
version: "3.9"
services:
${services}
`;
  };

  const downloadComposeFile = () => {
    const blob = new Blob([generateComposeYaml()], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.sysamp.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eqLabels = ['CPU1', 'CPU2', 'CPU3', 'CPU4', 'RAM', 'SWAP', 'DISK', 'NET-I', 'NET-O', 'GPU'];

  return (
    <div className="min-h-screen bg-[#0d0d14] text-gray-100 p-4 md:p-8 font-mono select-none flex flex-col items-center">
      <div className="w-full max-w-2xl mb-4 flex flex-wrap items-center justify-between gap-2 bg-[#161622] border border-[#32324d] px-3 py-2 rounded">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${currentSkin.accentText} animate-pulse`} />
          <span className="text-xs font-bold tracking-wider">SYSAMP v2.91 CONTROL DECK</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              bridgeStatus === 'CONNECTED'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                : bridgeStatus === 'OFFLINE'
                ? 'bg-red-950 text-red-400 border border-red-700'
                : 'bg-amber-950 text-amber-300 border border-amber-700'
            }`}
          >
            {bridgeStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`text-[11px] px-2.5 py-1 rounded border font-bold transition ${
              liveMode
                ? 'bg-emerald-700 border-emerald-400 text-white'
                : 'bg-[#232336] border-[#454566] text-gray-300 hover:bg-[#2e2e46]'
            }`}
            title="Toggle polling http://localhost:4091/api/telemetry"
          >
            {liveMode ? '⚡ LIVE BRIDGE: ON' : '🕹️ SIMULATOR MODE'}
          </button>

          <select
            value={skin}
            onChange={(e) => setSkin(e.target.value)}
            className="bg-[#232336] border border-[#454566] text-[11px] px-2 py-1 rounded text-gray-200 outline-none"
          >
            {Object.entries(SKINS).map(([k, val]) => (
              <option key={k} value={k}>
                Skin: {val.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setActiveModal('compose')}
            className="text-[11px] px-2.5 py-1 rounded bg-[#232336] border border-[#454566] hover:border-emerald-400 flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Export YAML
          </button>

          <button
            onClick={() => setActiveModal('bridge')}
            className="text-[11px] px-2.5 py-1 rounded bg-[#232336] border border-[#454566] hover:border-amber-400 flex items-center gap-1"
          >
            <Terminal className="w-3 h-3" /> Local Server
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-1.5 shadow-2xl">
        <div className={`${currentSkin.bg} border-2 ${currentSkin.border} rounded-sm shadow-lg overflow-hidden`}>
          <div
            onDoubleClick={() => setWindowshade(!windowshade)}
            className="bg-gradient-to-r from-[#141424] via-[#3a3a5e] to-[#141424] px-2.5 py-1 flex items-center justify-between border-b border-[#52527a] cursor-pointer"
            title="Double-click to toggle Winamp Windowshade Mini-Mode"
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${currentSkin.accentText}`} />
              <span className="text-[11px] font-bold tracking-widest text-white">
                SYSAMP {windowshade ? `// MINI-BAR [${selectedContainer.name} - ${cpuKhz}% CPU]` : 'SYSTEM MONITOR'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {windowshade && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={() => handleContainerAction('START')}
                    className="p-0.5 bg-black/50 hover:bg-emerald-800 rounded"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handleContainerAction('STOP')}
                    className="p-0.5 bg-black/50 hover:bg-red-800 rounded"
                  >
                    <Square className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setWindowshade(!windowshade)}
                className="text-gray-300 hover:text-white p-0.5"
                title="Toggle Windowshade Mode"
              >
                {windowshade ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!windowshade && (
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5 bg-[#08080c] border-2 border-[#3d3d5c] p-2 rounded-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold ${currentSkin.secondaryText}`}>
                      {selectedContainer.status}
                    </span>
                    <span className={`text-sm font-bold tracking-widest ${currentSkin.accentText}`}>
                      {selectedContainer.uptime}
                    </span>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={210}
                    height={56}
                    onClick={() =>
                      setVisMode((m) => (m === 'spectrum' ? 'oscilloscope' : 'spectrum'))
                    }
                    className="w-full h-14 cursor-pointer border border-[#1f1f2e]"
                    title="Click to toggle Spectrum Bars / Waveform Oscilloscope"
                  />

                  <div className="flex justify-between items-center mt-1 text-[9px] text-gray-400">
                    <span>MODE: {visMode.toUpperCase()}</span>
                    <span>CLICK GRAPH TO FLIP</span>
                  </div>
                </div>

                <div className="col-span-7 flex flex-col justify-between space-y-2">
                  <div className="bg-[#08080c] border-2 border-[#3d3d5c] px-2.5 py-1.5 overflow-hidden whitespace-nowrap">
                    <div className={`text-xs font-bold tracking-wider ${currentSkin.accentText} truncate`}>
                      {marqueeText}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#08080c] border border-[#3d3d5c] px-2 py-1 flex items-center justify-between">
                      <span className={`text-xs font-bold ${currentSkin.accentText}`}>{netKbps}</span>
                      <span className="text-[9px] text-gray-400">KBPS NET</span>
                    </div>
                    <div className="bg-[#08080c] border border-[#3d3d5c] px-2 py-1 flex items-center justify-between">
                      <span className={`text-xs font-bold ${currentSkin.accentText}`}>{cpuKhz}</span>
                      <span className="text-[9px] text-gray-400">% CPU</span>
                    </div>
                    <button
                      onClick={() => setSynthEnabled(!synthEnabled)}
                      className={`border px-2 py-1 text-[10px] font-bold flex items-center justify-center gap-1 ${
                        synthEnabled
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-[#14141f] border-[#3d3d5c] text-gray-400'
                      }`}
                    >
                      {synthEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      SYNTH
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowEq(!showEq)}
                        className={`px-2 py-1 text-[10px] font-bold border ${
                          showEq
                            ? 'bg-[#383857] border-white text-white'
                            : 'bg-[#14141f] border-[#3d3d5c] text-gray-400'
                        }`}
                      >
                        EQ
                      </button>
                      <button
                        onClick={() => setShowPlaylist(!showPlaylist)}
                        className={`px-2 py-1 text-[10px] font-bold border ${
                          showPlaylist
                            ? 'bg-[#383857] border-white text-white'
                            : 'bg-[#14141f] border-[#3d3d5c] text-gray-400'
                        }`}
                      >
                        PL
                      </button>
                    </div>

                    <button
                      onClick={whipTheLlamaAI}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-extrabold text-[11px] py-1 px-3 rounded-sm border border-amber-300 flex items-center justify-center gap-1.5 shadow"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      WHIP LLAMA AI (OLLAMA)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#3d3d5c]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleContainerAction('START')}
                    className="px-3 py-1.5 bg-[#32324d] hover:bg-emerald-700 border border-[#666699] text-xs font-bold flex items-center gap-1 rounded-sm"
                    title="docker start"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> PLAY (START)
                  </button>
                  <button
                    onClick={() => handleContainerAction('PAUSE')}
                    className="px-3 py-1.5 bg-[#32324d] hover:bg-amber-700 border border-[#666699] text-xs font-bold flex items-center gap-1 rounded-sm"
                    title="docker pause"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" /> PAUSE
                  </button>
                  <button
                    onClick={() => handleContainerAction('STOP')}
                    className="px-3 py-1.5 bg-[#32324d] hover:bg-red-700 border border-[#666699] text-xs font-bold flex items-center gap-1 rounded-sm"
                    title="docker stop"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> STOP
                  </button>
                </div>

                <div className="text-[11px] text-gray-300 flex items-center gap-2">
                  <span className="text-gray-400">ACTIVE TARGET:</span>
                  <span className={`font-bold ${currentSkin.accentText}`}>{selectedContainer.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {showEq && (
          <div className={`${currentSkin.bg} border-2 ${currentSkin.border} rounded-sm p-3 shadow-lg`}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3d3d5c]">
              <div className="flex items-center gap-1.5">
                <Sliders className={`w-3.5 h-3.5 ${currentSkin.accentText}`} />
                <span className="text-[11px] font-bold tracking-wider">
                  10-BAND RESOURCE TELEMETRY EQUALIZER
                </span>
              </div>

              <div className="flex items-center gap-1">
                {['NORMAL', 'SPIKE', 'LEAK', 'DDOS'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setStressPreset(preset);
                      playBeep(600, 0.05);
                    }}
                    className={`text-[10px] px-2 py-0.5 border font-bold ${
                      stressPreset === preset
                        ? 'bg-amber-500 text-black border-amber-200'
                        : 'bg-[#181824] text-gray-300 border-[#3d3d5c]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-10 gap-2 pt-1">
              {eqBands.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickY = e.clientY - rect.top;
                      const newPct = Math.max(5, Math.min(99, Math.round(100 - (clickY / rect.height) * 100)));
                      setEqBands((prev) => prev.map((v, i) => (i === idx ? newPct : v)));
                    }}
                    className="w-6 h-24 bg-[#08080c] border border-[#3d3d5c] relative cursor-ns-resize flex items-end p-0.5"
                    title="Click anywhere on track to adjust threshold"
                  >
                    <div
                      style={{ height: `${val}%` }}
                      className={`w-full transition-all duration-300 ${
                        val > 80
                          ? 'bg-red-500'
                          : val > 60
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-gray-300">{eqLabels[idx]}</span>
                  <span className={`text-[9px] ${currentSkin.accentText}`}>{val}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPlaylist && (
          <div className={`${currentSkin.bg} border-2 ${currentSkin.border} rounded-sm p-3 shadow-lg`}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3d3d5c]">
              <div className="flex items-center gap-1.5">
                <ListMusic className={`w-3.5 h-3.5 ${currentSkin.accentText}`} />
                <span className="text-[11px] font-bold tracking-wider">
                  CONTAINER & PROCESS PLAYLIST (.M3U / DOCKER)
                </span>
              </div>
              <span className="text-[10px] text-gray-400">
                DOUBLE-CLICK TRACK TO TOGGLE START/STOP
              </span>
            </div>

            <div className="bg-[#08080c] border-2 border-[#3d3d5c] divide-y divide-[#1a1a26] max-h-48 overflow-y-auto">
              {containers.map((item, index) => {
                const isSelected = item.id === selectedContainer.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setMarqueeText(
                        `>>> INSPECTING: ${item.name} (${item.image}) — STATUS: ${item.status} <<<`
                      );
                    }}
                    onDoubleClick={() =>
                      handleContainerAction(item.status === 'RUNNING' ? 'STOP' : 'START')
                    }
                    className={`px-2.5 py-1.5 flex items-center justify-between text-xs cursor-pointer transition ${
                      isSelected ? 'bg-[#1d2b3a] text-white' : 'hover:bg-[#141422] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-gray-500">{index + 1}.</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          item.status === 'RUNNING'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : item.status === 'PAUSED'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-red-950 text-red-400 border border-red-700'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className={`font-bold ${isSelected ? currentSkin.accentText : ''}`}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-500">({item.image})</span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] shrink-0">
                      <span className="text-gray-400">{item.port}</span>
                      <span className={currentSkin.secondaryText}>{item.mem} MB</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 bg-[#050508] border border-[#3d3d5c] p-2 rounded-sm">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span>LIVE STDOUT STREAM // {selectedContainer.name}</span>
                <span>UPTIME: {selectedContainer.uptime}</span>
              </div>
              <div className="space-y-0.5 text-[11px] font-mono text-gray-300 max-h-20 overflow-y-auto">
                {selectedContainer.logs.map((line, i) => (
                  <div key={i} className="truncate">
                    <span className="text-gray-600 mr-2">&gt;</span>
                    <span className={line.includes('ERROR') || line.includes('ERR!') ? 'text-red-400 font-bold' : ''}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#181826] border-2 border-[#52527a] w-full max-w-xl rounded shadow-2xl overflow-hidden">
            <div className="bg-[#282840] px-4 py-2 flex items-center justify-between border-b border-[#52527a]">
              <span className="text-xs font-bold tracking-wider text-amber-300">
                {activeModal === 'ai' && '⚡ WHIP THE LLAMA — OLLAMA AI CONTAINER DOCTOR'}
                {activeModal === 'compose' && '📦 EXPORT PLAYLIST AS DOCKER-COMPOSE.YML'}
                {activeModal === 'bridge' && '🔌 LOCAL PC & DOCKER BRIDGE (SERVER.JS)'}
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs px-2 py-0.5 bg-red-900/60 hover:bg-red-700 text-white rounded"
              >
                ESC / CLOSE
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {activeModal === 'ai' && (
                <>
                  <div className="flex items-center justify-between gap-2 bg-[#10101a] p-2 border border-[#32324d]">
                    <span className="text-gray-400">Local Ollama Model:</span>
                    <input
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="bg-[#1d1d2e] border border-[#454566] px-2 py-1 text-xs text-emerald-300 rounded"
                    />
                    <button
                      onClick={whipTheLlamaAI}
                      className="px-2.5 py-1 bg-amber-500 text-black font-bold rounded flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-Analyze
                    </button>
                  </div>
                  <div className="bg-[#08080c] border border-[#3d3d5c] p-3 text-emerald-300 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                    {aiLoading ? 'Consulting local Ollama model on port 11434...' : aiDiagnosis}
                  </div>
                </>
              )}

              {activeModal === 'compose' && (
                <>
                  <p className="text-gray-300">
                    Your active Winamp container playlist converted into a clean, production-ready{' '}
                    <code className="text-amber-300">docker-compose.yml</code> file:
                  </p>
                  <pre className="bg-[#08080c] border border-[#3d3d5c] p-3 text-emerald-300 overflow-x-auto max-h-64">
                    {generateComposeYaml()}
                  </pre>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => copyToClipboard(generateComposeYaml())}
                      className="px-3 py-1.5 bg-[#282840] hover:bg-[#383857] border border-[#52527a] rounded flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy YAML'}
                    </button>
                    <button
                      onClick={downloadComposeFile}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download .yml
                    </button>
                  </div>
                </>
              )}

              {activeModal === 'bridge' && (
                <>
                  <p className="text-gray-300">
                    When you run the backend on <code className="text-emerald-400">http://localhost:4091</code>, click{' '}
                    <strong>LIVE BRIDGE: ON</strong> in the top bar to stream your real CPU cores, RAM, and Docker containers.
                  </p>
                  <div className="bg-[#08080c] border border-[#3d3d5c] p-3 text-amber-300 space-y-1">
                    <div># 1. Allow browser requests to local Ollama (for Whip the Llama AI):</div>
                    <div className="text-emerald-400">set OLLAMA_ORIGINS=* &amp;&amp; ollama serve</div>
                    <div className="pt-2"># 2. Start the Node.js hardware &amp; Docker telemetry bridge:</div>
                    <div className="text-emerald-400">node server.js</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
