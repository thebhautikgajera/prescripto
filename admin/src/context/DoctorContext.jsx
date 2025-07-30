import { useState, useEffect, useCallback } from "react";
import { DoctorContext } from "./DoctorContextDefinition";
import { showSuccessToast, showErrorToast } from "../utils/toastUtils";

const DoctorContextProvider = (props) => {
  const [token, setToken] = useState(localStorage.getItem("doctorToken") || null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000'}/api/doctor`;

  // Load doctor data from localStorage on initial render
  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      const storedDoctor = localStorage.getItem("doctorData");
      if (storedDoctor) {
        try {
          setDoctor(JSON.parse(storedDoctor));
        } catch (err) {
          console.error("Failed to parse doctor data", err);
          localStorage.removeItem("doctorData");
        }
      }
      setAuthLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Fetch doctor profile
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDoctor(data.doctor);
      } else {
        console.error("Failed to fetch doctor profile:", data.message);
        // Don't clear token or doctor data here, just log the error
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  // Fetch doctor profile when token changes
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  // Save token and doctor data to localStorage when they change
  useEffect(() => {
    if (token) {
      localStorage.setItem("doctorToken", token);
    } else {
      localStorage.removeItem("doctorToken");
    }
    
    if (doctor) {
      localStorage.setItem("doctorData", JSON.stringify(doctor));
    } else {
      localStorage.removeItem("doctorData");
    }
  }, [token, doctor]);

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
        setDoctor(data.doctor);
        showSuccessToast(`Welcome back, Dr. ${data.doctor.name}!`);
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

  // Enhanced logout function
  const logout = async (callback) => {
    try {
      setLoading(true);
      
      // Clear all doctor-related data from localStorage
      localStorage.removeItem("doctorToken");
      localStorage.removeItem("doctorData");
      
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
      setDoctor(null);
      setError(null);
      
      // Clear any other doctor-specific items from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("doctor_")) {
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
    doctor,
    setDoctor,
    loading,
    authLoading,
    error,
    login,
    logout,
    fetchProfile
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
