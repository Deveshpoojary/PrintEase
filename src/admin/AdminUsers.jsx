import React, { useEffect, useState } from 'react';
import { User, Mail } from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonLoader';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://print-ease-backend-gold.vercel.app/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text">
        Registered Users
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))
        ) : (
          users.map((user, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 border border-indigo-200 shadow-md hover:shadow-lg transition"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full text-white">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user.email}</p>
                  <p className="text-sm text-gray-600">{user.total_requests} print requests</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
