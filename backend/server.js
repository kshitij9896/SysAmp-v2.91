const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const Docker = require('dockerode');

const app = express();
const PORT = 4091;
const docker = new Docker();

app.use(cors({ origin: '*' }));
app.use(express.json());

async function getPlaylistTracks() {
  try {
    const containersRaw = await docker.listContainers({ all: true });

    if (containersRaw && containersRaw.length > 0) {
      return await Promise.all(
        containersRaw.map(async (c) => {
          const shortId = c.Id.substring(0, 12);
          const name = (c.Names && c.Names[0] ? c.Names[0] : shortId).replace(/^\//, '');
          const stateUpper = (c.State || '').toUpperCase();
          const status =
            stateUpper === 'RUNNING'
              ? 'RUNNING'
              : stateUpper === 'PAUSED'
              ? 'PAUSED'
              : 'EXITED';

          const portMapping =
            c.Ports && c.Ports.length > 0
              ? c.Ports.map((p) => `${p.PublicPort || p.PrivatePort}:${p.PrivatePort}`)[0]
              : 'internal';

          let logLines = [`Container ${name} (${c.Status})`];
          try {
            const containerObj = docker.getContainer(c.Id);
            const logBuffer = await containerObj.logs({
              stdout: true,
              stderr: true,
              tail: 3
            });
            const cleaned = logBuffer
              .toString('utf8')
              .replace(/[\x00-\x09\x0B-\x1F]/g, '')
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean);
            if (cleaned.length > 0) logLines = cleaned;
          } catch {}

          return {
            id: shortId,
            name,
            image: c.Image,
            port: portMapping,
            status,
            cpu: status === 'RUNNING' ? Math.max(1, Math.round(Math.random() * 15)) : 0,
            mem: status === 'RUNNING' ? 64 : 0,
            uptime: c.Status || '00:00:00',
            logs: logLines
          };
        })
      );
    }
  } catch {}

  try {
    const procData = await si.processes();
    const list = (procData && procData.list) ? procData.list : [];
    const topProcs = list
      .sort((a, b) => (b.memRss || 0) - (a.memRss || 0))
      .slice(0, 6);

    return topProcs.map((p) => ({
      id: `pid-${p.pid}`,
      name: p.name || 'system-proc',
      image: `OS-PID:${p.pid}`,
      port: 'LOCAL-PC',
      status: 'RUNNING',
      cpu: Math.round(p.cpu || 1),
      mem: Math.max(1, Math.round((p.memRss || 1024) / 1024)),
      uptime: 'LIVE-PROC',
      logs: [
        `Process: ${p.name} (PID ${p.pid})`,
        `CPU Load: ${(p.cpu || 0).toFixed(1)}% | Memory RSS: ${Math.round((p.memRss || 0) / 1024)} MB`,
        `Note: Start Docker Desktop to switch from OS Processes to Docker Containers`
      ]
    }));
  } catch {
    return [];
  }
}

app.get('/api/telemetry', async (req, res) => {
  try {
    const [cpu, mem, net, fsStats, containers] = await Promise.all([
      si.currentLoad().catch(() => null),
      si.mem().catch(() => null),
      si.networkStats().catch(() => []),
      si.fsStats().catch(() => null),
      getPlaylistTracks()
    ]);

    const cpuPercent = Math.min(99, Math.max(1, Math.round(cpu?.currentLoad || 12)));

    const activeNet = Array.isArray(net) && net.length > 0 && net[0] ? net[0] : null;
    const rxKbps = Math.max(0, Math.round((activeNet?.rx_sec || 0) / 1024));
    const txKbps = Math.max(0, Math.round((activeNet?.tx_sec || 0) / 1024));
    const netKbps = Math.max(8, rxKbps + txKbps);

    const totalMem = mem?.total || 1;
    const activeMem = mem?.active || mem?.used || 0;
    const ramPct = Math.min(99, Math.max(5, Math.round((activeMem / totalMem) * 100)));
    const swapPct =
      mem?.swaptotal > 0
        ? Math.min(99, Math.max(5, Math.round(((mem?.swapused || 0) / mem.swaptotal) * 100)))
        : Math.max(5, Math.round(ramPct * 0.4));

    const coreLoads = (cpu?.cpus || []).map((c) => Math.min(99, Math.max(5, Math.round(c?.load || 0))));

    const rawDiskBytes = (fsStats?.rx_sec || 0) + (fsStats?.wx_sec || 0);
    const diskPct =
      rawDiskBytes > 0
        ? Math.min(99, Math.max(5, Math.round(rawDiskBytes / (1024 * 50))))
        : Math.min(99, Math.max(8, Math.round(cpuPercent * 0.65)));

    const eqBands = [
      coreLoads[0] || cpuPercent,
      coreLoads[1] || cpuPercent,
      coreLoads[2] || cpuPercent,
      coreLoads[3] || cpuPercent,
      ramPct,
      swapPct,
      diskPct,
      Math.min(99, Math.max(5, Math.round(rxKbps / 5) || 12)),
      Math.min(99, Math.max(5, Math.round(txKbps / 5) || 10)),
      cpuPercent
    ];

    res.json({
      cpuPercent,
      netKbps,
      eqBands,
      containers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/container/:id/:action', async (req, res) => {
  const { id, action } = req.params;

  if (id.startsWith('pid-')) {
    return res.json({
      success: true,
      note: 'OS process row selected. Start Docker Desktop to control containers.'
    });
  }

  try {
    const container = docker.getContainer(id);
    const info = await container.inspect();

    if (action === 'start') {
      if (info.State.Paused) {
        await container.unpause();
      } else if (!info.State.Running) {
        await container.start();
      }
    } else if (action === 'pause') {
      if (info.State.Running && !info.State.Paused) {
        await container.pause();
      }
    } else if (action === 'stop') {
      if (info.State.Running || info.State.Paused) {
        await container.stop();
      }
    }

    res.json({ success: true, id, action });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ SysAmp Telemetry Bridge Online: http://localhost:${PORT}`);
  console.log(`   - Telemetry URL : http://localhost:${PORT}/api/telemetry`);
  console.log(`====================================================`);
});
