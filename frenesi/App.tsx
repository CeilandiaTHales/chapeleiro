import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { TableEditor } from './pages/TableEditor';
import { LogicEditor } from './pages/LogicEditor';
import { Security } from './pages/Security';
import { Users } from './pages/Users';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'editor': return <TableEditor />;
      case 'logic': return <LogicEditor />;
      case 'security': return <Security />;
      case 'users': return <Users />;
      default: return <Dashboard />;
    }
  };

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
        <main className="flex-1 ml-64 overflow-y-auto h-screen bg-slate-950 relative">
          {renderContent()}
        </main>
      </div>
    </HashRouter>
  );
};

export default App;