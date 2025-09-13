import React, { useState, useEffect } from 'react';
import PrintRequests from './PrintRequests';
import BookingSlots from './BookingSlots';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import { Printer, Users, Settings, LayoutDashboard, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonLoader';

const AdminPanel = () => {
  const [section, setSection] = useState('dashboard');

  const renderSection = () => {
    switch (section) {
      case 'printRequests': return <PrintRequests />;
      case 'dashboard': return <Dashboard />;
      case 'users': return <AdminUsers />;
      case 'settings': return <AdminSettings />;
      case 'slotBookings': return <BookingSlots />;
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
          <button onClick={() => setSection('slotBookings')} className={`flex items-center gap-2 p-3 rounded-xl hover:bg-white/10 ${section === 'slotBookings' && 'bg-white/10'}`}>
            <Printer className="w-5 h-5" /> Slot Bookings
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

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, requestsRes] = await Promise.all([
          fetch('https://print-ease-backend-gold.vercel.app/api/admin/users'),
          fetch('https://print-ease-backend-gold.vercel.app/api/admin/print-requests')
        ]);
        
        const usersData = await usersRes.json();
        const requestsData = await requestsRes.json();
        
        // Calculate stats from actual data
        const totalRequests = requestsData.length;
        const completedRequests = requestsData.filter(req => req.status === 'completed').length;
        const processingRequests = requestsData.filter(req => req.status === 'processing').length;
        const totalUsers = usersData.length;
        
        setStats({
          totalRequests,
          completedRequests,
          processingRequests,
          totalUsers
        });
        
        // Sort by created_at and get recent 5
        const sortedRequests = requestsData
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentRequests(sortedRequests);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Dashboard</h1>
        <p className="text-gray-600">Overview of system activity and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-6 border border-blue-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-blue-800">{stats.totalRequests || 0}</p>
            </div>
            <Printer className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 border border-green-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-800">{stats.completedRequests || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-6 border border-yellow-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Processing</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.processingRequests || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 border border-purple-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-purple-800">{stats.totalUsers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          Recent Print Requests
        </h3>
        
        {recentRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent requests</p>
        ) : (
          <div className="space-y-4">
            {recentRequests.map((request, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Printer className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{request.name || request.email?.split('@')[0]}</p>
                    <p className="text-sm text-gray-600">{request.pages} pages • {request.copies} copies</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    request.status === 'completed' ? 'bg-green-100 text-green-700' :
                    request.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {request.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                     request.status === 'processing' ? <Clock className="w-3 h-3" /> :
                     <AlertCircle className="w-3 h-3" />}
                    {request.status}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">₹{request.price || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



export default AdminPanel;
