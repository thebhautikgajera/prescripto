import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminContext } from '../context/AdminContextDefinition';
import { DoctorContext } from '../context/DoctorContextDefinition';

const LogoutButton = ({ userType = 'admin', className, buttonText = 'Logout' }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  
  const adminContext = useContext(AdminContext);
  const doctorContext = useContext(DoctorContext);
  
  // Determine which context to use based on userType
  const { logout } = userType.toLowerCase() === 'doctor' ? doctorContext : adminContext;
  
  const handleLogoutClick = () => {
    setShowConfirmation(true);
  };
  
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logout(() => {
        // Navigate to login page after successful logout
        navigate('/');
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowConfirmation(false);
    }
  };
  
  const handleCancelLogout = () => {
    setShowConfirmation(false);
  };
  
  const defaultButtonClass = "px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
  
  return (
    <>
      <button
        onClick={handleLogoutClick}
        className={className || defaultButtonClass}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging out...
          </span>
        ) : buttonText}
      </button>
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to log out? Any unsaved changes will be lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </span>
                ) : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton; 