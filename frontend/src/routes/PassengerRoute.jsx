import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSpinner } from '../components/ui/Spinner';

const PassengerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'passenger') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default PassengerRoute;
