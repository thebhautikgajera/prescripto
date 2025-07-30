import React, { useState, useContext } from 'react';
import Layout from '../components/Layout';
import { DoctorContext } from '../context/DoctorContextDefinition';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';

const DoctorSettingsPage = () => {
  const { doctor, token, fetchProfile } = useContext(DoctorContext);
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Availability state
  const [available, setAvailable] = useState(doctor?.available || false);
  
  // Email notification preferences - commented out for now
  /*
  const [emailPreferences, setEmailPreferences] = useState({
    newAppointment: true,
    appointmentCancellation: true,
    appointmentReminder: true,
    systemUpdates: false
  });
  */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /*
  const handleEmailPreferenceChange = (e) => {
    const { name, checked } = e.target;
    setEmailPreferences(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  */

  const handleAvailabilityChange = async () => {
    try {
      setLoading(true);
      const API_URL = `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000'}/api/doctor`;
      
      const response = await fetch(`${API_URL}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          available: !available
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAvailable(!available);
        showSuccessToast(`You are now ${!available ? 'available' : 'unavailable'} for appointments`);
        fetchProfile(); // Refresh doctor data
      } else {
        showErrorToast(data.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      showErrorToast('An error occurred while updating availability');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorToast('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showErrorToast('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      const API_URL = `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000'}/api/doctor`;
      
      const response = await fetch(`${API_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showSuccessToast('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showErrorToast(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showErrorToast('An error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

  /*
  const handleEmailPreferencesSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // Simulate API call - replace with actual implementation when backend endpoint is available
      setTimeout(() => {
        showSuccessToast('Email preferences updated successfully');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating email preferences:', error);
      showErrorToast('An error occurred while updating email preferences');
      setLoading(false);
    }
  };
  */

  if (!doctor) {
    return (
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="doctor">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="doctor" user={doctor}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <div className="grid grid-cols-1 gap-8">
          {/* Availability Toggle */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Availability Status</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 mb-1">Set your availability for appointments</p>
                <p className="text-sm text-gray-500">
                  When you're unavailable, patients won't be able to book new appointments with you
                </p>
              </div>
              <div className="flex items-center">
                <span className={`mr-2 ${available ? 'text-green-600' : 'text-red-600'}`}>
                  {available ? 'Available' : 'Unavailable'}
                </span>
                <button
                  onClick={handleAvailabilityChange}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${available ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300 focus:outline-none`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${available ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* Password Change */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Email Preferences - Commented out for now */}
          {/*
          <div>
            <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
            <form onSubmit={handleEmailPreferencesSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="newAppointment"
                    name="newAppointment"
                    checked={emailPreferences.newAppointment}
                    onChange={handleEmailPreferenceChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="newAppointment" className="ml-2 block text-sm text-gray-700">
                    New appointment notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="appointmentCancellation"
                    name="appointmentCancellation"
                    checked={emailPreferences.appointmentCancellation}
                    onChange={handleEmailPreferenceChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="appointmentCancellation" className="ml-2 block text-sm text-gray-700">
                    Appointment cancellation notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="appointmentReminder"
                    name="appointmentReminder"
                    checked={emailPreferences.appointmentReminder}
                    onChange={handleEmailPreferenceChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="appointmentReminder" className="ml-2 block text-sm text-gray-700">
                    Appointment reminders (24 hours before)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="systemUpdates"
                    name="systemUpdates"
                    checked={emailPreferences.systemUpdates}
                    onChange={handleEmailPreferenceChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="systemUpdates" className="ml-2 block text-sm text-gray-700">
                    System updates and announcements
                  </label>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
          */}
          
          {/* Email Notifications - Coming Soon Message */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-blue-700">
                Email notification settings will be available soon. Stay tuned for updates!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorSettingsPage; 