import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminContext } from '../context/AdminContextDefinition';
import Layout from '../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ManageDoctors = () => {
  const { admin, token } = useContext(AdminContext);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('doctors');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorStats, setDoctorStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    specialties: {},
    newThisMonth: 0
  });

  // API URL
  const API_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:4000";

  const calculateDoctorStats = useCallback((doctorData) => {
    const total = doctorData.length;
    
    // Calculate availability stats
    const active = doctorData.filter(d => d.available).length;
    const inactive = total - active;
    
    // Calculate specialties
    const specialties = {};
    doctorData.forEach(doctor => {
      if (doctor.speciality) {
        if (specialties[doctor.speciality]) {
          specialties[doctor.speciality]++;
        } else {
          specialties[doctor.speciality] = 1;
        }
      }
    });
    
    // Calculate new doctors this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = doctorData.filter(d => {
      try {
        if (d.joinedDate) {
          // Check if the date is in DD-MM-YYYY format
          if (d.joinedDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = d.joinedDate.split('-');
            const joinDate = new Date(`${year}-${month}-${day}`);
            return !isNaN(joinDate.getTime()) && joinDate >= firstDayOfMonth;
          }
          
          // Otherwise, try standard parsing
          const joinDate = new Date(d.joinedDate);
          return !isNaN(joinDate.getTime()) && joinDate >= firstDayOfMonth;
        }
        return false;
      } catch {
        return false;
      }
    }).length;
    
    setDoctorStats({
      total,
      active,
      inactive,
      specialties,
      newThisMonth
    });
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${API_URL}/api/admin/doctors`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doctors');
      }
      
      setDoctors(data.doctors);
      calculateDoctorStats(data.doctors);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch doctors');
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, calculateDoctorStats]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchDoctors();
  }, [token, navigate, fetchDoctors]);

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAvailabilityChange = async (doctorId, newAvailability) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/admin/doctors/${doctorId}/availability`,
        { available: newAvailability },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update doctor availability');
      }
      
      // Update the local state
      const updatedDoctors = doctors.map(doctor => 
        doctor.id === doctorId ? { ...doctor, available: newAvailability } : doctor
      );
      setDoctors(updatedDoctors);
      calculateDoctorStats(updatedDoctors);
      toast.success('Doctor availability updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update doctor availability');
      toast.error(err.response?.data?.message || err.message || 'Failed to update doctor availability');
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    
    try {
      const response = await axios.delete(
        `${API_URL}/api/admin/doctors/${doctorId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete doctor');
      }
      
      // Remove from local state
      const updatedDoctors = doctors.filter(doctor => doctor.id !== doctorId);
      setDoctors(updatedDoctors);
      calculateDoctorStats(updatedDoctors);
      toast.success('Doctor deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete doctor');
      toast.error(err.response?.data?.message || err.message || 'Failed to delete doctor');
    }
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
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

  const ViewDoctorModal = () => {
    if (!selectedDoctor) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Doctor Details</h2>
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
                src={selectedDoctor.image || 'https://via.placeholder.com/150?text=No+Image'} 
                alt={selectedDoctor.name} 
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                }}
              />
              <h3 className="mt-3 text-lg font-medium">{selectedDoctor.name}</h3>
              <p className="text-gray-500 text-sm">Joined: {formatDate(selectedDoctor.joinedDate)}</p>
              <div className="mt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full
                  ${selectedDoctor.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {selectedDoctor.available ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="md:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium break-words">{selectedDoctor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Speciality</p>
                  <p className="font-medium">{selectedDoctor.speciality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{selectedDoctor.experience} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Consultation Fee</p>
                  <p className="font-medium">₹{selectedDoctor.fees}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Degree</p>
                  <p className="font-medium">{selectedDoctor.degree || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {selectedDoctor.address ? (
                      <>
                        {selectedDoctor.address.buildingNumber && `${selectedDoctor.address.buildingNumber}, `}
                        {selectedDoctor.address.streetName && `${selectedDoctor.address.streetName}`}
                        {(selectedDoctor.address.buildingNumber || selectedDoctor.address.streetName) && <br />}
                        {selectedDoctor.address.area && `${selectedDoctor.address.area}`}
                        {selectedDoctor.address.area && <br />}
                        {selectedDoctor.address.landmark && `Near ${selectedDoctor.address.landmark}`}
                        {selectedDoctor.address.landmark && <br />}
                        {selectedDoctor.address.city && `${selectedDoctor.address.city}, `}
                        {selectedDoctor.address.state && `${selectedDoctor.address.state} `}
                        {selectedDoctor.address.pinCode && `${selectedDoctor.address.pinCode}`}
                        {(!selectedDoctor.address.buildingNumber && !selectedDoctor.address.streetName && 
                          !selectedDoctor.address.area && !selectedDoctor.address.city && 
                          !selectedDoctor.address.state && !selectedDoctor.address.pinCode) && 'Not provided'}
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
              </div>

              {selectedDoctor.about && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">About</p>
                  <p className="font-medium">{selectedDoctor.about}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end gap-4">
              <button
                onClick={() => navigate(`/edit-doctor/${selectedDoctor.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Doctor
              </button>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Manage Doctors</h2>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              />
              <div className="absolute left-3 top-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <Link 
              to="/add-doctor" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Doctor
            </Link>
          </div>
        </div>

        {/* Doctor Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-indigo-500 text-xl font-bold">{doctorStats.total}</div>
            <div className="text-gray-500 text-sm">Total Doctors</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-500 text-xl font-bold">{doctorStats.active}</div>
            <div className="text-gray-500 text-sm">Active Doctors</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-500 text-xl font-bold">{doctorStats.inactive}</div>
            <div className="text-gray-500 text-sm">Inactive Doctors</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-500 text-xl font-bold">
              {Object.keys(doctorStats.specialties).length}
            </div>
            <div className="text-gray-500 text-sm">Specialties</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-500 text-xl font-bold">{doctorStats.newThisMonth}</div>
            <div className="text-gray-500 text-sm">New This Month</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'There are no doctors registered in the system yet.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Link
                      to="/add-doctor"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Doctor
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Speciality
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {filteredDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover"
                                src={doctor.image || 'https://via.placeholder.com/150?text=No+Image'}
                                alt={doctor.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Dr. {doctor.name}</div>
                              <div className="text-sm text-gray-500">{doctor.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.speciality}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.experience} years</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={doctor.available ? 'Active' : 'Inactive'}
                            onChange={(e) => handleAvailabilityChange(doctor.id, e.target.value === 'Active')}
                            className={`px-2 py-1 text-xs font-semibold rounded-full
                              ${doctor.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(doctor.joinedDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleViewDoctor(doctor)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => navigate(`/edit-doctor/${doctor.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteDoctor(doctor.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
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
      {showModal && <ViewDoctorModal />}
    </Layout>
  );
};

export default ManageDoctors; 