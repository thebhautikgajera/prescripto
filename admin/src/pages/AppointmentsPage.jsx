import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AdminContext } from '../context/AdminContextDefinition';
import Layout from '../components/Layout';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import axios from 'axios';

const AppointmentsPage = () => {
  const [activeTab, setActiveTab] = useState("appointments");
  const { token, admin } = useContext(AdminContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled, completed
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingSlip, setDownloadingSlip] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000';

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/appointment/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        setError(data.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchAppointments();
  }, [token, fetchAppointments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/appointment/status/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccessToast('Appointment status updated successfully');
        fetchAppointments(); // Refresh the list
      } else {
        showErrorToast(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
      showErrorToast('Failed to connect to server. Please try again later.');
    }
  };

  // Function to download appointment slip
  const downloadAppointmentSlip = async (appointmentId) => {
    try {
      setDownloadingSlip(appointmentId);
      
      // Using Blob to handle the PDF download
      const response = await axios.get(
        `${API_URL}/api/appointment/slip/${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointment_slip_${appointmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      showSuccessToast("Appointment slip downloaded successfully");
    } catch (error) {
      console.error("Error downloading appointment slip:", error);
      showErrorToast("Failed to download appointment slip. Please try again later.");
    } finally {
      setDownloadingSlip(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(appointment => appointment.status === filter);

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="admin" user={admin}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Appointments Management</h1>
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors disabled:bg-indigo-400"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 mr-1 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        <div className="mb-6 flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('pending')} 
            className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('confirmed')} 
            className={`px-4 py-2 rounded-md ${filter === 'confirmed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Confirmed
          </button>
          <button 
            onClick={() => setFilter('cancelled')} 
            className={`px-4 py-2 rounded-md ${filter === 'cancelled' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Cancelled
          </button>
          <button 
            onClick={() => setFilter('completed')} 
            className={`px-4 py-2 rounded-md ${filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Completed
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {appointment.userId.image && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={appointment.userId.image} 
                              alt={appointment.userId.name} 
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{appointment.userId.name}</div>
                          <div className="text-sm text-gray-500">{appointment.userId.email}</div>
                          {appointment.userId.phone && (
                            <div className="text-sm text-gray-500">{appointment.userId.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {appointment.doctorId.image && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={appointment.doctorId.image} 
                              alt={appointment.doctorId.name} 
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">Dr. {appointment.doctorId.name}</div>
                          <div className="text-sm text-gray-500">{appointment.doctorId.speciality}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.appointmentId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</div>
                      <div className="text-sm text-gray-500">{appointment.appointmentTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(appointment.paymentStatus)}`}>
                          {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        ₹{appointment.fees} - {appointment.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Confirm
                          </button>
                        )}
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => downloadAppointmentSlip(appointment._id)}
                          disabled={downloadingSlip === appointment._id}
                          className={`text-blue-600 hover:text-blue-900 ${downloadingSlip === appointment._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {downloadingSlip === appointment._id ? 'Downloading...' : 'Download Slip'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AppointmentsPage; 