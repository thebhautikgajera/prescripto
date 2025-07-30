import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ImSpinner8 } from "react-icons/im";
import AppContext from "../context/AppContext";

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useContext(AppContext);
  
  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  
  useEffect(() => {
    // If already logged in, redirect to home
    if (user) {
      navigate('/', { replace: true });
      return;
    }
    
    // Get email from location state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('pendingVerificationEmail');
    
    if (emailFromState) {
      setVerificationEmail(emailFromState);
      localStorage.setItem('pendingVerificationEmail', emailFromState);
    } else if (emailFromStorage) {
      setVerificationEmail(emailFromStorage);
    } else {
      // If no email is found, redirect to register page
      navigate('/register', { replace: true });
      return;
    }
    
    // Set up countdown timer for resend button
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [navigate, countdown, user, location.state]);
  
  const handleChange = (index, value) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      document.getElementById('otp-5').focus();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/user/verify-otp`, {
        email: verificationEmail,
        otp: otpValue
      });
      
      if (response.data.success) {
        toast.success('Email verified successfully!');
        
        // Clear the pending verification
        localStorage.removeItem('pendingVerificationEmail');
        
        // Login the user
        login(response.data.user, response.data.token);
        
        // Redirect to home page with replace to prevent going back
        navigate('/', { replace: true });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      
      // Make sure we have a valid email
      if (!verificationEmail) {
        toast.error('No email address found for verification');
        return;
      }
      
      const response = await axios.post(`${API_URL}/api/user/resend-otp`, { 
        email: verificationEmail 
      });
      
      if (response.data.success) {
        toast.success('OTP resent successfully! Please check your email.');
        setCountdown(60); // Set 60 seconds cooldown
        
        // Clear existing OTP inputs
        setOtp(['', '', '', '', '', '']);
      } else {
        toast.error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setChangeEmailLoading(true);
      
      const response = await axios.post(`${API_URL}/api/user/change-verification-email`, {
        oldEmail: verificationEmail,
        newEmail: newEmail
      });
      
      if (response.data.success) {
        toast.success('Email updated successfully! A new verification code has been sent.');
        
        // Update email in state and localStorage
        setVerificationEmail(response.data.email);
        localStorage.setItem('pendingVerificationEmail', response.data.email);
        
        // Reset OTP inputs
        setOtp(['', '', '', '', '', '']);
        
        // Hide change email form
        setShowChangeEmail(false);
        
        // Reset new email input
        setNewEmail('');
        
        // Set countdown for resend button
        setCountdown(60);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update email address. Please try again.';
      toast.error(errorMessage);
    } finally {
      setChangeEmailLoading(false);
    }
  };
  
  // If no email is available, don't render the form
  if (!verificationEmail) {
    return null;
  }
  
  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-8">
          <h2 className="text-center text-3xl font-extrabold text-white">Verify Your Email</h2>
          <p className="mt-2 text-center text-sm text-blue-100">
            Enter the 6-digit code sent to {verificationEmail}
          </p>
        </div>
        
        <div className="px-8 py-8">
          {showChangeEmail ? (
            <form onSubmit={handleChangeEmail} className="space-y-6">
              <div>
                <label htmlFor="new-email" className="block text-sm font-medium text-gray-700">
                  New Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="new-email"
                    name="new-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={changeEmailLoading}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all duration-150 ease-in-out"
                >
                  {changeEmailLoading ? (
                    <span className="flex items-center">
                      <ImSpinner8 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Updating...
                    </span>
                  ) : "Update Email"}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowChangeEmail(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all duration-150 ease-in-out"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <ImSpinner8 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Verifying...
                    </span>
                  ) : "Verify Email"}
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn&apos;t receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading || countdown > 0}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0 
                    ? `Resend code in ${countdown}s` 
                    : resendLoading 
                      ? 'Sending...' 
                      : 'Resend Code'}
                </button>
              </div>
              
              <div className="text-center border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Not your email address?
                </p>
                <button
                  type="button"
                  onClick={() => setShowChangeEmail(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                >
                  Change Email Address
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Back to{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP; 