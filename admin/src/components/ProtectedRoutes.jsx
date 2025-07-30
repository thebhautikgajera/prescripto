import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AdminContext } from '../context/AdminContextDefinition';
import { DoctorContext } from '../context/DoctorContextDefinition';

// For routes that require admin authentication
export const AdminProtectedRoute = () => {
  const { admin, authLoading } = useContext(AdminContext);
  
  // Show nothing while checking authentication
  if (authLoading) {
    return null; // Or return a loading spinner component
  }
  
  // If not logged in, redirect to login
  if (!admin) {
    return <Navigate to="/login" replace />;
  }
  
  // If logged in, render the child routes
  return <Outlet />;
};

// For routes that require doctor authentication
export const DoctorProtectedRoute = () => {
  const { doctor, authLoading } = useContext(DoctorContext);
  
  // Show nothing while checking authentication
  if (authLoading) {
    return null; // Or return a loading spinner component
  }
  
  // If not logged in, redirect to login
  if (!doctor) {
    return <Navigate to="/login" replace />;
  }
  
  // If logged in, render the child routes
  return <Outlet />;
};

// For routes that should not be accessible when authenticated (like login)
export const AdminAuthRoute = () => {
  const { admin, authLoading } = useContext(AdminContext);
  const { doctor } = useContext(DoctorContext);
  
  // Show nothing while checking authentication
  if (authLoading) {
    return null; // Or return a loading spinner component
  }
  
  // If logged in as admin, redirect to admin dashboard
  if (admin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If logged in as doctor, redirect to doctor dashboard
  if (doctor) {
    return <Navigate to="/doctor-dashboard" replace />;
  }
  
  // Otherwise, render the auth pages
  return <Outlet />;
}; 