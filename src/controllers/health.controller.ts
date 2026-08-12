import { Request, Response } from 'express';
import si from 'systeminformation';
import prisma from '../config/prisma';

export class HealthController {
  public async getHealthMetrics(req: Request, res: Response): Promise<void> {
    try {
      // 1. Hardware Metrics (Systeminformation)
      const [cpu, mem, fsSize, networkStats, processes, time] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.processes(),
        si.time()
      ]);

      const cpuLoad = await si.currentLoad();

      // Database
      const dbStartTime = Date.now();
      let dbStatus = 'healthy';
      let dbLatency = 0;
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbLatency = Date.now() - dbStartTime;
        if (dbLatency > 500) dbStatus = 'degraded';
      } catch (err) {
        dbStatus = 'critical';
      }

      // Top Processes (sort by cpu)
      const topProcesses = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 5)
        .map((p) => ({
          pid: p.pid,
          name: p.name,
          cpu: p.cpu.toFixed(1),
          mem: p.mem.toFixed(1),
          status: 'running'
        }));

      const netStat = networkStats[0] || {
        rx_bytes: 0,
        tx_bytes: 0,
        rx_dropped: 0,
        tx_dropped: 0,
        operstate: 'up'
      };
      const fsPrimary = fsSize[0] || { use: 0, size: 0, used: 0, mount: 'C:' };

      res.json({
        status: 'success',
        metrics: {
          cpu: {
            usage: cpuLoad.currentLoad,
            cores: cpu.cores,
            speed: cpu.speed,
            loadAvg: [cpuLoad.avgLoad || 0, 0, 0]
          },
          memory: {
            total: mem.total,
            used: mem.used,
            free: mem.free,
            swap: mem.swapused,
            cache: mem.buffcache,
            usagePercentage: ((mem.used / mem.total) * 100).toFixed(1)
          },
          disk: {
            mount: fsPrimary.mount,
            total: fsPrimary.size,
            used: fsPrimary.used,
            usagePercentage: fsPrimary.use.toFixed(1),
            health: fsPrimary.use > 90 ? 'critical' : fsPrimary.use > 75 ? 'warning' : 'healthy'
          },
          network: {
            rx: netStat.rx_bytes,
            tx: netStat.tx_bytes,
            dropped: netStat.rx_dropped + netStat.tx_dropped,
            status:
              netStat.operstate === 'up' || netStat.operstate === 'unknown' ? 'healthy' : 'degraded'
          },
          uptime: {
            system: time.uptime,
            bootTime: new Date(Date.now() - time.uptime * 1000).toISOString()
          },
          database: { status: dbStatus, latency: dbLatency }
        },
        processes: topProcesses,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Failed to retrieve health metrics' });
    }
  }

  public async manageProcess(req: Request, res: Response): Promise<void> {
    try {
      const pid = parseInt(req.params.pid as string);
      const action = req.params.action as string;

      if (isNaN(pid)) {
        res.status(400).json({ status: 'error', message: 'Invalid PID' });
        return;
      }

      if (action === 'kill') {
        try {
          process.kill(pid);
          res.json({ status: 'success', message: `Process ${pid} killed successfully.` });
        } catch (err: any) {
          res
            .status(500)
            .json({ status: 'error', message: `Failed to kill process ${pid}: ${err.message}` });
        }
      } else if (action === 'restart') {
        res.status(501).json({
          status: 'error',
          message:
            'Restarting arbitrary OS processes is not supported natively. Try killing it instead.'
        });
      } else {
        res.status(400).json({ status: 'error', message: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to manage process' });
    }
  }
}
