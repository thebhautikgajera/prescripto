import React, { useState, useContext } from 'react';
import Layout from '../components/Layout';
import { AdminContext } from '../context/AdminContextDefinition';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';

const AdminSettingsPage = () => {
  const { admin, token } = useContext(AdminContext);
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    appointmentTimeSlotDuration: 30, // in minutes
    maxAppointmentsPerDay: 10,
    allowWeekendAppointments: true,
    allowSameDayAppointments: false,
    maintenanceMode: false
  });
  
  // Email notification settings - commented out for now
  /*
  const [emailSettings, setEmailSettings] = useState({
    sendAdminNotifications: true,
    notifyOnNewRegistrations: true,
    notifyOnPaymentIssues: true,
    dailySummaryReports: false
  });
  */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSystemSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value
    }));
  };

  /*
  const handleEmailSettingChange = (e) => {
    const { name, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  */

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
      const API_URL = `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000'}/api/admin`;
      
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

  const handleSystemSettingsSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // Simulate API call - replace with actual implementation when backend endpoint is available
      setTimeout(() => {
        showSuccessToast('System settings updated successfully');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating system settings:', error);
      showErrorToast('An error occurred while updating system settings');
      setLoading(false);
    }
  };

  /*
  const handleEmailSettingsSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // Simulate API call - replace with actual implementation when backend endpoint is available
      setTimeout(() => {
        showSuccessToast('Email settings updated successfully');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating email settings:', error);
      showErrorToast('An error occurred while updating email settings');
      setLoading(false);
    }
  };
  */

  const handleMaintenanceModeToggle = () => {
    const newValue = !systemSettings.maintenanceMode;
    setSystemSettings(prev => ({
      ...prev,
      maintenanceMode: newValue
    }));
    
    // Show toast for user feedback
    if (newValue) {
      showSuccessToast('Maintenance mode activated');
    } else {
      showSuccessToast('Maintenance mode deactivated');
    }
  };

  if (!admin) {
    return (
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="admin">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="admin" user={admin}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
        
        <div className="grid grid-cols-1 gap-8">
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
          
          {/* System Settings */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            
            {/* Maintenance Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500">
                    When enabled, the system will be inaccessible to users and display a maintenance message
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`mr-2 ${systemSettings.maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
                    {systemSettings.maintenanceMode ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={handleMaintenanceModeToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'} transition-colors duration-300 focus:outline-none`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSystemSettingsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time Slot Duration (minutes)</label>
                <input
                  type="number"
                  name="appointmentTimeSlotDuration"
                  value={systemSettings.appointmentTimeSlotDuration}
                  onChange={handleSystemSettingChange}
                  min="15"
                  max="120"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Appointments Per Day</label>
                <input
                  type="number"
                  name="maxAppointmentsPerDay"
                  value={systemSettings.maxAppointmentsPerDay}
                  onChange={handleSystemSettingChange}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowWeekendAppointments"
                  name="allowWeekendAppointments"
                  checked={systemSettings.allowWeekendAppointments}
                  onChange={handleSystemSettingChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allowWeekendAppointments" className="ml-2 block text-sm text-gray-700">
                  Allow weekend appointments
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowSameDayAppointments"
                  name="allowSameDayAppointments"
                  checked={systemSettings.allowSameDayAppointments}
                  onChange={handleSystemSettingChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allowSameDayAppointments" className="ml-2 block text-sm text-gray-700">
                  Allow same-day appointments
                </label>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Email Settings - Commented out for now */}
          {/*
          <div>
            <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
            <form onSubmit={handleEmailSettingsSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendAdminNotifications"
                    name="sendAdminNotifications"
                    checked={emailSettings.sendAdminNotifications}
                    onChange={handleEmailSettingChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="sendAdminNotifications" className="ml-2 block text-sm text-gray-700">
                    Receive admin notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifyOnNewRegistrations"
                    name="notifyOnNewRegistrations"
                    checked={emailSettings.notifyOnNewRegistrations}
                    onChange={handleEmailSettingChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="notifyOnNewRegistrations" className="ml-2 block text-sm text-gray-700">
                    Notify on new user/doctor registrations
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifyOnPaymentIssues"
                    name="notifyOnPaymentIssues"
                    checked={emailSettings.notifyOnPaymentIssues}
                    onChange={handleEmailSettingChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="notifyOnPaymentIssues" className="ml-2 block text-sm text-gray-700">
                    Notify on payment issues
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dailySummaryReports"
                    name="dailySummaryReports"
                    checked={emailSettings.dailySummaryReports}
                    onChange={handleEmailSettingChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="dailySummaryReports" className="ml-2 block text-sm text-gray-700">
                    Receive daily summary reports
                  </label>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Email Settings'}
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

export default AdminSettingsPage; 