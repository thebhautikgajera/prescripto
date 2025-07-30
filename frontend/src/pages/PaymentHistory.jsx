import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppContext from "../context/AppContext";
import { toast } from "react-toastify";

const PaymentHistory = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  
  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login?redirect=/payment-history");
        return;
      }
      
      // If we have a token but no user data, try to get user data from localStorage
      if (!user) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // Make sure we have a valid user ID before making the API call
            if (!parsedUser || !parsedUser._id) {
              console.error("Invalid user data: missing _id");
              navigate("/login?redirect=/payment-history");
              return;
            }
            
            // Continue with the stored user data
            const response = await axios.get(
              `${API_URL}/api/payment/user/${parsedUser._id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            if (response.data.success) {
              setPayments(response.data.payments);
            } else {
              setError("Failed to load payment history");
              toast.error("Failed to load payment history");
            }
            return;
          } catch (err) {
            console.error("Error parsing stored user data:", err);
            navigate("/login?redirect=/payment-history");
            return;
          }
        } else {
          // No stored user data, redirect to login
          navigate("/login?redirect=/payment-history");
          return;
        }
      }
      
      // Ensure we have a valid user ID before making the API call
      if (!user._id) {
        console.error("Missing user ID");
        navigate("/login?redirect=/payment-history");
        return;
      }
      
      const response = await axios.get(
        `${API_URL}/api/payment/user/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setPayments(response.data.payments);
      } else {
        setError("Failed to load payment history");
        toast.error("Failed to load payment history");
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setError("Failed to load payment history. Please try again later.");
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, [user, navigate, API_URL]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, fetchPayments]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to download invoice
  const downloadInvoice = async (paymentId) => {
    try {
      setDownloadingInvoice(paymentId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to download invoice');
        navigate('/login?redirect=/payment-history');
        return;
      }

      // Using Blob to handle the PDF download
      const response = await axios.get(
        `${API_URL}/api/payment/invoice/${paymentId}`,
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
      link.setAttribute('download', `prescripto_invoice.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again later.');
    } finally {
      setDownloadingInvoice(null);
    }
  };



  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
        >
          Back
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 mt-4">No payment records found</h2>
          <p className="text-gray-500 mt-2">You haven&apos;t made any payments yet.</p>
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={() => navigate("/doctors")}
              className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Find a Doctor
            </button>
            <button 
              onClick={() => navigate("/my-appointments")}
              className="border border-primary text-primary hover:bg-primary hover:text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              View Appointments
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop view - Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.doctorId ? `Dr. ${payment.doctorId.name}` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.doctorId?.specialization || payment.doctorId?.speciality || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.appointmentId ? (
                          <div>
                            <div>
                              {new Date(payment.appointmentId.appointmentDate).toLocaleDateString()}
                            </div>
                            <div>
                              {payment.appointmentId.appointmentTime}
                            </div>
                            <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.appointmentId.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              payment.appointmentId.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              payment.appointmentId.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {payment.appointmentId.status}
                            </span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.status === 'completed' && (
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => downloadInvoice(payment._id, payment.paymentId)}
                              disabled={downloadingInvoice === payment._id}
                              className="text-primary hover:text-blue-700 flex items-center"
                            >
                              {downloadingInvoice === payment._id ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Loading...
                                </span>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                  </svg>
                                  Invoice
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile view - Cards */}
          <div className="md:hidden space-y-4">
            {payments.map((payment) => (
              <div key={payment._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold text-gray-900">
                    {payment.doctorId ? `Dr. ${payment.doctorId.name}` : 'N/A'}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  {payment.doctorId?.specialization || payment.doctorId?.speciality || 'N/A'}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">Date</div>
                    <div className="font-medium">{formatDate(payment.createdAt).split(' ')[0]}</div>
                    <div className="text-xs">{formatDate(payment.createdAt).split(' ')[1]}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-500 text-xs">Amount</div>
                    <div className="font-medium">₹{payment.amount.toFixed(2)}</div>
                    <div className="text-xs capitalize">{payment.paymentMethod}</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-gray-500 text-xs mb-1">Appointment</div>
                  {payment.appointmentId ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm">
                          {new Date(payment.appointmentId.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm font-medium">
                          {payment.appointmentId.appointmentTime}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.appointmentId.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        payment.appointmentId.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.appointmentId.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {payment.appointmentId.status}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm">N/A</div>
                  )}
                </div>
                
                {payment.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-gray-500 text-xs mb-1">Documents</div>
                    <div className="space-y-2">
                      <button
                        onClick={() => downloadInvoice(payment._id)}
                        disabled={downloadingInvoice === payment._id}
                        className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
                          downloadingInvoice === payment._id 
                            ? 'bg-gray-100 text-gray-500' 
                            : 'bg-primary text-white hover:bg-blue-700'
                        } transition-colors`}
                      >
                        {downloadingInvoice === payment._id ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            Download Invoice
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentHistory;