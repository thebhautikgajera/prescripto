import { useState, useEffect } from "react";
import { AdminContext } from "./AdminContextDefinition";
import { showSuccessToast, showErrorToast } from "../utils/toastUtils";

const AdminContextProvider = (props) => {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = `${import.meta.env.VITE_BACKEND_URI}/api/admin`;

  // Load admin data from localStorage on initial render
  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      const storedAdmin = localStorage.getItem("adminData");
      if (storedAdmin) {
        try {
          setAdmin(JSON.parse(storedAdmin));
        } catch (err) {
          console.error("Failed to parse admin data", err);
          localStorage.removeItem("adminData");
        }
      }
      setAuthLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Save token and admin data to localStorage when they change
  useEffect(() => {
    if (token) {
      localStorage.setItem("adminToken", token);
    } else {
      localStorage.removeItem("adminToken");
    }
    
    if (admin) {
      localStorage.setItem("adminData", JSON.stringify(admin));
    } else {
      localStorage.removeItem("adminData");
    }
  }, [token, admin]);

  // Login function to authenticate with backend
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setAdmin(data.admin);
        showSuccessToast(`Welcome back, ${data.admin.name}!`);
        return { success: true };
      } else {
        setError(data.message || "Login failed");
        showErrorToast(data.message || "Login failed");
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      const errorMsg = error.message || "Server error";
      setError(errorMsg);
      showErrorToast(`Error: ${errorMsg}`);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Register function for admin registration
  const register = async (adminData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setAdmin(data.admin);
        showSuccessToast("Registration successful!");
        return { success: true };
      } else {
        setError(data.message || "Registration failed");
        showErrorToast(data.message || "Registration failed");
        return { success: false, message: data.message || "Registration failed" };
      }
    } catch (error) {
      const errorMsg = error.message || "Server error";
      setError(errorMsg);
      showErrorToast(`Error: ${errorMsg}`);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout function
  const logout = async (callback) => {
    try {
      setLoading(true);
      
      // Clear all admin-related data from localStorage
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      
      // Optional: You can send a request to the backend to invalidate the token
      // This is useful if you're maintaining a blacklist of tokens on the server
      if (token) {
        try {
          await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          });
          // We don't need to handle the response as we're logging out anyway
        } catch (error) {
          console.error("Error during logout API call:", error);
          // Continue with logout even if the API call fails
        }
      }
      
      // Reset all state
      setToken(null);
      setAdmin(null);
      setError(null);
      
      // Clear any other admin-specific items from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("admin_")) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      showSuccessToast("Logged out successfully");
      
      // Execute callback if provided (e.g., for navigation)
      if (callback && typeof callback === 'function') {
        callback();
      }
      
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      showErrorToast(`Error during logout: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    token,
    setToken,
    admin,
    setAdmin,
    loading,
    authLoading,
    error,
    login,
    register,
    logout
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
