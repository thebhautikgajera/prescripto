import { useState, useContext, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AppContext from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import DoctorReviews from "../components/DoctorReviews";
import StarRating from "../components/StarRating";

const Appointment = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { doctors, currencySymbol, user, isAuthenticated } = useContext(AppContext);

  const [docInfo, setDocInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const fetchDocInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to find the doctor in the context
      if (doctors && doctors.length > 0) {
        const foundDoc = doctors.find((doc) => doc._id === docId);
        if (foundDoc) {
          setDocInfo(foundDoc);
          setLoading(false);
          return;
        }
      }
      
      // If not found in context, fetch directly from the API by ID
      try {
        const response = await axios.get(`${API_URL}/api/doctor/${docId}`);
        if (response.data.success) {
          setDocInfo(response.data.doctor);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error("Error fetching doctor by ID:", apiError);
        
        // If specific doctor endpoint fails, try the all doctors endpoint
        try {
          const allResponse = await axios.get(`${API_URL}/api/doctor/all`);
          if (allResponse.data.success) {
            const foundDoc = allResponse.data.doctors.find(doc => doc._id === docId);
            if (foundDoc) {
              setDocInfo(foundDoc);
              setLoading(false);
              return;
            }
          }
        } catch (allApiError) {
          console.error("Error fetching all doctors:", allApiError);
        }
        
        // If all API calls fail, set error
        setError("Doctor not found. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching doctor info:", err);
      setError("Failed to load doctor information");
    } finally {
      setLoading(false);
    }
  }, [doctors, docId, API_URL]);

  // Format address from the new address structure
  const formatAddress = (address) => {
    if (!address) return "Address not available";
    
    const addressParts = [];
    
    // Add building number and street name
    if (address.buildingNumber || address.streetName) {
      const buildingStreet = [address.buildingNumber, address.streetName]
        .filter(Boolean)
        .join(", ");
      if (buildingStreet) addressParts.push(buildingStreet);
    }
    
    // Add area
    if (address.area) addressParts.push(address.area);
    
    // Add landmark if available
    if (address.landmark) addressParts.push(`Near ${address.landmark}`);
    
    // Add city, state and pincode
    if (address.city || address.state || address.pinCode) {
      const cityStatePincode = [address.city, address.state, address.pinCode]
        .filter(Boolean)
        .join(", ");
      if (cityStatePincode) addressParts.push(cityStatePincode);
    }
    
    // Handle legacy address format
    if (address.line1) addressParts.push(address.line1);
    if (address.line2) addressParts.push(address.line2);
    
    return addressParts.length > 0 ? addressParts : ["Address not available"];
  };

  useEffect(() => {
    fetchDocInfo();
  }, [fetchDocInfo]);

  const handleBookAppointment = () => {
    // Navigate to book appointment page
    navigate(`/book-appointment/${docId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">We couldn&apos;t find the doctor you&apos;re looking for.</p>
          <button 
            onClick={() => navigate('/doctors')}
            className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Browse All Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    docInfo && (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isAuthenticated && user ? `Hello, ${user.name}` : "Doctor Appointment"}
          </h1>
          <button 
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors text-sm sm:text-base"
          >
            Back
          </button>
        </div>

        {/* Doctor Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Doctor Image */}
            <div className="md:flex-shrink-0 relative">
              <div className="relative pb-[125%] md:pb-0 md:w-64">
                <img
                  className="absolute inset-0 w-full h-full object-contain bg-gray-50 md:relative md:object-cover"
                  src={docInfo.image}
                  alt={`Dr. ${docInfo.name}`}
                />
              </div>
              <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full">
                Available
              </div>
            </div>
            
            {/* Doctor Info */}
            <div className="p-5 md:p-8 w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                {/* Doctor Name and Credentials */}
                <div>
                  <div className="flex items-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{docInfo.name}</h2>
                    <img
                      className="w-5 h-5 ml-2"
                      src={assets.verified_icon}
                      alt="Verified"
                    />
                  </div>
                  <div className="flex flex-wrap items-center mt-1 space-x-2">
                    <span className="text-gray-700 text-sm">{docInfo.degree}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-700 text-sm">{docInfo.speciality}</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <StarRating rating={docInfo.averageRating || 0} size="medium" showNumber={true} />
                    <span className="text-gray-500 text-sm ml-2">
                      ({docInfo.reviewsCount || 0} reviews)
                    </span>
                  </div>
                  <span className="inline-block bg-blue-50 text-primary text-xs px-2 py-1 rounded-full mt-2">
                    {docInfo.experience} Years Experience
                  </span>
                </div>
                
                {/* Consultation Fee */}
                <div className="mt-4 sm:mt-0 sm:text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {currencySymbol || "₹"}{docInfo.fees}
                  </div>
                  <div className="text-sm text-gray-500">Consultation Fee</div>
                </div>
              </div>

              {/* About Doctor */}
              <div className="mt-5">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                  About
                  <img src={assets.info_icon} alt="Info" className="w-4 h-4 ml-1" />
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed text-sm">
                  {docInfo.about}
                </p>
              </div>

              {/* Contact and Address */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Address</h3>
                  <div className="mt-1 text-gray-600 text-sm">
                    {formatAddress(docInfo.address).map((line, index) => (
                      <p key={index} className="mb-0.5">{line}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Contact</h3>
                  <p className="mt-1 text-gray-600 text-sm">{docInfo.contactNumber || "Contact not available"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-4">
              Ready to consult with Dr. {docInfo.name}?
            </h3>
            <button 
              onClick={handleBookAppointment}
              className="bg-primary hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 flex items-center justify-center mx-auto shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Book Appointment
            </button>
            <p className="mt-3 text-gray-500 text-sm">Consultation fee: {currencySymbol || "₹"}{docInfo.fees}</p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-8 mb-6">
          <DoctorReviews doctorId={docId} />
        </div>

        {/* Related Doctors Section */}
        <div className="mt-8">
          <RelatedDoctors 
            currentDoctorId={docId} 
            speciality={docInfo.speciality} 
          />
        </div>
      </div>
    )
  );
};

export default Appointment;
