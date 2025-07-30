import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ImSpinner8 } from "react-icons/im";
import AppContext from "../context/AppContext";

const VerifyEmail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  
  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  
  useEffect(() => {
    // If already logged in, redirect to home
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/user/resend-otp`, { email });
      
      if (response.data.success) {
        toast.success('OTP sent successfully! Please verify your email.');
        
        // Store email in localStorage and redirect to OTP verification page
        localStorage.setItem('pendingVerificationEmail', email);
        navigate('/verify-otp', { state: { email }, replace: true });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-8">
          <h2 className="text-center text-3xl font-extrabold text-white">Verify Your Email</h2>
          <p className="mt-2 text-center text-sm text-blue-100">
            Complete your registration by verifying your email
          </p>
        </div>
        
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the email you used during registration. If you need to use a different email, you&apos;ll be able to change it in the next step.
              </p>
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
                    Sending OTP...
                  </span>
                ) : "Send Verification Code"}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already verified?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 