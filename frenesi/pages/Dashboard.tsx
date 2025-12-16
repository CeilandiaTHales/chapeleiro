import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, HardDrive } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api';

const demoData = [
  { name: '00:00', requests: 400 },
  { name: '04:00', requests: 300 },
  { name: '08:00', requests: 2000 },
  { name: '12:00', requests: 2780 },
  { name: '16:00', requests: 1890 },
  { name: '20:00', requests: 2390 },
  { name: '23:59', requests: 3490 },
];

export const Dashboard = () => {
  const [health, setHealth] = useState<string>('Checking...');
  const [dbTime, setDbTime] = useState<string>('-');

  useEffect(() => {
    // Check system health via API proxy
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data.status);
        setDbTime(data.time);
      })
      .catch(() => setHealth('Unreachable (Is Docker running?)'));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Project Overview</h2>
          <p className="text-slate-400">Status: <span className={`font-medium ${health === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>{health}</span> • DB Time: {dbTime}</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Database Size', value: '1.2 GB', icon: Database, color: 'text-blue-400' },
          { label: 'Active Connections', value: '4 / 100', icon: Activity, color: 'text-emerald-400' },
          { label: 'API Requests (24h)', value: '14.5k', icon: Server, color: 'text-purple-400' },
          { label: 'Storage Used', value: '12%', icon: HardDrive, color: 'text-amber-400' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 bg-slate-950 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs text-slate-500 font-mono">LIVE</span>
            </div>
            <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">API Throughput</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demoData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-6">API Access</h3>
          <div className="text-slate-400 text-sm mb-4">
            Directly access your database via the REST API automatically generated from your schema.
          </div>
          <div className="bg-slate-950 p-4 rounded-md border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto">
            GET https://your-vps-ip/api/tables/public/users/data
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Service Status</h4>
             <div className="flex items-center gap-2 text-sm text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                PostgreSQL Operational
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};