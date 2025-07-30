import React, { useState, useEffect, useContext, useCallback } from 'react';
import { DoctorContext } from '../context/DoctorContextDefinition';
import Layout from '../components/Layout';

const DoctorPatientsPage = () => {
  const [activeTab, setActiveTab] = useState("patients");
  const { token, doctor, fetchProfile } = useContext(DoctorContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000';

  // Use useCallback to memoize the fetchPatients function
  const fetchPatients = useCallback(async () => {
    if (!token || !doctor || !doctor._id) return;
    
    setLoading(true);
    try {
      // First, get all appointments for this doctor
      const appointmentsResponse = await fetch(`${API_URL}/api/appointment/doctor/${doctor._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const appointmentsData = await appointmentsResponse.json();
      
      if (appointmentsData.success) {
        // Extract unique patients from appointments
        const uniquePatients = {};
        
        appointmentsData.appointments.forEach(appointment => {
          if (appointment.userId && appointment.userId._id) {
            uniquePatients[appointment.userId._id] = appointment.userId;
          }
        });
        
        // Convert to array
        const patientsList = Object.values(uniquePatients);
        
        setPatients(patientsList);
      } else {
        setError(appointmentsData.message || 'Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, doctor, API_URL]);

  // Fetch profile only once when component mounts
  useEffect(() => {
    if (token && !doctor) {
      fetchProfile();
    }
  }, [token, doctor, fetchProfile]);

  // Fetch patients when doctor data is available
  useEffect(() => {
    if (doctor && doctor._id) {
      fetchPatients();
    }
  }, [doctor, fetchPatients]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  // Filter patients based on search term
  const filteredPatients = searchTerm 
    ? patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : patients;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="doctor" user={doctor}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">My Patients</h1>
          {doctor && (
            <button 
              onClick={handleRefresh}
              disabled={loading || refreshing || !doctor}
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
          )}
        </div>
        
        {!doctor ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading doctor data...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading patients...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                {error}
                <button 
                  className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  onClick={fetchPatients}
                >
                  Retry
                </button>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No patients match your search.' : 'No patients found.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => (
                  <div key={patient._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 flex items-start">
                      <div className="mr-4">
                        {patient.image ? (
                          <img 
                            src={patient.image} 
                            alt={patient.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 text-xl font-medium">
                              {patient.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                        {patient.phone && (
                          <p className="text-sm text-gray-500">{patient.phone}</p>
                        )}
                        {patient.gender && (
                          <p className="text-sm text-gray-500">
                            Gender: {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t">
                      <button className="text-sm text-indigo-600 hover:text-indigo-800">
                        View Medical History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default DoctorPatientsPage; 