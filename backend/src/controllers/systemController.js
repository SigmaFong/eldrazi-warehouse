import os from "os";
import process from "process";
import { catchAsync, sendSuccess } from "../utils/apiHelpers.js";

// ── GET /api/system/info — real-time server info (Module 3.2) ─────────────
export const getSystemInfo = catchAsync(async (req, res) => {
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  const usedMem  = totalMem - freeMem;

  const uptimeSeconds = process.uptime();
  const h = Math.floor(uptimeSeconds / 3600);
  const m = Math.floor((uptimeSeconds % 3600) / 60);
  const s = Math.floor(uptimeSeconds % 60);

  const info = {
    server: {
      platform:    os.platform(),
      arch:        os.arch(),
      nodeVersion: process.version,
      uptime:      `${h}h ${m}m ${s}s`,
      uptimeSeconds,
      pid:         process.pid,
    },
    cpu: {
      model:   os.cpus()[0]?.model ?? "Unknown",
      cores:   os.cpus().length,
      loadAvg: os.loadavg().map(l => +l.toFixed(2)),
    },
    memory: {
      total:   `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used:    `${(usedMem  / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free:    `${(freeMem  / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usedPct: +((usedMem / totalMem) * 100).toFixed(1),
    },
    process: {
      heapUsed:  `${(process.memoryUsage().heapUsed  / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss:       `${(process.memoryUsage().rss       / 1024 / 1024).toFixed(2)} MB`,
    },
    timestamp: new Date().toISOString(),
  };

  sendSuccess(res, 200, { system: info });
});

// ── GET /api/system/health — lightweight ping ─────────────────────────────
export const healthCheck = (req, res) => {
  res.status(200).json({
    status:    "success",
    message:   "Eldrazi Warehouse API is operational",
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
  });
};
