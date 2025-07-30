import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import StarRating from '../components/StarRating';
import DoctorReviews from '../components/DoctorReviews';
import SymptomHistory from '../components/SymptomHistory';

// Debounce utility function to prevent rapid successive API calls
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' or 'history'
  const [language, setLanguage] = useState('english'); // Default language
  const [errorType, setErrorType] = useState(null); // To track specific error types: 'rateLimit', 'network', 'auth', 'server'
  const [apiStatus, setApiStatus] = useState({ checked: false, available: true });



  // Function to check if the API is available
  const checkApiStatus = async () => {
    if (apiStatus.checked) {
      return apiStatus.available;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Make a lightweight request to check if the server is responding
      await axios.get(
        `${import.meta.env.VITE_API_URL}/api/health/auth`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000 // 5 second timeout
        }
      );
      
      setApiStatus({ checked: true, available: true });
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus({ checked: true, available: false });
      
      // Set appropriate error type based on the error
      if (!error.response) {
        setErrorType('network');
      } else if (error.response.status >= 500) {
        setErrorType('server');
      } else if (error.response.status === 401 || error.response.status === 403) {
        setErrorType('auth');
      }
      
      return false;
    }
  };

  // Define the core submit function that will be debounced
  const submitSymptoms = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter your symptoms');
      return;
    }

    setLoading(true);
    setAnalysis('');
    setSuggestedDoctors([]);
    setErrorType(null); // Reset error type

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You must be logged in to use this feature');
        setLoading(false);
        return;
      }
      
      // Check if API is available before making the request
      const isApiAvailable = await checkApiStatus();
      if (!isApiAvailable) {
        // Error type and toast already set in checkApiStatus
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/symptom-checker`,
        { symptoms, language },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setSuggestedDoctors(response.data.suggestedDoctors || []);
        // Reset API status check after successful request
        setApiStatus({ checked: true, available: true });
      } else {
        toast.error(response.data.message || 'Failed to analyze symptoms');
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      
      // Use the errorType from the backend if available, otherwise determine it based on response
      if (!error.response) {
        // Network error - no response from server
        setErrorType('network');
        toast.error(
          'Network error. Please check your internet connection and try again.',
          { autoClose: 5000 }
        );
      } else {
        // Server responded with an error
        const errorMessage = error.response.data?.message || 'An error occurred while analyzing symptoms';
        const backendErrorType = error.response.data?.errorType;
        
        if (backendErrorType) {
          // Use the error type provided by the backend
          setErrorType(backendErrorType);
          
          // Set appropriate toast message based on error type
          if (backendErrorType === 'rateLimit') {
            toast.error(
              'Too many requests. The AI service is currently experiencing high demand. Please wait a few minutes and try again.',
              { autoClose: 7000 } // Show this message longer
            );
          } else if (backendErrorType === 'timeout') {
            toast.error(
              'The AI service request timed out. Please try again later.',
              { autoClose: 5000 }
            );
          } else {
            toast.error(errorMessage, { autoClose: 5000 });
          }
        } else {
          // Fallback to determining error type based on status code
          const status = error.response.status;
          
          if (status === 429) {
            // Rate limit error
            setErrorType('rateLimit');
            toast.error(
              'Too many requests. The AI service is currently experiencing high demand. Please wait a few minutes and try again.',
              { autoClose: 7000 } // Show this message longer
            );
          } else if (status === 401 || status === 403) {
            // Authentication/authorization error
            setErrorType('auth');
            toast.error(errorMessage, { autoClose: 5000 });
          } else if (status >= 500) {
            // Server error
            setErrorType('server');
            toast.error(errorMessage, { autoClose: 5000 });
          } else {
            // Other errors
            toast.error(errorMessage, { autoClose: 5000 });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Create a debounced version of the submit function (300ms delay)
  const debouncedSubmit = useDebounce(submitSymptoms, 300);
  
  // Handle form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    debouncedSubmit();
  };
  
  // Function to retry after error
  const handleRetry = () => {
    setErrorType(null);
    setApiStatus({ checked: false, available: true }); // Reset API status check
    submitSymptoms(); // Use the non-debounced version for immediate retry
  };

  const handleBookAppointment = (doctorId) => {
    window.location.href = `/appointment/${doctorId}`;
  };

  const handleViewReviews = (doctorId) => {
    setSelectedDoctorId(doctorId);
    setShowReviews(true);
  };

  const handleCloseReviews = () => {
    setShowReviews(false);
    setSelectedDoctorId(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">AI Symptom Checker</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        <p className="text-blue-800">
          <span className="font-semibold">Note:</span> This tool provides general guidance based on your symptoms and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'checker' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('checker')}
        >
          Check Symptoms
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('history')}
        >
          Symptom History
        </button>
      </div>

      {activeTab === 'checker' ? (
        <>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {errorType && (
            <div className={`mb-6 p-4 rounded-md ${
              {
                rateLimit: 'bg-yellow-50 border border-yellow-200',
                network: 'bg-red-50 border border-red-200',
                auth: 'bg-orange-50 border border-orange-200',
                server: 'bg-red-50 border border-red-200',
                timeout: 'bg-purple-50 border border-purple-200',
                serviceUnavailable: 'bg-red-50 border border-red-200'
            }[errorType]}`}>
              <h3 className={`text-lg font-medium mb-2 ${{
                rateLimit: 'text-yellow-800',
                network: 'text-red-800',
                auth: 'text-orange-800',
                server: 'text-red-800',
                timeout: 'text-purple-800',
                serviceUnavailable: 'text-red-800'
              }[errorType]}`}>
                {{
                  rateLimit: 'Rate Limit Exceeded',
                  network: 'Network Error',
                  auth: 'Authentication Error',
                  server: 'Server Error',
                  timeout: 'Request Timeout',
                  serviceUnavailable: 'Service Unavailable'
                }[errorType]}
              </h3>
              <p className={`mb-4 ${{
                rateLimit: 'text-yellow-700',
                network: 'text-red-700',
                auth: 'text-orange-700',
                server: 'text-red-700',
                timeout: 'text-purple-700',
                serviceUnavailable: 'text-red-700'
              }[errorType]}`}>
                {{
                  rateLimit: 'The AI service is currently experiencing high demand. Please wait a few minutes before trying again.',
                  network: 'Unable to connect to the server. Please check your internet connection and try again.',
                  auth: 'Your session may have expired. Please try logging out and logging back in.',
                  server: 'The server is experiencing issues. Our team has been notified and is working on a fix.',
                  timeout: 'The AI service took too long to respond. This usually happens during high traffic periods.',
                  serviceUnavailable: 'The AI service is temporarily unavailable. Please try again later.'
                }[errorType]}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleRetry}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${{
                    rateLimit: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
                    network: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    auth: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
                    server: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    timeout: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
                    serviceUnavailable: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }[errorType]}`}
                >
                  Retry Now
                </button>
                {errorType === 'auth' && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.href = '/login';
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Log Out
                  </button>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="symptoms" className="block text-gray-700 font-medium mb-2">
              Describe your symptoms
            </label>
            <textarea
              id="symptoms"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Example: I've had a sore throat and fever for 3 days with fatigue."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="language" className="block text-gray-700 font-medium mb-2">
              Preferred language for analysis
            </label>
            <select
              id="language"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            >
              <option value="english">English</option>
              <option value="gujarati">Gujarati</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>

          <button
            type="submit"
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze Symptoms'
            )}
          </button>
        </form>
      </div>

      {analysis && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Analysis</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-700 whitespace-pre-line">{analysis}</p>
          </div>
        </div>
      )}

      {suggestedDoctors.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Suggested Doctors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedDoctors.map((doctor) => (
              <div key={doctor._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <img
                      src={doctor.image || 'https://via.placeholder.com/150'}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{doctor.name}</h3>
                      <p className="text-gray-600">{doctor.speciality}</p>
                      <div className="mt-1 flex items-center">
                        <StarRating rating={doctor.averageRating || 0} />
                        <span className="text-sm text-gray-500 ml-2">
                          ({doctor.reviewsCount || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <span>{doctor.experience} years exp.</span>
                    <span>₹{doctor.fees}/consultation</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => handleViewReviews(doctor._id)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                    >
                      View Reviews
                    </button>
                  </div>
                  <button
                    onClick={() => handleBookAppointment(doctor._id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Symptom Check History</h2>
          <SymptomHistory />
        </div>
      )}

      {/* Reviews Modal */}
      {showReviews && selectedDoctorId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Doctor Reviews</h3>
                <button 
                  onClick={handleCloseReviews}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DoctorReviews doctorId={selectedDoctorId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;