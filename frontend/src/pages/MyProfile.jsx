import { useState, useEffect, useContext } from "react";
import { assets } from "../assets/assets";
import AppContext from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const MyProfile = () => {
  const { setUser, refreshUserProfile } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    image: assets.profile_pic,
    email: "",
    phone: "",
    address: {
      buildingNumber: "",
      streetName: "",
      area: "",
      landmark: "",
      city: "",
      state: "",
      pinCode: ""
    },
    gender: "Not Selected",
    bloodGroup: "Not Specified",
    dob: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          toast.error("You must be logged in to view your profile");
          return;
        }
        
        const response = await axios.get(`${API_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          const userProfile = response.data.user;
          setUserData({
            name: userProfile.name || "",
            image: userProfile.image || assets.profile_pic,
            email: userProfile.email || "",
            phone: userProfile.phone || "",
            address: userProfile.address || { buildingNumber: "", streetName: "", area: "", landmark: "", city: "", state: "", pinCode: "" },
            gender: userProfile.gender || "Not Selected",
            bloodGroup: userProfile.bloodGroup || "Not Specified",
            dob: userProfile.dob || "",
          });
        } else {
          toast.error(response.data.message || "Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error(error.response?.data?.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [API_URL]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("You must be logged in to update your profile");
        return;
      }
      
      const formData = new FormData();
      formData.append("name", userData.name);
      formData.append("phone", userData.phone);
      formData.append("gender", userData.gender);
      formData.append("bloodGroup", userData.bloodGroup);
      formData.append("dob", userData.dob);
      
      // Add new address fields
      formData.append("address[buildingNumber]", userData.address?.buildingNumber || "");
      formData.append("address[streetName]", userData.address?.streetName || "");
      formData.append("address[area]", userData.address?.area || "");
      formData.append("address[landmark]", userData.address?.landmark || "");
      formData.append("address[city]", userData.address?.city || "");
      formData.append("address[state]", userData.address?.state || "");
      formData.append("address[pinCode]", userData.address?.pinCode || "");
      
      if (imageFile) {
        formData.append("image", imageFile);
      }
      
      const response = await axios.put(`${API_URL}/api/user/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (response.data.success) {
        toast.success("Profile updated successfully");
        setIsEdit(false);
        
        // Update local user data
        if (response.data.user) {
          setUserData(prev => ({
            ...prev,
            ...response.data.user,
            image: response.data.user.image || prev.image
          }));
          
          // Update user in context and refresh user data from server
          setUser(response.data.user);
          
          // Use the refreshUserProfile function to get fresh user data
          refreshUserProfile();
          
          // Clear the image file and preview
          setImageFile(null);
          if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
          }
        }
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        
        {isEdit ? (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEdit(false)}
              className="border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEdit(true)}
            className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Profile Photo Card */}
        <div className="md:col-span-1">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50">
                <img 
                  src={imagePreview || userData.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = assets.profile_pic;
                  }}
                />
              </div>
              {isEdit && (
                <div className="absolute bottom-2 right-2">
                  <label htmlFor="profile-image" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                  <input 
                    type="file" 
                    id="profile-image" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              )}
            </div>

            {isEdit ? (
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full text-xl font-semibold text-center border border-gray-300 rounded-lg p-2 mb-2"
                placeholder="Your Name"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-800 mb-1">{userData.name}</h2>
            )}
            
            <div className="flex items-center gap-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {userData.email}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="md:col-span-3">
          {/* Contact Information */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {userData.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                  {isEdit ? (
                    <input
                      type="text"
                      value={userData.phone}
                      onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-3"
                      placeholder="Your phone number"
                    />
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {userData.phone || "Not provided"}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                {isEdit ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={userData.address?.buildingNumber || ""}
                          onChange={(e) => setUserData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, buildingNumber: e.target.value } 
                          }))}
                          placeholder="Building Number"
                          className="w-full border border-gray-300 rounded-lg p-3"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={userData.address?.streetName || ""}
                          onChange={(e) => setUserData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, streetName: e.target.value } 
                          }))}
                          placeholder="Street Name"
                          className="w-full border border-gray-300 rounded-lg p-3"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={userData.address?.area || ""}
                      onChange={(e) => setUserData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, area: e.target.value } 
                      }))}
                      placeholder="Area"
                      className="w-full border border-gray-300 rounded-lg p-3"
                    />
                    <input
                      type="text"
                      value={userData.address?.landmark || ""}
                      onChange={(e) => setUserData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, landmark: e.target.value } 
                      }))}
                      placeholder="Landmark (Optional)"
                      className="w-full border border-gray-300 rounded-lg p-3"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={userData.address?.city || ""}
                          onChange={(e) => setUserData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, city: e.target.value } 
                          }))}
                          placeholder="City"
                          className="w-full border border-gray-300 rounded-lg p-3"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={userData.address?.state || ""}
                          onChange={(e) => setUserData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, state: e.target.value } 
                          }))}
                          placeholder="State"
                          className="w-full border border-gray-300 rounded-lg p-3"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={userData.address?.pinCode || ""}
                      onChange={(e) => setUserData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, pinCode: e.target.value } 
                      }))}
                      placeholder="PIN Code"
                      className="w-full border border-gray-300 rounded-lg p-3"
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {userData.address?.buildingNumber || userData.address?.streetName || userData.address?.area || 
                     userData.address?.city || userData.address?.state || userData.address?.pinCode ? (
                      <>
                        {userData.address.buildingNumber && `${userData.address.buildingNumber}, `}
                        {userData.address.streetName && `${userData.address.streetName}`}
                        {(userData.address.buildingNumber || userData.address.streetName) && <br />}
                        
                        {userData.address.area && `${userData.address.area}`}
                        {userData.address.area && <br />}
                        
                        {userData.address.landmark && `Near ${userData.address.landmark}`}
                        {userData.address.landmark && <br />}
                        
                        {userData.address.city && `${userData.address.city}, `}
                        {userData.address.state && `${userData.address.state} `}
                        {userData.address.pinCode && `${userData.address.pinCode}`}
                      </>
                    ) : (
                      <p>Not provided</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                {isEdit ? (
                  <select
                    value={userData.gender}
                    onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  >
                    <option value="Not Selected">Not Selected</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {userData.gender}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                {isEdit ? (
                  <input
                    type="date"
                    value={userData.dob}
                    onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  />
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {userData.dob || "Not provided"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Blood Group</label>
                {isEdit ? (
                  <select
                    value={userData.bloodGroup}
                    onChange={(e) => setUserData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  >
                    <option value="Not Specified">Not Specified</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {userData.bloodGroup}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
