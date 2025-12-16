import React, { useState, useEffect } from 'react';
import { Table as TableIcon, Plus, MoreVertical, Lock, Search, Key, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export const TableEditor = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'definition'>('data');

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableDetails(selectedTable.schema, selectedTable.name);
    }
  }, [selectedTable, activeTab]);

  const fetchTables = async () => {
    const data = await api.get('/tables');
    if (data) {
      setTables(data);
      if (data.length > 0 && !selectedTable) setSelectedTable(data[0]);
    }
  };

  const fetchTableDetails = async (schema: string, tableName: string) => {
    setLoading(true);
    const cols = await api.get(`/tables/${schema}/${tableName}/columns`);
    setColumns(cols || []);

    if (activeTab === 'data') {
      const data = await api.get(`/tables/${schema}/${tableName}/data`);
      setRows(data || []);
    }
    setLoading(false);
  };

  if (!tables.length && !loading) return <div className="p-8 text-slate-400">No tables found or backend unreachable.</div>;

  return (
    <div className="flex h-screen pt-0 bg-slate-950">
      {/* Sidebar List */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-300">Tables</h3>
          <button className="text-slate-400 hover:text-white">
            <Plus size={16} />
          </button>
        </div>
        <div className="p-2">
          <div className="space-y-0.5 mt-2">
            {tables.map(table => (
              <button
                key={`${table.schema}.${table.name}`}
                onClick={() => setSelectedTable(table)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedTable?.name === table.name 
                    ? 'bg-blue-900/20 text-blue-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <TableIcon size={14} />
                  <span>{table.name}</span>
                </div>
                {table.rlsEnabled && <Lock size={10} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedTable && (
          <>
            {/* Table Header */}
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-slate-500 font-normal">{selectedTable.schema} /</span>
                  {selectedTable.name}
                </h2>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${selectedTable.rlsEnabled ? 'bg-emerald-950 border-emerald-900 text-emerald-400' : 'bg-amber-950 border-amber-900 text-amber-400'}`}>
                  {selectedTable.rlsEnabled ? 'RLS ON' : 'RLS OFF'}
                </div>
              </div>
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button 
                  onClick={() => setActiveTab('data')}
                  className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'data' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Data
                </button>
                <button 
                  onClick={() => setActiveTab('definition')}
                  className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'definition' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Structure
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-950 relative">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                  <Loader2 className="animate-spin" size={20}/> Loading...
                </div>
              ) : activeTab === 'data' ? (
                <div className="min-w-full inline-block align-middle">
                  <div className="bg-slate-900/30">
                    <div className="flex border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                      {columns.map((col, idx) => (
                        <div key={idx} className="flex-1 min-w-[150px] p-3 text-xs font-medium text-slate-400 border-r border-slate-800 flex items-center gap-2">
                          {col.name}
                          <span className="text-slate-600 ml-auto">{col.type}</span>
                        </div>
                      ))}
                    </div>
                    
                    {rows.map((row, rIdx) => (
                      <div key={rIdx} className="flex border-b border-slate-800/50 hover:bg-slate-900/50">
                        {columns.map((col, cIdx) => (
                          <div key={cIdx} className="flex-1 min-w-[150px] p-3 text-sm text-slate-300 border-r border-slate-800 truncate font-mono">
                             {row[col.name] === null ? <span className="text-slate-600">NULL</span> : String(row[col.name])}
                          </div>
                        ))}
                      </div>
                    ))}
                    
                    {rows.length === 0 && (
                      <div className="p-8 text-center text-slate-600 text-sm">
                        No rows found in this table.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 max-w-4xl">
                  <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800/50 text-slate-400 font-medium">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Default Value</th>
                          <th className="px-4 py-3">Nullable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {columns.map((col) => (
                          <tr key={col.name} className="hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-mono text-slate-200">{col.name}</td>
                            <td className="px-4 py-3 text-blue-400">{col.type}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{col.defaultValue || 'NULL'}</td>
                            <td className="px-4 py-3 text-slate-400">{col.isNullable ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};