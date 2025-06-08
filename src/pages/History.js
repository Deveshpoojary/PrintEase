import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, FileText, Printer, Clock, X, User } from 'lucide-react';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [usn, setUsn] = useState('');

  const printHistory = [
    {
      id: 1,
      fileName: 'Project_Report_Final.pdf',
      dateSubmitted: '2024-01-15',
      timeSubmitted: '10:30 AM',
      status: 'completed',
      pages: 25,
      copies: 2,
      color: 'Color',
      cost: '$12.50',
      usn: '1AB21CS001'
    },
    {
      id: 2,
      fileName: 'Presentation_Slides.pptx',
      dateSubmitted: '2024-01-14',
      timeSubmitted: '02:15 PM',
      status: 'processing',
      pages: 15,
      copies: 1,
      color: 'Color',
      cost: '$7.50',
      usn: '1AB21CS002'
    },
    {
      id: 3,
      fileName: 'Research_Paper.docx',
      dateSubmitted: '2024-01-12',
      timeSubmitted: '09:45 AM',
      status: 'completed',
      pages: 45,
      copies: 3,
      color: 'Black & White',
      cost: '$13.50',
      usn: '1AB21CS001'
    },
    {
      id: 4,
      fileName: 'Assignment_Cover.pdf',
      dateSubmitted: '2024-01-10',
      timeSubmitted: '04:20 PM',
      status: 'failed',
      pages: 2,
      copies: 1,
      color: 'Color',
      cost: '$1.00',
      usn: '1AB21CS003'
    },
    {
      id: 5,
      fileName: 'Thesis_Chapter_1.docx',
      dateSubmitted: '2024-01-08',
      timeSubmitted: '11:00 AM',
      status: 'completed',
      pages: 32,
      copies: 1,
      color: 'Black & White',
      cost: '$8.00',
      usn: '1AB21CS002'
    }
  ];

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

  const filteredHistory = printHistory.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesUsn = usn === '' || item.usn.toLowerCase().includes(usn.toLowerCase());
    return matchesSearch && matchesStatus && matchesUsn;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Print History
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Track and manage all your printing requests
        </p>
      </div>

      {/* Search, Filter, USN */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          {/* Search */}
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

          {/* Status Filter */}
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

          {/* USN Filter */}
          <div className="flex-1 relative min-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search by USN..."
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              className="w-full bg-white/60 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Remaining code (History cards, Summary) stays the same */}
      {/* ... */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 border border-white/40 shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No print history found</h3>
            <p className="text-gray-600">No printing requests match your search criteria.</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/40 shadow-xl hover:bg-white/90 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* File Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">{item.fileName}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{item.dateSubmitted}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{item.timeSubmitted}</span>
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

                {/* Status and Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="capitalize">{item.status}</span>
                    </div>
                    <div className="text-gray-800 font-semibold">{item.cost}</div>
                  </div>

                  <div className="flex gap-2">
                    <button className="p-2 bg-white/60 hover:bg-white/80 rounded-lg transition-colors duration-200 border border-gray-200">
                      <Eye className="w-4 h-4 text-gray-600 hover:text-gray-800" />
                    </button>
                    {item.status === 'completed' && (
                      <button className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all duration-200 shadow-lg">
                        <Download className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-2xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {printHistory.length}
          </div>
          <div className="text-blue-600 text-sm font-medium">Total Requests</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {printHistory.filter(item => item.status === 'completed').length}
          </div>
          <div className="text-green-600 text-sm font-medium">Completed</div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-2xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {printHistory.filter(item => item.status === 'processing').length}
          </div>
          <div className="text-yellow-600 text-sm font-medium">In Progress</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-2xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            ${printHistory.reduce((sum, item) => sum + parseFloat(item.cost.replace('$', '')), 0).toFixed(2)}
          </div>
          <div className="text-purple-600 text-sm font-medium">Total Spent</div>
        </div>
      </div>
    </div>
  );
};

export default History;
