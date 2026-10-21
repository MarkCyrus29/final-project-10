import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Navbar from './components/Navbar';
import MobileTabBar from './components/layout/MobileTabBar';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import PassengerRoute from './routes/PassengerRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Flights from './pages/Flights';
import FlightDetails from './pages/FlightDetails';
import BookFlight from './pages/BookFlight';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFlights from './pages/admin/ManageFlights';
import FlightForm from './pages/admin/FlightForm';
import ManageUsers from './pages/admin/ManageUsers';
import AllBookings from './pages/admin/AllBookings';
import FlightManifest from './pages/admin/FlightManifest';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <div className="flex min-h-dvh flex-col bg-canvas text-ink">
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:border focus:border-line-strong"
                >
                  Skip to content
                </a>
                <Navbar />
                <main
                  id="main"
                  tabIndex={-1}
                  className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)] outline-none md:pb-0"
                >
                  <Routes>
                    {/* Default redirect to flights */}
                    <Route path="/" element={<Navigate to="/flights" replace />} />

                    {/* Public Routes */}
                    <Route path="/flights" element={<Flights />} />
                    <Route path="/flights/:id" element={<FlightDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes (Passenger) */}
                    <Route
                      path="/book/:id"
                      element={
                        <PassengerRoute>
                          <BookFlight />
                        </PassengerRoute>
                      }
                    />
                    <Route
                      path="/my-bookings"
                      element={
                        <PassengerRoute>
                          <MyBookings />
                        </PassengerRoute>
                      }
                    />

                    {/* Protected Routes (Authenticated) */}
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
                    <Route
                      path="/admin/bookings"
                      element={
                        <AdminRoute>
                          <AllBookings />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/flights/:id/manifest"
                      element={
                        <AdminRoute>
                          <FlightManifest />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <AdminRoute>
                          <ManageUsers />
                        </AdminRoute>
                      }
                    />

                    {/* Fallback 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <MobileTabBar />
              </div>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
