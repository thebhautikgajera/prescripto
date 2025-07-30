import React, { useState, useEffect, useContext } from 'react';
import { DoctorContext } from '../context/DoctorContextDefinition';
import Layout from '../components/Layout';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';

const DoctorProfilePage = () => {
  const { doctor, token, fetchProfile } = useContext(DoctorContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    speciality: '',
    degree: '',
    experience: '',
    about: '',
    fees: '',
    address: {
      buildingNumber: '',
      streetName: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      pinCode: ''
    }
  });

  // Initialize form data when doctor data is available
  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        contactNumber: doctor.contactNumber || '',
        speciality: doctor.speciality || '',
        degree: doctor.degree || '',
        experience: doctor.experience || '',
        about: doctor.about || '',
        fees: doctor.fees || '',
        address: {
          buildingNumber: doctor.address?.buildingNumber || '',
          streetName: doctor.address?.streetName || '',
          area: doctor.address?.area || '',
          landmark: doctor.address?.landmark || '',
          city: doctor.address?.city || '',
          state: doctor.address?.state || '',
          pinCode: doctor.address?.pinCode || ''
        }
      });
      
      // Set image preview if doctor has an image
      if (doctor.image) {
        setImagePreview(doctor.image);
      }
    }
  }, [doctor]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (address fields)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API_URL = `${import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000'}/api/doctor`;
      
      // Create form data for multipart/form-data request
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'address') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append image if a new one is selected
      if (profileImage) {
        formDataToSend.append('image', profileImage);
      }
      
      // Send update request
      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showSuccessToast('Profile updated successfully');
        setIsEditing(false);
        fetchProfile(); // Refresh doctor data
      } else {
        showErrorToast(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorToast('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) {
    return (
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="doctor">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Doctor Profile</h1>
          <p>Loading profile information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userType="doctor" user={doctor}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Doctor Profile</h1>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300"
            >
              Edit Profile
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition duration-300"
            >
              Cancel
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 mb-2">
                  <img 
                    src={imagePreview || 'https://via.placeholder.com/150'} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md cursor-pointer text-sm">
                  Change Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
                  <input
                    type="number"
                    name="fees"
                    value={formData.fees}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Professional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Speciality</label>
                <input
                  type="text"
                  name="speciality"
                  value={formData.speciality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            {/* About */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
            </div>
            
            {/* Address */}
            <div>
              <h3 className="text-lg font-medium mb-2">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building Number</label>
                  <input
                    type="text"
                    name="address.buildingNumber"
                    value={formData.address.buildingNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                  <input
                    type="text"
                    name="address.streetName"
                    value={formData.address.streetName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    name="address.area"
                    value={formData.address.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    name="address.landmark"
                    value={formData.address.landmark}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                  <input
                    type="text"
                    name="address.pinCode"
                    value={formData.address.pinCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            {/* Profile Overview */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                  <img 
                    src={doctor.image || 'https://via.placeholder.com/150'} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold">{doctor.name}</h2>
                <p className="text-gray-600">{doctor.speciality} | {doctor.degree}</p>
                <p className="text-gray-600">{doctor.experience} years of experience</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {doctor.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
                <p className="mt-2">
                  <span className="font-medium">Consultation Fee:</span> ₹{doctor.fees}
                </p>
              </div>
            </div>
            
            {/* About */}
            <div>
              <h3 className="text-lg font-medium border-b pb-2 mb-2">About</h3>
              <p className="text-gray-700 whitespace-pre-line">{doctor.about}</p>
            </div>
            
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium border-b pb-2 mb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Email:</span> {doctor.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {doctor.contactNumber}
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div>
              <h3 className="text-lg font-medium border-b pb-2 mb-2">Address</h3>
              <p>
                {doctor.address?.buildingNumber}, {doctor.address?.streetName}, {doctor.address?.area}
                {doctor.address?.landmark && `, Near ${doctor.address?.landmark}`}, {doctor.address?.city}, {doctor.address?.state}, {doctor.address?.pinCode}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DoctorProfilePage; 