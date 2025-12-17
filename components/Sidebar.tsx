import React from 'react';
import { LayoutDashboard, Database, Shield, Users, Code, Settings, Terminal, Activity } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
        currentView === view
          ? 'bg-slate-800 text-blue-400 border-blue-500'
          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-transparent'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          Fe
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">IronDB</h1>
          <p className="text-xs text-slate-500">Studio Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Project</div>
        <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Editor</div>
        <NavItem view="editor" icon={Database} label="Table Editor" />
        <NavItem view="logic" icon={Code} label="Logic & Triggers" />
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Configuration</div>
        <NavItem view="security" icon={Shield} label="Authentication & RLS" />
        <NavItem view="users" icon={Users} label="Auth Users" />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 cursor-pointer rounded-md hover:bg-slate-900">
          <Terminal size={16} />
          <span className="text-sm">SQL Editor</span>
        </div>
         <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 cursor-pointer rounded-md hover:bg-slate-900">
          <Settings size={16} />
          <span className="text-sm">Project Settings</span>
        </div>
      </div>
    </aside>
  );
};