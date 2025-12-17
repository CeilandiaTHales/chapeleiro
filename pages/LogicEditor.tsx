import React, { useState, useEffect } from 'react';
import { Play, Save, Zap, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export const LogicEditor = () => {
  const [functions, setFunctions] = useState<any[]>([]);
  const [selectedFn, setSelectedFn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    const data = await api.get('/functions');
    if (data) {
      setFunctions(data);
      if (data.length > 0) {
        setSelectedFn(data[0]);
        setCode(data[0].definition);
      }
    }
    setLoading(false);
  };

  const handleSelect = (fn: any) => {
    setSelectedFn(fn);
    setCode(fn.definition);
  };

  const handleDeploy = async () => {
    // Basic wrapper to update function. In production, this needs smarter parsing.
    const query = `CREATE OR REPLACE FUNCTION public.${selectedFn.name}(${selectedFn.args}) 
    RETURNS ${selectedFn.returnType} 
    LANGUAGE ${selectedFn.language} 
    AS $$
    ${code}
    $$;`;
    
    try {
      await api.post('/sql', { query });
      alert('Function deployed successfully');
      fetchFunctions();
    } catch (e: any) {
      alert('Error deploying: ' + e.message);
    }
  };

  if (loading) return <div className="p-8 text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading functions...</div>;

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Functions List */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Database Functions</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {functions.map(fn => (
             <div 
               key={fn.name} 
               onClick={() => handleSelect(fn)}
               className={`px-4 py-3 border-b border-slate-800/50 cursor-pointer group ${selectedFn?.name === fn.name ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
             >
               <div className="flex items-center gap-2 mb-1">
                 <Zap size={14} className="text-amber-400" />
                 <span className="text-sm font-medium text-slate-200">{fn.name}</span>
               </div>
               <div className="text-xs text-slate-500 font-mono truncate">
                 returns {fn.returnType}
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col">
        {selectedFn && (
          <>
            <div className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">public.</span>
                <span className="text-sm font-bold text-white">{selectedFn.name}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleDeploy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-xs font-medium shadow-lg shadow-emerald-900/20"
                >
                  <Save size={14} /> Deploy
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-950 p-6 font-mono text-sm overflow-auto">
              <textarea 
                className="w-full h-full bg-slate-950 text-slate-300 focus:outline-none resize-none leading-relaxed"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
              />
            </div>
          </>
        )}
        {!selectedFn && <div className="p-8 text-slate-500">No functions found. Create one in your DB.</div>}
      </div>
    </div>
  );
};