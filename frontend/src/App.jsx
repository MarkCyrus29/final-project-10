import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Flights from './pages/Flights';
import FlightDetails from './pages/FlightDetails';
import BookFlight from './pages/BookFlight';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Profile from './pages/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFlights from './pages/admin/ManageFlights';
import FlightForm from './pages/admin/FlightForm';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Default redirect to flights */}
              <Route path="/" element={<Navigate to="/flights" replace />} />

              {/* Public Routes */}
              <Route path="/flights" element={<Flights />} />
              <Route path="/flights/:id" element={<FlightDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes (Authenticated) */}
              <Route
                path="/book/:id"
                element={
                  <ProtectedRoute>
                    <BookFlight />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/:id"
                element={
                  <ProtectedRoute>
                    <BookingDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/flights"
                element={
                  <AdminRoute>
                    <ManageFlights />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/flights/new"
                element={
                  <AdminRoute>
                    <FlightForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/flights/:id/edit"
                element={
                  <AdminRoute>
                    <FlightForm />
                  </AdminRoute>
                }
              />

              {/* Fallback 404 Route */}
              <Route path="*" element={<Navigate to="/flights" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
