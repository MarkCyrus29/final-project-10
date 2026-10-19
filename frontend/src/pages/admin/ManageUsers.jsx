import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (u) => {
    if (
      !window.confirm(
        `Delete ${u.firstName} ${u.lastName} (${u.email})?\n\nTheir bookings will also be deleted and the seats of their confirmed bookings will be released.`
      )
    ) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/users/${u._id}`);
      setSuccess(`${u.firstName} ${u.lastName} was deleted.`);
      setUsers((prev) => prev.filter((item) => item._id !== u._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link to="/admin" className="text-sm text-blue-600 hover:underline">
          ← Admin Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">User Management</h1>
        <p className="text-sm text-gray-500">View all registered accounts and remove users when needed.</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-emerald-700 text-sm mb-6">
          {success}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelf = currentUser && u._id === currentUser._id;

                  return (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {u.firstName} {u.lastName}
                        {isSelf && <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{u.phone || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {/* An admin cannot delete their own account */}
                        {!isSelf && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="text-rose-600 hover:text-rose-800 font-medium text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded transition"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
