import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AppContext from '../context/AppContext';

// For routes that require authentication (like profile, appointments)
export const ProtectedRoute = () => {
  const { user, authLoading } = useContext(AppContext);
  
  // Show nothing while checking authentication
  if (authLoading) {
    return null; // Or return a loading spinner component
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If logged in, render the child routes
  return <Outlet />;
};

// For routes that should not be accessible when authenticated (like login, register)
export const AuthRoute = () => {
  const { user, authLoading } = useContext(AppContext);
  const location = useLocation();
  
  // Show nothing while checking authentication
  if (authLoading) {
    return null; // Or return a loading spinner component
  }
  
  // If logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  // Check if there's a pending verification email
  const pendingVerificationEmail = localStorage.getItem('pendingVerificationEmail');
  
  // If there's a pending verification and trying to access register/login, redirect to verify OTP
  // But avoid redirect loop by checking that we're not already on the verify-otp page
  if (pendingVerificationEmail && 
      (location.pathname === '/login' || location.pathname === '/register') && 
      location.pathname !== '/verify-otp') {
    return <Navigate to="/verify-otp" state={{ email: pendingVerificationEmail }} replace />;
  }
  
  // Otherwise, render the auth pages
  return <Outlet />;
}; 