import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/flights" className="text-xl font-bold tracking-tight hover:text-blue-100">
              ✈ Airline Reservation
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link to="/flights" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
              Flights
            </Link>

            {/* If NOT logged in */}
            {!user && (
              <>
                <Link to="/login" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium shadow-sm"
                >
                  Register
                </Link>
              </>
            )}

            {/* If logged in as Passenger */}
            {user && user.role === 'passenger' && (
              <>
                <Link to="/my-bookings" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  My Bookings
                </Link>
                <Link to="/profile" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </Link>
              </>
            )}

            {/* If logged in as Admin */}
            {user && user.role === 'admin' && (
              <>
                <Link to="/admin" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium bg-blue-800">
                  Admin Panel
                </Link>
                <Link to="/admin/flights" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Manage Flights
                </Link>
                <Link to="/profile" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </Link>
              </>
            )}

            {/* User Info and Logout */}
            {user && (
              <div className="flex items-center space-x-3 border-l border-blue-500 pl-4">
                <span className="text-sm font-light">
                  Hi, <strong className="font-semibold">{user.firstName}</strong> ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md text-sm font-medium transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
