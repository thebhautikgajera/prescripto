import { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AppContext from "../context/AppContext";
import { assets } from "../assets/assets";

const BookAppointment = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { user, doctors, isAuthenticated } = useContext(AppContext);
  
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [paymentOption, setPaymentOption] = useState("later"); // "now" or "later"
  const [loadingDates, setLoadingDates] = useState(true);
  
  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const fetchDoctorDetails = useCallback(async () => {
    try {
      // First try to find doctor in context
      if (doctors && doctors.length > 0) {
        const foundDoc = doctors.find(doc => doc._id === docId);
        if (foundDoc) {
          setDoctor(foundDoc);
          return;
        }
      }
      
      // If not found in context, fetch from API
      const response = await axios.get(`${API_URL}/api/doctor/${docId}`);
      if (response.data.success) {
        setDoctor(response.data.doctor);
      }
    } catch (error) {
      console.error("Error fetching doctor details:", error);
      setError("Failed to load doctor information. Please try again later.");
    }
  }, [docId, doctors, API_URL]);

  // Function to check if a time slot is available for a specific date
  const isTimeSlotAvailable = useCallback((date, timeSlot) => {
    if (!doctor || !doctor.slots_booked) return true;
    
    const dateKey = date.toISOString().split('T')[0];
    const bookedSlots = doctor.slots_booked[dateKey] || [];
    
    return !bookedSlots.includes(timeSlot);
  }, [doctor]);

  // Function to get all available time slots for a date
  const getAvailableTimeSlots = useCallback((date) => {
    const slots = [];
    const currentDate = new Date();
    
    // Start time: 9:00 AM
    let startHour = 9;
    let startMinute = 0;
    
    // If selected date is today, start from next available slot
    if (date.toDateString() === currentDate.toDateString()) {
      const currentHour = currentDate.getHours();
      
      if (currentHour >= 9) {
        startHour = currentHour + 1; // Start from next hour
        startMinute = 0;
      }
    }
    
    // Generate slots from start time to 6:00 PM
    for (let hour = startHour; hour <= 18; hour++) {
      for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) continue; // Don't go past 6:00 PM
        
        const timeString = `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
        
        // Only add the slot if it's available
        if (isTimeSlotAvailable(date, timeString)) {
          slots.push(timeString);
        }
      }
    }
    
    return slots;
  }, [isTimeSlotAvailable]);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedTime("");
    
    const slots = getAvailableTimeSlots(date);
    setAvailableTimeSlots(slots);
  }, [getAvailableTimeSlots]);

  const generateAvailableDates = useCallback(async () => {
    setLoadingDates(true);
    const dates = [];
    const today = new Date();
    const potentialDates = [];
    
    // Generate potential dates for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      potentialDates.push(date);
    }
    
    // Check each date for available slots
    for (const date of potentialDates) {
      const slots = getAvailableTimeSlots(date);
      if (slots.length > 0) {
        dates.push(date);
      }
    }
    
    setAvailableDates(dates);
    setLoadingDates(false);
    
    // Select the first available date if there is one
    if (dates.length > 0) {
      handleDateSelect(dates[0]);
    } else {
      setError("No available appointment slots found for this doctor in the next 7 days.");
    }
  }, [handleDateSelect, getAvailableTimeSlots]);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login?redirect=/book-appointment/" + docId);
      return;
    }
    
    fetchDoctorDetails();
  }, [docId, user, navigate, fetchDoctorDetails]);

  // Generate available dates after doctor details are loaded
  useEffect(() => {
    if (doctor) {
      generateAvailableDates();
    }
  }, [doctor, generateAvailableDates]);

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = async () => {
    if (!user) {
      navigate("/login?redirect=/book-appointment/" + docId);
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time for your appointment.");
      return;
    }
    
    // Additional validation to ensure all required data is available
    if (!doctor) {
      setError("Doctor information is not available. Please try again later.");
      return;
    }
    
    // Validate user ID
    if (!user._id) {
      setError("User information is incomplete. Please log out and log in again.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login?redirect=/book-appointment/" + docId);
        return;
      }
      
      // Make sure the date is properly formatted as ISO string
      const formattedDate = new Date(selectedDate).toISOString();
      
      const appointmentData = {
        doctorId: docId,
        userId: user._id,
        appointmentDate: formattedDate,
        appointmentTime: selectedTime,
        fees: doctor.fees,
        notes: notes.trim() // Trim whitespace from notes
      };
      
      const response = await axios.post(
        `${API_URL}/api/appointment/create`,
        appointmentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        const appointmentId = response.data.appointment._id;
        
        // If user chose to pay now, initiate Razorpay payment
        if (paymentOption === "now") {
          await initiatePayment(appointmentId);
        } else {
          // Otherwise, redirect to appointments page
          navigate("/my-appointments?status=success");
        }
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      if (error.response && error.response.data) {
        setError(error.response.data.message || "Failed to book appointment. Please try again.");
      } else {
        setError("Failed to book appointment. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    };
  };

  const initiatePayment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Create Razorpay order
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
        throw new Error(orderResponse.data.message || "Failed to create payment order");
      }
      
      const { order, key_id } = orderResponse.data;
      
      // Load Razorpay script dynamically
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        const options = {
          key: key_id,
          amount: order.amount,
          currency: order.currency,
          name: "Prescripto",
          description: "Doctor Appointment Payment",
          order_id: order.id,
          image: assets.logo,
          handler: async function(response) {
            try {
              // Verify payment
              const verifyResponse = await axios.post(
                `${API_URL}/api/appointment/verify-payment`,
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  appointmentId: appointmentId
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              
              if (verifyResponse.data.success) {
                navigate("/payment-history?status=success&payment=completed");
              } else {
                setError("Payment verification failed. Please contact support.");
                navigate("/my-appointments?status=warning&payment=failed");
              }
            } catch (error) {
              console.error("Error verifying payment:", error);
              setError("Payment verification failed. Please contact support.");
              navigate("/my-appointments?status=warning&payment=failed");
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || ""
          },
          theme: {
            color: "#3B82F6"
          },
          modal: {
            ondismiss: function() {
              // If payment is dismissed, redirect to appointments page
              navigate("/my-appointments?status=info&payment=cancelled");
            }
          }
        };
        
        try {
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        } catch (err) {
          console.error("Error opening Razorpay:", err);
          setError("Failed to open payment gateway. Please try again later.");
          document.body.removeChild(script);
          navigate("/my-appointments?status=warning&payment=failed");
        }
      };
      
      script.onerror = () => {
        setError("Failed to load payment gateway. Please try again later.");
        document.body.removeChild(script);
        navigate("/my-appointments?status=warning&payment=failed");
      };
      
    } catch (error) {
      console.error("Error initiating payment:", error);
      if (error.response && error.response.status === 503) {
        setError("Payment service is currently unavailable. Please try again later or pay at the clinic.");
        // Still navigate to appointments page, but with a warning
        navigate("/my-appointments?status=warning&message=payment_unavailable");
      } else {
        setError(error.response?.data?.message || "Failed to initiate payment. Please try again.");
        navigate("/my-appointments?status=warning&payment=failed");
      }
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  if (!doctor) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section - Matching Payment History Page */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isAuthenticated && user ? `Hello, ${user.name}` : "Book Appointment"}
        </h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
        >
          Back
        </button>
      </div>

      {/* Doctor Info Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="w-full flex justify-center items-center p-4 md:p-0 md:w-48">
            <img
              className="h-48 w-48 rounded-full object-cover object-center md:rounded-none md:h-48 md:w-48"
              src={doctor.image}
              alt={`Dr. ${doctor.name}`}
            />
          </div>
          <div className="p-6">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900">{doctor.name}</h2>
              <img
                className="w-5 h-5 ml-2"
                src={assets.verified_icon}
                alt="Verified"
              />
            </div>
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-gray-700">{doctor.degree}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-700">{doctor.speciality}</span>
            </div>
            <div className="mt-4">
              <span className="text-lg font-semibold text-primary">
                ₹{doctor.fees}
              </span>
              <span className="text-gray-600 ml-1">consultation fee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Book Your Appointment</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {/* Date Selection */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">Select Date</h3>
          {loadingDates ? (
            <div className="flex justify-center py-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading dates...</span>
              </div>
              <p className="ml-2 text-gray-600">Loading available dates...</p>
            </div>
          ) : availableDates.length > 0 ? (
            <div className="flex gap-3 items-center w-full overflow-x-auto pb-2">
              {availableDates.map((date, index) => (
                <div
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  className={`flex flex-col items-center justify-center py-3 px-5 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedDate && selectedDate.toDateString() === date.toDateString()
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-50 border border-gray-200 hover:border-primary"
                  }`}
                >
                  <p className="font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-lg font-bold mt-1">{date.getDate()}</p>
                  <p className="text-xs mt-1">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
              No available appointment slots found for this doctor in the next 7 days.
            </div>
          )}
        </div>
        
        {/* Time Selection */}
        {availableTimeSlots.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Select Time</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {availableTimeSlots.map((time, index) => (
                <div
                  key={index}
                  onClick={() => handleTimeSelect(time)}
                  className={`text-center py-2 px-1 rounded-lg cursor-pointer transition-all duration-200 ${
                    time === selectedTime
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-50 border border-gray-200 hover:border-primary"
                  }`}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Notes */}
        {selectedDate && selectedTime && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Additional Notes (Optional)</h3>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="3"
              placeholder="Any specific concerns or information you'd like to share with the doctor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        )}
        
        {/* Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">Appointment Summary</h3>
            <div className="flex justify-between items-center text-gray-600 mb-2">
              <span>Doctor:</span>
              <span className="font-medium">{doctor.name}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 mb-2">
              <span>Date:</span>
              <span className="font-medium">{selectedDate ? formatDate(selectedDate) : 'Not selected'}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 mb-2">
              <span>Time:</span>
              <span className="font-medium">{selectedTime || 'Not selected'}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 border-t border-gray-200 pt-2 mt-2">
              <span>Consultation Fee:</span>
              <span className="font-semibold text-primary">₹{doctor.fees}</span>
            </div>
          </div>
        )}
        
        {/* Payment Options */}
        {selectedDate && selectedTime && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Payment Options</h3>
            <div className="flex flex-col space-y-3">
              <div 
                className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                  paymentOption === "now" ? "border-primary bg-blue-50" : "border-gray-200"
                }`}
                onClick={() => setPaymentOption("now")}
              >
                <div className="flex-shrink-0 mr-4">
                  <img src={assets.razorpay_logo} alt="Razorpay" className="h-8" />
                </div>
                <div className="flex-grow">
                  <p className="font-medium">Pay now with Razorpay</p>
                  <p className="text-sm text-gray-600">Secure online payment</p>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full border ${
                    paymentOption === "now" ? "border-primary" : "border-gray-300"
                  } flex items-center justify-center`}>
                    {paymentOption === "now" && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                  </div>
                </div>
              </div>
              
              <div 
                className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                  paymentOption === "later" ? "border-primary bg-blue-50" : "border-gray-200"
                }`}
                onClick={() => setPaymentOption("later")}
              >
                <div className="flex-shrink-0 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <p className="font-medium">Pay later</p>
                  <p className="text-sm text-gray-600">Pay online before appointment or at the clinic</p>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full border ${
                    paymentOption === "later" ? "border-primary" : "border-gray-300"
                  } flex items-center justify-center`}>
                    {paymentOption === "later" && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Book Button */}
        <div className="flex justify-center">
          <button 
            onClick={handleBookAppointment}
            disabled={loading || !selectedDate || !selectedTime}
            className={`py-3 px-10 rounded-lg transition-all duration-200 flex items-center ${
              loading || !selectedDate || !selectedTime
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primary hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Confirm Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment; 