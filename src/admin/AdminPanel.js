import React, { useState } from 'react';
import PrintRequests from './PrintRequests';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import { Printer, Users, Settings, LayoutDashboard } from 'lucide-react';

const AdminPanel = () => {
  const [section, setSection] = useState('dashboard');

  const renderSection = () => {
    switch (section) {
      case 'printRequests': return <PrintRequests />;
      case 'dashboard': return <Dashboard />;
      case 'users': return <AdminUsers />;
      case 'settings': return <AdminSettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-100 to-purple-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl ">
        <div className="text-3xl font-bold p-6">Admin Panel</div>
        <nav className="flex flex-col gap-4 p-4 text-lg font-medium">
          <button onClick={() => setSection('dashboard')} className={`flex items-center gap-2 p-3 rounded-xl hover:bg-white/10 ${section === 'dashboard' && 'bg-white/10'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setSection('printRequests')} className={`flex items-center gap-2 p-3 rounded-xl hover:bg-white/10 ${section === 'printRequests' && 'bg-white/10'}`}>
            <Printer className="w-5 h-5" /> Print Requests
          </button>
          <button onClick={() => setSection('users')} className={`flex items-center gap-2 p-3 rounded-xl hover:bg-white/10 ${section === 'users' && 'bg-white/10'}`}>
            <Users className="w-5 h-5" /> Users
          </button>
          <button onClick={() => setSection('settings')} className={`flex items-center gap-2 p-3 rounded-xl hover:bg-white/10 ${section === 'settings' && 'bg-white/10'}`}>
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {renderSection()}
      </main>
    </div>
  );
};

const Dashboard = () => (
  <div className="text-center space-y-4">
    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Dashboard</h1>
    <p className="text-gray-600">Overview of the system activity and statistics.</p>
  </div>
);

const User = () => (
  <div className="text-center space-y-4">
    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Users</h1>
    <p className="text-gray-600">User management will be available here.</p>
  </div>
);

const Setting = () => (
  <div className="text-center space-y-4">
    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Settings</h1>
    <p className="text-gray-600">Configure platform options here.</p>
  </div>
);

export default AdminPanel;
