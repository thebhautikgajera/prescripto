import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AppContext from "../context/AppContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useContext(AppContext);
  
  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  useEffect(() => {
    // If already logged in, redirect to home
    if (user) {
      navigate('/', { replace: true });
      return;
    }
    
    // Check if there's a pending verification
    const hasPendingVerification = !!localStorage.getItem('pendingVerificationEmail');
    setPendingVerification(hasPendingVerification);
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/user/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        // Use the login function from context
        login(response.data.user, response.data.token);
        
        toast.success("Login successful!");
        navigate("/", { replace: true });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      
      // If email not verified, redirect to verification page
      if (error.response?.data?.requiresVerification) {
        localStorage.setItem('pendingVerificationEmail', formData.email);
        setPendingVerification(true);
        navigate('/verify-otp', { 
          state: { email: formData.email }, 
          replace: true 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-8">
          <h2 className="text-center text-3xl font-extrabold text-white">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-blue-100">
            Sign in to access your account
          </p>
        </div>
        
        <div className="px-8 py-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  onChange={handleChange}
                  value={formData.email}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  onChange={handleChange}
                  value={formData.password}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
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
                    Processing...
                  </span>
                ) : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
            
            {pendingVerification && (
              <p className="text-sm text-gray-600 mt-2">
                Need to verify your email?{' '}
                <Link to="/verify-email" className="font-medium text-blue-600 hover:text-blue-500">
                  Verify here
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
