import React, { useContext, useEffect, useState, useCallback } from "react";
import { DoctorContext } from "../context/DoctorContextDefinition";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const DoctorDashboard = () => {
  const { doctor, token, fetchProfile } = useContext(DoctorContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  });

  const API_URL = import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000';

  // Redirect if not authenticated and ensure we have latest doctor data
  useEffect(() => {
    if (!token) {
      navigate("/");
    } else if (!doctor) {
      fetchProfile();
    }
  }, [token, navigate, doctor, fetchProfile]);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!token || !doctor || !doctor._id) {
      console.error("Missing required data for fetching appointments:", { 
        hasToken: !!token, 
        hasDoctor: !!doctor, 
        doctorId: doctor?._id 
      });
      return;
    }
    
    setAppointmentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/appointment/doctor/${doctor._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Get today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysAppointments = data.appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === today.getTime();
        });
        
        setTodayAppointments(todaysAppointments);
        
        // Calculate stats
        const pendingCount = data.appointments.filter(app => 
          app.status === 'pending' || app.status === 'confirmed'
        ).length;
        
        const completedCount = data.appointments.filter(app => 
          app.status === 'completed'
        ).length;
        
        setStats({
          totalAppointments: data.appointments.length,
          pendingAppointments: pendingCount,
          completedAppointments: completedCount
        });
      } else {
        setAppointmentsError(data.message || 'Failed to fetch appointments');
        console.error("API error:", data.message);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointmentsError('Failed to connect to server. Please try again later.');
    } finally {
      setAppointmentsLoading(false);
    }
  }, [token, doctor, API_URL]);

  // Fetch appointments when doctor data is available
  useEffect(() => {
    if (doctor && doctor._id) {
      fetchAppointments();
    }
  }, [doctor, fetchAppointments]);

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
        // Refresh appointments
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  /* eslint-disable no-unused-vars */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  /* eslint-enable no-unused-vars */

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="p-8 bg-white shadow-lg rounded-lg">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading doctor data...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start">
                <div className="mr-6">
                  <img 
                    src={doctor.image} 
                    alt={`Dr. ${doctor.name}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Dr. {doctor.name}</h2>
                  <p className="text-gray-600">{doctor.speciality}</p>
                  <p className="text-gray-600">{doctor.degree}</p>
                  <p className="text-gray-600">{doctor.experience} years of experience</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total Appointments</h3>
                  <p className="mt-1 text-3xl font-semibold text-indigo-600">{stats.totalAppointments}</p>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Pending Appointments</h3>
                  <p className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pendingAppointments}</p>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Completed Appointments</h3>
                  <p className="mt-1 text-3xl font-semibold text-green-600">{stats.completedAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Today's Appointments</h3>
                <button 
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                  onClick={() => navigate('/doctor-appointments')}
                >
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="overflow-x-auto">
                {appointmentsLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading appointments...</p>
                  </div>
                ) : appointmentsError ? (
                  <div className="text-center py-6 text-red-500">
                    {appointmentsError}
                    <button 
                      className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      onClick={fetchAppointments}
                    >
                      Retry
                    </button>
                  </div>
                ) : todayAppointments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No appointments scheduled for today.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {todayAppointments.map((appointment) => (
                        <tr key={appointment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {appointment.userId && appointment.userId.image && (
                                <div className="flex-shrink-0 h-10 w-10 mr-3">
                                  <img 
                                    className="h-10 w-10 rounded-full object-cover" 
                                    src={appointment.userId.image} 
                                    alt={appointment.userId.name} 
                                  />
                                </div>
                              )}
                              <div>
                                {appointment.userId ? (
                                  <>
                                    <div className="text-sm font-medium text-gray-900">{appointment.userId.name}</div>
                                    <div className="text-sm text-gray-500">{appointment.userId.email}</div>
                                  </>
                                ) : (
                                  <div className="text-sm text-gray-500">Patient data unavailable</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appointment.appointmentTime}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {appointment.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Confirm
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
                              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      case "appointments":
        navigate('/doctor-appointments');
        return null;
      case "patients":
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Patients</h3>
            <p className="text-gray-600">Patient management interface will be implemented here.</p>
          </div>
        );
      case "profile":
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">My Profile</h3>
            <p className="text-gray-600">Profile management interface will be implemented here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      user={doctor} 
      userType="doctor" 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderTabContent()}
    </Layout>
  );
};

export default DoctorDashboard; 