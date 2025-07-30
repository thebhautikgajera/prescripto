import { useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import AppContext from './AppContext';

const AppContextProvider = (props) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true); // Add auth loading state
    const currencySymbol = '₹';
    
    // API URL fallback
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

    // Fetch fresh user profile data - defined with useCallback to avoid dependency issues
    const fetchUserProfile = useCallback(async (token) => {
        try {
            if (!token) return;
            
            const response = await axios.get(`${API_URL}/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.success && response.data.user) {
                const updatedUser = response.data.user;
                
                // Update state with fresh user data
                setUser(updatedUser);
                
                // Update localStorage
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            
            // If we get a 401 or 403 error, the token might be invalid
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.warn('Authentication error. User may need to log in again.');
                // Don't auto-logout here, just keep the existing data
            } 
            // If we get a 404 error, the endpoint may not exist
            else if (error.response && error.response.status === 404) {
                console.warn('User profile endpoint not available. Using stored data.');
                // Don't make any changes - we'll just use the stored user data
            }
            // For network errors, retry once after a delay
            else if (error.message === 'Network Error') {
                console.warn('Network error when fetching profile. Retrying in 3 seconds...');
                setTimeout(() => {
                    // Try again once after 3 seconds
                    fetchUserProfile(token);
                }, 3000);
            }
            // For all other errors, keep the existing data
        }
    }, [API_URL]);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (token && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                    // Set axios default header for authentication
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Refresh user data on app start
                    await fetchUserProfile(token);
                } catch (error) {
                    console.error('Error parsing stored user data:', error);
                    logout(); // Clear invalid data
                }
            }
            setAuthLoading(false);
        };
        
        checkAuth();
    }, [fetchUserProfile]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/doctor/all`);
                if (response.data.success) {
                    setDoctors(response.data.doctors);
                } else {
                    setError(response.data.message || 'Failed to fetch doctors');
                }
            } catch (err) {
                console.error('Error fetching doctors:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch doctors');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, [API_URL]);

    // Login function
    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch complete user profile after login
        fetchUserProfile(token);
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        delete axios.defaults.headers.common['Authorization'];
    };

    // Update user data in context and localStorage
    const updateUserData = (updatedData) => {
        setUser(prev => {
            const updated = { ...prev, ...updatedData };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    const value = { 
        doctors, 
        loading, 
        error, 
        currencySymbol,
        user,
        setUser: updateUserData,
        isAuthenticated,
        authLoading, // Add auth loading to context
        login,
        logout,
        refreshUserProfile: () => fetchUserProfile(localStorage.getItem('token'))
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

AppContextProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default AppContextProvider; 