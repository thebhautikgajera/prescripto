import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { assets } from "../assets/assets";
import { showSuccessToast, showErrorToast } from "../utils/toastUtils";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("Admin");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const toggleLoginState = (type) => {
    setLoginType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showErrorToast("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      
      let endpoint;
      if (loginType === "Admin") {
        endpoint = `${API_URL}/api/admin/forgot-password`;
      } else {
        endpoint = `${API_URL}/api/doctor/forgot-password`;
      }
      
      const response = await axios.post(endpoint, { email });

      if (response.data.success) {
        showSuccessToast("Password reset OTP has been sent to your email");
        // Store the email and user type for the reset password page
        localStorage.setItem('resetPasswordEmail', email);
        localStorage.setItem('resetPasswordUserType', loginType.toLowerCase());
        // Navigate to reset password page
        navigate('/reset-password', { state: { email, userType: loginType.toLowerCase() } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to send reset OTP. Please try again.`;
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <img src={assets.admin_logo} alt="Admin Logo" className="mx-auto h-16 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive a password reset OTP
          </p>
        </div>
        
        {/* Toggle Button */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => toggleLoginState("Admin")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                loginType === "Admin"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              } border border-gray-200`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => toggleLoginState("Doctor")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                loginType === "Doctor"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              } border border-gray-200`}
            >
              Doctor
            </button>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={loginType === "Admin" ? "admin@example.com" : "doctor@example.com"}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "Send Reset OTP"
              )}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 