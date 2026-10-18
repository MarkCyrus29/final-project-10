import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase">
            Admin Access Only
          </span>
        </div>
        <p className="text-gray-600 mb-6">
          Logged in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email}).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Flight Management</h3>
            <p className="text-sm text-gray-500">Add, edit, and cancel flight schedules (Phase 2).</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">User Management</h3>
            <p className="text-sm text-gray-500">View and remove user accounts (Phase 4).</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Manifest & Bookings</h3>
            <p className="text-sm text-gray-500">Monitor all bookings and passenger manifests (Phase 5).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
