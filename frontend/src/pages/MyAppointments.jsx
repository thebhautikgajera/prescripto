import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import AppContext from "../context/AppContext";
import ReviewForm from "../components/ReviewForm";
import { toast } from "react-hot-toast";

const MyAppointments = () => {
  const { user, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [downloadingSlip, setDownloadingSlip] = useState(null);
  
  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Helper function to check if a date is in the past
  const isDatePassed = (dateString, timeString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    // If dates are different, simple comparison works
    if (appointmentDate.toDateString() !== today.toDateString()) {
      return appointmentDate < today;
    }
    
    // If it's the same day, we need to compare times
    const [hourStr, minuteStr, period] = timeString.split(/[:\s]/);
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    // Convert to 24-hour format
    if (period && period.toUpperCase() === 'PM' && hour < 12) {
      hour += 12;
    } else if (period && period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    // Set the appointment time
    appointmentDate.setHours(hour, minute, 0, 0);
    
    // Add a buffer time (e.g., 2 hours before appointment)
    const bufferHours = 2;
    const bufferTime = new Date(appointmentDate);
    bufferTime.setHours(bufferTime.getHours() - bufferHours);
    
    // If current time is past the buffer time, consider it as passed
    return today > bufferTime;
  };

  // Helper function to check if an appointment is today
  const isAppointmentToday = (dateString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  };

  // Helper function to check if appointment is upcoming (within next 3 days)
  const isUpcomingAppointment = (dateString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    
    return appointmentDate > today && appointmentDate <= threeDaysLater;
  };

  // Function to download combined receipt
  const downloadAppointmentSlip = async (appointmentId) => {
    try {
      setDownloadingSlip(appointmentId);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please login to download combined receipt");
        navigate("/login?redirect=/my-appointments");
        return;
      }

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
      link.setAttribute('download', `prescripto_appointment.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Appointment receipt downloaded successfully");
    } catch (error) {
      console.error("Error downloading combined receipt:", error);
      toast.error("Failed to download combined receipt. Please try again later.");
    } finally {
      setDownloadingSlip(null);
    }
  };

  useEffect(() => {
    // Check for success message in URL params
    if (searchParams.get("status") === "success") {
      setSuccessMessage("Appointment booked successfully!");
      
      // Clear success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login?redirect=/my-appointments");
        return;
      }
      
      // If we have a token but no user data, try to get user data from localStorage
      if (!user) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Make sure we have a valid user ID before making the API call
            if (!parsedUser || !parsedUser._id) {
              console.error("Invalid user data: missing _id");
              navigate("/login?redirect=/my-appointments");
              return;
            }
            
            // Continue with the stored user data
            const response = await axios.get(
              `${API_URL}/api/appointment/user/${parsedUser._id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            if (response.data.success) {
              setAppointments(response.data.appointments);
            }
            setLoading(false);
            return;
          } catch (err) {
            console.error("Error parsing stored user data:", err);
            // If we can't parse the user data, redirect to login
            navigate("/login?redirect=/my-appointments");
            return;
          }
        } else {
          // No stored user data, redirect to login
          navigate("/login?redirect=/my-appointments");
          return;
        }
      }
      
      // Ensure we have a valid user ID before making the API call
      if (!user || !user._id) {
        console.error("Missing user ID");
        navigate("/login?redirect=/my-appointments");
        return;
      }
      
      const response = await axios.get(
        `${API_URL}/api/appointment/user/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, navigate, API_URL, setUser]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    // If no token, redirect to login
    if (!token) {
      navigate("/login?redirect=/my-appointments");
      return;
    }
    
    // If we have a token but no user in context, try to get user from localStorage
    if (!user && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // fetchAppointments will be called when user is set due to dependency array
      } catch (err) {
        console.error("Error parsing stored user data:", err);
        navigate("/login?redirect=/my-appointments");
      }
    } else {
      // Either we have user in context, or we don't have stored user data
      fetchAppointments();
    }
  }, [user, navigate, fetchAppointments, setUser]);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login?redirect=/my-appointments");
        return;
      }
      
      const response = await axios.patch(
        `${API_URL}/api/appointment/status/${appointmentId}`,
        { status: "cancelled" },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Appointment cancelled successfully");
        fetchAppointments();
      } else {
        toast.error(response.data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handlePayOnline = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login?redirect=/my-appointments");
        return;
      }
      
      // Create order
      const orderResponse = await axios.post(
        `${API_URL}/api/appointment/create-payment/${appointmentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!orderResponse.data.success) {
        setError(orderResponse.data.message || "Failed to create payment order");
        return;
      }
      
      const { order } = orderResponse.data;
      
      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        try {
        const options = {
            key: orderResponse.data.key_id, // Use key_id from the response
          amount: order.amount,
          currency: order.currency,
          name: "Prescripto",
          description: "Doctor Appointment Payment",
          order_id: order.id,
            handler: async (response) => {
            try {
              // Verify payment
              const verifyResponse = await axios.post(
                `${API_URL}/api/appointment/verify-payment`,
                {
                    appointmentId,
                    razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              
              if (verifyResponse.data.success) {
                  toast.success("Payment successful!");
                  fetchAppointments();
              } else {
                  toast.error(verifyResponse.data.message || "Payment verification failed");
              }
              } catch (verifyError) {
                console.error("Error verifying payment:", verifyError);
                toast.error("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || ""
          },
          theme: {
            color: "#3B82F6"
          }
        };
        
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        } catch (err) {
          console.error("Error opening Razorpay:", err);
          setError("Failed to open payment gateway. Please try again later.");
          document.body.removeChild(script);
        }
      };
      
      script.onerror = () => {
        setError("Failed to load payment gateway. Please try again later.");
        document.body.removeChild(script);
      };
      
    } catch (error) {
      console.error("Error initiating payment:", error);
      if (error.response && error.response.status === 503) {
        setError("Payment service is currently unavailable. Please try again later or pay at the clinic.");
      } else {
        setError(error.response?.data?.message || "Failed to initiate payment. Please try again.");
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleReviewClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    fetchAppointments();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">My Appointments</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate("/payment-history")}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            Payment History
          </button>
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
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
      </div>
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 mt-4">No appointments found</h2>
          <p className="text-gray-500 mt-2">You don&apos;t have any appointments scheduled yet.</p>
          <button 
            onClick={() => navigate("/doctors")}
            className="mt-6 bg-primary hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Find a Doctor
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((appointment) => {
            const isPastAppointment = isDatePassed(appointment.appointmentDate, appointment.appointmentTime);
            const isTodayAppointment = isAppointmentToday(appointment.appointmentDate);
            const isUpcoming = isUpcomingAppointment(appointment.appointmentDate);
            
            return (
            <div 
              key={appointment._id} 
              className={`bg-white rounded-xl shadow-md overflow-hidden
                ${isTodayAppointment ? 'border-l-4 border-blue-500' : ''}
                ${isUpcoming && !isTodayAppointment ? 'border-l-4 border-green-500' : ''}
              `}
            >
              {isTodayAppointment && isPastAppointment && (
                <div className="bg-amber-50 px-4 py-2 text-amber-700 text-sm font-medium">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Too Late to Cancel (Within 2 Hours of Appointment)
                  </span>
                </div>
              )}
              {isTodayAppointment && !isPastAppointment && (
                <div className="bg-blue-50 px-4 py-2 text-blue-700 text-sm font-medium">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Today&apos;s Appointment
                  </span>
                </div>
              )}
              
              {isUpcoming && !isTodayAppointment && (
                <div className="bg-green-50 px-4 py-2 text-green-700 text-sm font-medium">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upcoming Appointment
                  </span>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row">
                <div className="w-full flex justify-center items-center p-4 md:p-0 md:w-48">
                  <img
                    className="h-48 w-48 rounded-full object-cover object-center md:rounded-none md:h-48 md:w-48"
                    src={appointment.doctorId.image}
                    alt={`Dr. ${appointment.doctorId.name}`}
                  />
                </div>
                <div className="p-6 w-full">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900">Dr. {appointment.doctorId.name}</h2>
                        {appointment.appointmentId && (
                          <span className="text-sm font-medium text-gray-500 mt-1">
                            Appointment ID: {appointment.appointmentId}
                          </span>
                        )}
                        <p className="text-gray-600 mt-1">{appointment.doctorId.speciality}</p>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                          <span className="text-sm font-medium text-gray-500">Date:</span>
                          <p className="text-gray-800">{formatAppointmentDate(appointment.appointmentDate)}</p>
                          </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Time:</span>
                          <p className="text-gray-800">{appointment.appointmentTime}</p>
                        </div>
                          <div>
                          <span className="text-sm font-medium text-gray-500">Status:</span>
                          <p className={`
                            ${appointment.status === 'confirmed' ? 'text-green-600' : ''}
                            ${appointment.status === 'pending' ? 'text-yellow-600' : ''}
                            ${appointment.status === 'cancelled' ? 'text-red-600' : ''}
                            ${appointment.status === 'completed' ? 'text-blue-600' : ''}
                          `}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </p>
                          </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Payment:</span>
                          <p className={`
                            ${appointment.paymentStatus === 'completed' ? 'text-green-600' : ''}
                            ${appointment.paymentStatus === 'pending' ? 'text-yellow-600' : ''}
                            ${appointment.paymentStatus === 'refunded' ? 'text-red-600' : ''}
                          `}>
                            {appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status messages based on date and status */}
                      {isPastAppointment && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                        <div className="mt-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                          {isTodayAppointment ? 
                            "It's too late to cancel this appointment online (within 2 hours of scheduled time)." :
                            "This appointment date has passed. Please contact the clinic for rescheduling."
                          }
                        </div>
                      )}
                      
                      {isTodayAppointment && !isPastAppointment && appointment.status === 'confirmed' && (
                        <div className="mt-3 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                          Your appointment is today. Please arrive 15 minutes before your scheduled time.
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 md:mt-0 flex flex-col gap-2">
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{appointment.fees}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {/* Allow Pay Online for non-cancelled, pending payment appointments, even if within 2-hour window */}
                        {appointment.status !== "cancelled" && 
                         appointment.paymentStatus === "pending" && 
                         ((!isPastAppointment) || (isPastAppointment && isTodayAppointment)) && (
                          <button 
                            onClick={() => handlePayOnline(appointment._id)}
                            className="text-sm text-center py-2 px-4 border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 rounded"
                          >
                            Pay Online
                          </button>
                        )}
                        
                        {/* Only show Cancel button for non-cancelled, non-completed appointments that are not in the past */}
                        {appointment.status !== "cancelled" && 
                         appointment.status !== "completed" && 
                         !isPastAppointment && (
                          <button 
                            onClick={() => handleCancelAppointment(appointment._id)}
                            className="text-sm text-center py-2 px-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 rounded"
                          >
                            Cancel Appointment
                          </button>
                        )}

                        {/* Show message for past appointments that can't be cancelled */}
                        {isPastAppointment && 
                         appointment.status !== "cancelled" && 
                         appointment.status !== "completed" && (
                          <div className="text-sm text-gray-500 italic">
                            {isTodayAppointment ? 
                              "Cannot cancel within 2 hours of appointment" : 
                              "Past appointments cannot be cancelled online"
                            }
                          </div>
                        )}

                        {/* Only show Write Review for completed appointments */}
                        {appointment.status === "completed" && (
                          <button 
                            onClick={() => handleReviewClick(appointment)}
                            className="text-sm text-center py-2 px-4 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 rounded"
                          >
                            Write a Review
                          </button>
                        )}

                        {/* Download Combined Receipt Button */}
                        <button
                          onClick={() => downloadAppointmentSlip(appointment._id, appointment.appointmentId)}
                          disabled={downloadingSlip === appointment._id}
                          className={`text-sm text-center py-2 px-4 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 rounded ${
                            downloadingSlip === appointment._id 
                              ? 'bg-green-500 text-white cursor-not-allowed' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {downloadingSlip === appointment._id ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </span>
                          ) : (
                            <>
                              Appointment Receipt
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-medium text-gray-700">Notes:</p>
                      <p className="text-gray-600 mt-1">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Review Dr. {selectedAppointment.doctorId.name}
                </h2>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <img 
                    src={selectedAppointment.doctorId.image} 
                    alt={`Dr. ${selectedAppointment.doctorId.name}`} 
                    className="h-12 w-12 rounded-full object-cover mr-3"
                  />
                  <div>
                    <h3 className="font-medium">Dr. {selectedAppointment.doctorId.name}</h3>
                    <p className="text-sm text-gray-500">{selectedAppointment.doctorId.speciality}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mt-2">
                  Appointment on {formatAppointmentDate(selectedAppointment.appointmentDate)} at {selectedAppointment.appointmentTime}
                </div>
              </div>
              
              <ReviewForm 
                doctorId={selectedAppointment.doctorId._id} 
                appointmentId={selectedAppointment._id}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
