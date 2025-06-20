import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  FileText,
  Printer,
  Clock,
  X,
  User
} from 'lucide-react';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [historyData, setHistoryData] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        const res = await fetch(
          `http://localhost:5000/api/print-request/user-history?email=${user.primaryEmailAddress.emailAddress}`
        );
        const data = await res.json();
        setHistoryData(data);
      } catch (err) {
        console.error('Failed to fetch print history:', err);
      }
    };

    fetchHistory();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Download className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredHistory = historyData.filter((item) => {
    const matchesSearch = item.file_url
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Print History
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Track and manage all your printing requests
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search by file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/60 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-3 min-w-[200px]">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Cards */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 border border-white/40 shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No print history found
            </h3>
            <p className="text-gray-600">
              No printing requests match your search criteria.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/40 shadow-xl hover:bg-white/90 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {item.file_url?.split('/').pop() || 'Unknown File'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{item.pages} pages</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Printer className="w-4 h-4" />
                      <span>{item.copies} copies</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right space-y-2">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {getStatusIcon(item.status)}
                      <span className="capitalize">{item.status}</span>
                    </div>
                    <div className="text-gray-800 font-semibold">
                      ${item.cost || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Requests"
          count={historyData.length}
          color="blue"
        />
        <SummaryCard
          title="Completed"
          count={historyData.filter((i) => i.status === 'completed').length}
          color="green"
        />
        <SummaryCard
          title="In Progress"
          count={historyData.filter((i) => i.status === 'processing').length}
          color="yellow"
        />
        <SummaryCard
          title="Total Spent"
          count={`$${historyData
            .reduce((sum, i) => sum + parseFloat(i.cost || 0), 0)
            .toFixed(2)}`}
          color="purple"
        />
      </div>
    </div>
  );
};

const SummaryCard = ({ title, count, color }) => {
  const gradientMap = {
    blue: 'from-blue-100 to-cyan-100 border-blue-200 text-blue-600',
    green: 'from-green-100 to-emerald-100 border-green-200 text-green-600',
    yellow: 'from-yellow-100 to-orange-100 border-yellow-200 text-yellow-600',
    purple: 'from-purple-100 to-pink-100 border-purple-200 text-purple-600'
  };

  return (
    <div
      className={`bg-gradient-to-r ${gradientMap[color]} rounded-2xl p-6 text-center`}
    >
      <div className="text-2xl font-bold text-gray-800 mb-2">{count}</div>
      <div className="text-sm font-medium">{title}</div>
    </div>
  );
};

export default History;
