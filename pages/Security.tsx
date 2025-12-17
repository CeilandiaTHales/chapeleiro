import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle, Terminal, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export const Security = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPolicies = async () => {
      const data = await api.get('/policies');
      if (data) setPolicies(data);
      setLoading(false);
    };
    loadPolicies();
  }, []);

  // Group policies by table
  const policiesByTable = policies.reduce((acc: any, policy) => {
    if (!acc[policy.table_name]) acc[policy.table_name] = [];
    acc[policy.table_name].push(policy);
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading Security Policies...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Authentication & RLS</h2>
        <p className="text-slate-400">Manage Row Level Security policies (Fetched directly from pg_policy).</p>
      </div>

      <div className="space-y-6">
        {Object.keys(policiesByTable).length === 0 && (
          <div className="text-slate-500">No RLS policies found in the public schema.</div>
        )}

        {Object.entries(policiesByTable).map(([tableName, tablePolicies]: [string, any]) => (
          <div key={tableName} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-800 rounded text-slate-300">
                     <Shield size={18} />
                   </div>
                   <div>
                     <h3 className="text-base font-semibold text-white">{tableName}</h3>
                     <p className="text-xs text-slate-500 font-mono">public.{tableName}</p>
                   </div>
                </div>
             </div>
             
             <div className="divide-y divide-slate-800 bg-slate-950/50">
               {tablePolicies.map((policy: any, idx: number) => (
                 <div key={idx} className="p-4 flex items-center justify-between group hover:bg-slate-900 transition-colors">
                   <div className="flex-1">
                     <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          policy.command === 'SELECT' ? 'border-blue-900 text-blue-400 bg-blue-950' : 
                          policy.command === 'INSERT' ? 'border-emerald-900 text-emerald-400 bg-emerald-950' :
                          'border-amber-900 text-amber-400 bg-amber-950'
                        }`}>
                          {policy.command}
                        </span>
                        <span className="text-sm font-medium text-slate-200">{policy.name}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>USING ({policy.using})</span>
                        {policy.check && <span>CHECK ({policy.check})</span>}
                     </div>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800">
                        <Terminal size={14} />
                      </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};