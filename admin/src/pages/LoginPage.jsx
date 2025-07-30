import React, { useState, useContext, useEffect } from "react";
import { assets } from "../assets/assets";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { AdminContext } from "../context/AdminContextDefinition";
import { DoctorContext } from "../context/DoctorContextDefinition";
import { useNavigate, Link } from "react-router-dom";
import { showErrorToast } from "../utils/toastUtils";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Get context values
  const { login: adminLogin, loading: adminLoading, admin, authLoading: adminAuthLoading } = useContext(AdminContext);
  const { login: doctorLogin, loading: doctorLoading, doctor, authLoading: doctorAuthLoading } = useContext(DoctorContext);

  const loading = adminLoading || doctorLoading;

  // Check if user is already logged in
  useEffect(() => {
    if (!adminAuthLoading && admin) {
      navigate("/dashboard");
    }
    if (!doctorAuthLoading && doctor) {
      navigate("/doctor-dashboard");
    }
  }, [admin, doctor, adminAuthLoading, doctorAuthLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleLoginState = (type) => {
    setLoginType(type);
  };

  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password) {
      showErrorToast("Please enter both email and password");
      return;
    }

    try {
      let result;
      
      if (loginType === "Admin") {
        result = await adminLogin(formData);
        if (result.success) {
          navigate("/dashboard"); // Redirect to admin dashboard
        }
      } else {
        result = await doctorLogin(formData);
        if (result.success) {
          navigate("/doctor-dashboard"); // Redirect to doctor dashboard
        }
      }
    } catch (error) {
      showErrorToast("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    }
  };

  // Show loading state while checking authentication
  if (adminAuthLoading || doctorAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <img src={assets.admin_logo} alt="Admin Logo" className="mx-auto h-16 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{loginType} Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the {loginType.toLowerCase()} panel
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
          <div className="rounded-md shadow-sm space-y-4">
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
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={loginType === "Admin" ? "admin@example.com" : "doctor@example.com"}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMe}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
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
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
