'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Server, Database, Download, Pin, AlertTriangle, Clock, HardDrive, Network, Cpu, RefreshCw, XCircle } from 'lucide-react';
import api from '../../../lib/api';

export default function SystemHealthPage() {
  const [refreshInterval, setRefreshInterval] = useState<number | false>(false);
  const [pinnedWidgets, setPinnedWidgets] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const manageProcess = useMutation({
    mutationFn: async ({ pid, action }: { pid: number, action: 'kill' | 'restart' }) => {
      return (await api.post(`/health/process/${pid}/${action}`)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-health-advanced'] });
      alert(data.message || 'Action executed successfully');
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : 'Failed to execute action');
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('smartlib-pinned-health-widgets');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPinnedWidgets(JSON.parse(saved));
    }
  }, []);

  const togglePin = (widgetId: string) => {
    const updated = pinnedWidgets.includes(widgetId)
      ? pinnedWidgets.filter((id) => id !== widgetId)
      : [...pinnedWidgets, widgetId];
    setPinnedWidgets(updated);
    localStorage.setItem('smartlib-pinned-health-widgets', JSON.stringify(updated));
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['system-health-advanced'],
    queryFn: async () => {
      const res = await api.get('/health');
      return res.data;
    },
    refetchInterval: refreshInterval,
  });

  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-health-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!data || !data.metrics) return;
    const rows = [
      ['Metric', 'Value', 'Status'],
      ['CPU Usage', `${data.metrics.cpu.usage.toFixed(1)}%`, data.metrics.cpu.usage > 80 ? 'Critical' : 'Healthy'],
      ['Memory Usage', `${data.metrics.memory.usagePercentage}%`, Number(data.metrics.memory.usagePercentage) > 85 ? 'Warning' : 'Healthy'],
      ['Disk Usage', `${data.metrics.disk.usagePercentage}%`, data.metrics.disk.health],
      ['Network Status', `RX: ${data.metrics.network.rx} / TX: ${data.metrics.network.tx}`, data.metrics.network.status],
      ['Database', 'N/A', data.metrics.database.status]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.setAttribute("href", encodedUri);
    a.setAttribute("download", `system-health-${new Date().toISOString()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getColorClass = (type: 'cpu' | 'memory' | 'db' | 'disk' | 'network' | 'uptime', val: number | string | null | undefined) => {
    const numericVal = typeof val === 'number' ? val : Number(val ?? 0);
  switch (type) {
      case 'cpu': return numericVal > 85 ? 'text-red-600 bg-red-50' : numericVal > 70 ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';
      case 'memory': return numericVal > 90 ? 'text-red-600 bg-red-50' : numericVal > 80 ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';
      case 'db': return val === 'degraded' ? 'text-amber-600 bg-amber-50' : val === 'critical' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
      case 'disk': return val === 'critical' ? 'text-red-600 bg-red-50' : val === 'warning' ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';
      case 'network': return val === 'degraded' ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';
      case 'uptime': return 'text-indigo-600 bg-indigo-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">
        <h2 className="text-lg font-bold flex items-center gap-2"><AlertTriangle /> System Health Unreachable</h2>
        <p className="mt-2 text-sm">{error instanceof Error ? error.message : 'Unknown error occurred.'}</p>
      </div>
    );
  }

  const { metrics, processes } = data;

  const renderWidget = (id: string, title: string, icon: React.ReactNode, value: React.ReactNode, colorClass: string, tooltip: string) => {
    const isPinned = pinnedWidgets.includes(id);
    return (
      <div key={id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group ${colorClass.split(' ')[1].replace('bg-', 'border-')}`}>
        <button 
          onClick={() => togglePin(id)} 
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-opacity ${isPinned ? 'text-indigo-600 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100'}`}
          title={isPinned ? "Unpin widget" : "Pin widget"}
        >
          <Pin size={16} className={isPinned ? 'fill-current' : ''} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <h3 className="font-semibold text-gray-700">{title}</h3>
        </div>
        <div className="text-3xl font-bold text-gray-900 group-hover:cursor-help" title={tooltip}>
          {value}
        </div>
      </div>
    );
  };

  const allWidgets = [
    { id: 'cpu', render: () => renderWidget('cpu', 'CPU Load', <Server size={20} />, `${metrics.cpu.usage.toFixed(1)}%`, getColorClass('cpu', metrics.cpu.usage), `${metrics.cpu.cores} Cores @ ${metrics.cpu.speed}GHz`) },
    { id: 'memory', render: () => renderWidget('memory', 'Memory Usage', <Activity size={20} />, `${metrics.memory.usagePercentage}%`, getColorClass('memory', Number(metrics.memory.usagePercentage)), `${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)}`) },
    { id: 'disk', render: () => renderWidget('disk', `Disk (${metrics.disk.mount})`, <HardDrive size={20} />, `${metrics.disk.usagePercentage}%`, getColorClass('disk', metrics.disk.health), `${formatBytes(metrics.disk.used)} / ${formatBytes(metrics.disk.total)}`) },
    { id: 'network', render: () => renderWidget('network', 'Network I/O', <Network size={20} />, metrics.network.status.toUpperCase(), getColorClass('network', metrics.network.status), `RX: ${formatBytes(metrics.network.rx)} | TX: ${formatBytes(metrics.network.tx)}`) },
    { id: 'uptime', render: () => renderWidget('uptime', 'System Uptime', <Clock size={20} />, `${(metrics.uptime.system / 3600).toFixed(1)}h`, getColorClass('uptime', null), `Booted at: ${new Date(metrics.uptime.bootTime).toLocaleString()}`) },
    { id: 'db', render: () => renderWidget('db', 'Database', <Database size={20} />, metrics.database.status.toUpperCase(), getColorClass('db', metrics.database.status), `${metrics.database.latency}ms ping`) }
  ];

  const pinned = allWidgets.filter(w => pinnedWidgets.includes(w.id));
  const unpinned = allWidgets.filter(w => !pinnedWidgets.includes(w.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-indigo-600" /> System Health
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time infrastructure monitoring and process lists.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Clock size={16} className="text-gray-500" />
            <select 
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
              value={refreshInterval === false ? 'off' : refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value === 'off' ? false : Number(e.target.value))}
            >
              <option value="off">Auto-Refresh: Off</option>
              <option value="5000">5 Seconds</option>
              <option value="30000">30 Seconds</option>
              <option value="60000">1 Minute</option>
            </select>
          </div>
          
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> CSV
          </button>
          <button onClick={exportJSON} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> JSON
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {pinned.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Pin size={14} /> Pinned Views</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pinned.map(w => w.render())}
            </div>
          </div>
        )}
        
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">All Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unpinned.map(w => w.render())}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Process List */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-indigo-600" /> Top Processes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2">PID</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">CPU%</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((p: { name: string; pid: number; cpu: number }) => (
                    <tr key={p.pid} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-sm text-gray-500 font-mono">{p.pid}</td>
                      <td className="py-2 text-sm font-medium text-gray-900 truncate max-w-sm" title={p.name}>{p.name}</td>
                      <td className="py-2 text-sm text-gray-700">{p.cpu}</td>
                      <td className="py-2 text-right">
                        <button 
                          onClick={() => { if(confirm(`Restart process ${p.pid}?`)) manageProcess.mutate({ pid: p.pid, action: 'restart' }); }}
                          className="text-gray-400 hover:text-indigo-600 transition-colors p-1" 
                          title="Restart"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button 
                          onClick={() => { if(confirm(`Kill process ${p.pid}?`)) manageProcess.mutate({ pid: p.pid, action: 'kill' }); }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1" 
                          title="Kill"
                        >
                          <XCircle size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
