import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { AdminContext } from '../context/AdminContextDefinition';
import { format } from 'date-fns';

const PatientsPage = () => {
  const { admin, token } = useContext(AdminContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [patientStats, setPatientStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    other: 0,
    newThisMonth: 0
  });

  // API URL
  const API_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:4000";

  const calculatePatientStats = useCallback((patientData) => {
    const total = patientData.length;
    
    // Calculate gender stats
    const male = patientData.filter(p => p.gender?.toLowerCase() === 'male').length;
    const female = patientData.filter(p => p.gender?.toLowerCase() === 'female').length;
    const other = total - male - female;
    
    // Calculate new patients this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = patientData.filter(p => {
      try {
        if (p.joinedDate) {
          // Check if the date is in DD-MM-YYYY format
          if (p.joinedDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = p.joinedDate.split('-');
            const joinDate = new Date(`${year}-${month}-${day}`);
            return !isNaN(joinDate.getTime()) && joinDate >= firstDayOfMonth;
          }
          
          // Otherwise, try standard parsing
          const joinDate = new Date(p.joinedDate);
          return !isNaN(joinDate.getTime()) && joinDate >= firstDayOfMonth;
        }
        return false;
      } catch {
        return false;
      }
    }).length;
    
    setPatientStats({
      total,
      male,
      female,
      other,
      newThisMonth
    });
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/patients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const patientData = response.data.patients || [];
        setPatients(patientData);
        calculatePatientStats(patientData);
      } else {
        toast.error(response.data.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, calculatePatientStats]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchPatients();
  }, [token, navigate, fetchPatients]);

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.phone && patient.phone.includes(searchTerm))
  );

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedPatient(null);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "Not provided") return "Not provided";
    try {
      // Check if the date is in DD-MM-YYYY format
      if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateString.split('-');
        return format(new Date(`${year}-${month}-${day}`), 'dd MMMM, yyyy');
      }
      
      // Otherwise, try standard parsing
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, 'dd MMMM, yyyy');
      }
      
      return dateString; // Return original if parsing fails
    } catch {
      return dateString;
    }
  };

  const ViewPatientModal = () => {
    if (!selectedPatient) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Patient Details</h2>
            <button 
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex flex-col items-center">
              <img 
                src={selectedPatient.image || 'https://via.placeholder.com/150?text=No+Image'} 
                alt={selectedPatient.name} 
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                }}
              />
              <h3 className="mt-3 text-lg font-medium">{selectedPatient.name}</h3>
              <p className="text-gray-500 text-sm">Joined: {formatDate(selectedPatient.joinedDate)}</p>
              <div className="mt-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Patient
                </span>
              </div>
            </div>

            <div className="md:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium break-words">{selectedPatient.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedPatient.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{selectedPatient.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{selectedPatient.dob || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Group</p>
                  <p className="font-medium">{selectedPatient.bloodGroup || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {selectedPatient.address ? (
                      <>
                        {selectedPatient.address.buildingNumber && `${selectedPatient.address.buildingNumber}, `}
                        {selectedPatient.address.streetName && `${selectedPatient.address.streetName}`}
                        {(selectedPatient.address.buildingNumber || selectedPatient.address.streetName) && <br />}
                        
                        {selectedPatient.address.area && `${selectedPatient.address.area}`}
                        {selectedPatient.address.area && <br />}
                        
                        {selectedPatient.address.landmark && `Near ${selectedPatient.address.landmark}`}
                        {selectedPatient.address.landmark && <br />}
                        
                        {selectedPatient.address.city && `${selectedPatient.address.city}, `}
                        {selectedPatient.address.state && `${selectedPatient.address.state} `}
                        {selectedPatient.address.pinCode && `${selectedPatient.address.pinCode}`}
                        
                        {(!selectedPatient.address.buildingNumber && !selectedPatient.address.streetName && 
                          !selectedPatient.address.area && !selectedPatient.address.city && 
                          !selectedPatient.address.state && !selectedPatient.address.pinCode) && 'Not provided'}
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
              </div>

              {selectedPatient.medicalHistory && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Medical History</p>
                  <p className="font-medium">{selectedPatient.medicalHistory}</p>
                </div>
              )}
              
              {selectedPatient.allergies && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Allergies</p>
                  <p className="font-medium">{selectedPatient.allergies}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-2">Patient History</h4>
            <p className="text-gray-500 text-sm">
              Appointment history and medical records would be displayed here.
            </p>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="p-8 bg-white shadow-lg rounded-lg">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={admin} 
      userType="admin" 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Manage Patients</h2>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
            />
            <div className="absolute left-3 top-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Patient Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-indigo-500 text-xl font-bold">{patientStats.total}</div>
            <div className="text-gray-500 text-sm">Total Patients</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-500 text-xl font-bold">{patientStats.male}</div>
            <div className="text-gray-500 text-sm">Male Patients</div>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="text-pink-500 text-xl font-bold">{patientStats.female}</div>
            <div className="text-gray-500 text-sm">Female Patients</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-500 text-xl font-bold">{patientStats.other}</div>
            <div className="text-gray-500 text-sm">Other/Not Specified</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-500 text-xl font-bold">{patientStats.newThisMonth}</div>
            <div className="text-gray-500 text-sm">New This Month</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No patients found</h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'There are no patients registered in the system yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover"
                                src={patient.image || 'https://via.placeholder.com/150?text=No+Image'}
                                alt={patient.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                              <div className="text-sm text-gray-500">{patient.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.gender}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(patient.joinedDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      {isViewModalOpen && <ViewPatientModal />}
    </Layout>
  );
};

export default PatientsPage; 