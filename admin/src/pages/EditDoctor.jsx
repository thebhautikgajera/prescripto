import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminContext } from '../context/AdminContextDefinition';
import Layout from '../components/Layout';
import axios from 'axios';

const EditDoctor = () => {
  const { admin, token } = useContext(AdminContext);
  const navigate = useNavigate();
  const { id } = useParams(); // Get doctor ID from URL
  const [activeTab, setActiveTab] = useState('doctors');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
    },
    image: null
  });

  const specialities = [
    'General Physician',
    'Gynecologist',
    'Dermatologist',
    'Pediatricians',
    'Neurologist',
    'Gastroenterologist'
  ];

  // Fetch doctor data when component mounts
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setFetchLoading(true);
        setError(null);
        
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URI}/api/admin/doctors/${id}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        const { data } = response;
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch doctor');
        }
        
        const doctor = data.doctor;
        
        // Set form data
        setFormData({
          name: doctor.name || '',
          email: doctor.email || '',
          password: '', // Password field is empty by default for security
          contactNumber: doctor.contactNumber || '',
          speciality: doctor.speciality || '',
          degree: doctor.degree || '',
          experience: doctor.experience || '',
          about: doctor.about || '',
          fees: doctor.fees?.toString() || '',
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
        
        // Set image preview
        if (doctor.image) {
          setImagePreview(doctor.image);
        }
        
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch doctor');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id && token) {
      fetchDoctor();
    }
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation for Experience and Fees fields to only allow numbers
    if ((name === 'experience' || name === 'fees') && value !== '') {
      // Only allow numbers and decimal point for fees
      if (!/^\d*\.?\d*$/.test(value)) {
        return; // Reject the input if it's not a number
      }
    }
    
    // Validation for zip code
    if (name === 'address.pinCode' && value !== '') {
      // Only allow numbers and hyphens for zip code
      if (!/^[0-9-]*$/.test(value)) {
        return; // Reject the input if it contains invalid characters
      }
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'address') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'image' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== 'image') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Make the actual API call using axios
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URI}/api/admin/doctors/${id}`, 
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update doctor');
      }
      
      setSuccess('Doctor updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/manage-doctors');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

  if (fetchLoading) {
    return (
      <Layout 
        user={admin} 
        userType="admin" 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      >
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading doctor data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={admin} 
      userType="admin" 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/manage-doctors')}
              className="mr-3 p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-800">Edit Doctor</h3>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-4 rounded">
            <p>{success}</p>
          </div>
        )}
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Doctor Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor Image
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      {imagePreview ? (
                        <img 
                          className="h-32 w-32 object-cover rounded-full" 
                          src={imagePreview} 
                          alt="Doctor preview" 
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input 
                          id="image-upload" 
                          name="image" 
                          type="file" 
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 2MB</p>
                </div>
                
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                    placeholder="e.g. +91 9876543210"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave empty to keep current password"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Leave empty to keep the current password</p>
                </div>
                
                {/* Speciality */}
                <div>
                  <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-1">
                    Speciality
                  </label>
                  <select
                    id="speciality"
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Speciality</option>
                    {specialities.map((speciality) => (
                      <option key={speciality} value={speciality}>{speciality}</option>
                    ))}
                  </select>
                </div>
                
                {/* Degree */}
                <div>
                  <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
                    Degree/Qualification
                  </label>
                  <input
                    type="text"
                    id="degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                    placeholder="e.g. MBBS, MD, MS"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Experience */}
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 5 years"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* Fees */}
                <div>
                  <label htmlFor="fees" className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fees (₹)
                  </label>
                  <input
                    type="text"
                    id="fees"
                    name="fees"
                    value={formData.fees}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 50"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* About */}
                <div>
                  <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
                    About/Bio
                  </label>
                  <textarea
                    id="about"
                    name="about"
                    rows="4"
                    value={formData.about}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
                
                {/* Address */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Address Information</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="buildingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Building Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="buildingNumber"
                        name="address.buildingNumber"
                        value={formData.address.buildingNumber}
                        onChange={handleChange}
                        required
                        placeholder="123"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-1">
                        Street Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="streetName"
                        name="address.streetName"
                        value={formData.address.streetName}
                        onChange={handleChange}
                        required
                        placeholder="Medical Center Blvd"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                      Area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="area"
                      name="address.area"
                      value={formData.address.area}
                      onChange={handleChange}
                      required
                      placeholder="Downtown"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      id="landmark"
                      name="address.landmark"
                      value={formData.address.landmark}
                      onChange={handleChange}
                      placeholder="Near Central Park"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        required
                        placeholder="New York"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                        required
                        placeholder="NY"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-1">
                      PIN/Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="pinCode"
                      name="address.pinCode"
                      value={formData.address.pinCode}
                      onChange={handleChange}
                      required
                      placeholder="10001"
                      maxLength="10"
                      pattern="[0-9]{5,6}(-[0-9]{4})?"
                      title="Five or six digit PIN code, or followed by hyphen and four digits"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: 123456 or 12345-6789</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/manage-doctors')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Updating Doctor...' : 'Update Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditDoctor; 