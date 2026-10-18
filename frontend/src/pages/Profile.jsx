import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">User Profile</h1>
        {user ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">First Name</span>
                <span className="text-lg font-semibold text-gray-800">{user.firstName}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Last Name</span>
                <span className="text-lg font-semibold text-gray-800">{user.lastName}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Email</span>
                <span className="text-lg font-semibold text-gray-800">{user.email}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Role</span>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">
                  {user.role}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Profile update and password changes will be fully functional in Phase 4.
            </p>
          </div>
        ) : (
          <p className="text-gray-600">No user data available.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
