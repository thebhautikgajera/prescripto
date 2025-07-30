import React, { useContext, useEffect, useState, useCallback } from "react";
import { AdminContext } from "../context/AdminContextDefinition";
import Layout from "../components/Layout";
import axios from "axios";
import { toast } from "react-toastify";
import { format } from 'date-fns';

const PaymentHistoryPage = () => {
  const { admin, token } = useContext(AdminContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("payments");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [paymentStats, setPaymentStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    refunded: 0,
    failed: 0,
    totalAmount: 0
  });

  const API_URL = import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000';

  const calculatePaymentStats = useCallback((paymentData) => {
    const total = paymentData.length;
    
    // Calculate status stats
    const completed = paymentData.filter(p => p.status === 'completed').length;
    const pending = paymentData.filter(p => p.status === 'pending').length;
    const refunded = paymentData.filter(p => p.status === 'refunded').length;
    const failed = paymentData.filter(p => p.status === 'failed').length;
    
    // Calculate total amount (only from completed payments)
    const totalAmount = paymentData
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    setPaymentStats({
      total,
      completed,
      pending,
      refunded,
      failed,
      totalAmount
    });
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/payment`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setPayments(response.data.payments);
        calculatePaymentStats(response.data.payments);
      } else {
        setError("Failed to fetch payment history");
        toast.error("Failed to fetch payment history");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to fetch payment history. Please try again later.");
      toast.error("Failed to fetch payment history");
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, calculatePaymentStats]);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchPayments();
  }, [token, fetchPayments]);

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/payment/${paymentId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Payment status updated successfully");
        
        // Update local state
        const updatedPayments = payments.map(payment => 
          payment._id === paymentId ? { ...payment, status: newStatus } : payment
        );
        setPayments(updatedPayments);
        calculatePaymentStats(updatedPayments);
        
        // Close modal if open
        if (showModal && selectedPayment && selectedPayment._id === paymentId) {
          setSelectedPayment({...selectedPayment, status: newStatus});
        }
      } else {
        toast.error("Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to update payment status");
    }
  };

  // Sorting logic was removed (unused function)

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, 'dd MMMM, yyyy HH:mm');
      }
      return "Invalid date";
    } catch {
      return "Invalid date";
    }
  };

  // Filter and sort payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      (payment.userId?.name && payment.userId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.doctorId?.name && payment.doctorId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.paymentId && payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortConfig.key === 'createdAt') {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else if (sortConfig.key === 'patientName') {
      const nameA = a.userId?.name || '';
      const nameB = b.userId?.name || '';
      return sortConfig.direction === 'asc' 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    } else if (sortConfig.key === 'doctorName') {
      const nameA = a.doctorId?.name || '';
      const nameB = b.doctorId?.name || '';
      return sortConfig.direction === 'asc' 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    }
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  // Function to download invoice
  const downloadInvoice = async (paymentId) => {
    try {
      setDownloadingInvoice(paymentId);
      
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
      link.setAttribute('download', `invoice_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice. Please try again later.");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const ViewPaymentModal = () => {
    if (!selectedPayment) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Payment Details</h2>
            <button 
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="font-medium break-words">{selectedPayment.paymentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium break-words">{selectedPayment.orderId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{formatDate(selectedPayment.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">₹{selectedPayment.amount?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium capitalize">{selectedPayment.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedPayment.status)}`}>
                {selectedPayment.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Patient</p>
              <p className="font-medium">{selectedPayment.userId?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500">{selectedPayment.userId?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Doctor</p>
              <p className="font-medium">{selectedPayment.doctorId ? `Dr. ${selectedPayment.doctorId.name}` : 'N/A'}</p>
              <p className="text-xs text-gray-500">{selectedPayment.doctorId?.specialization || selectedPayment.doctorId?.speciality}</p>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end gap-4">
              {selectedPayment.status === 'completed' && (
                <button
                  onClick={() => downloadInvoice(selectedPayment._id)}
                  disabled={downloadingInvoice === selectedPayment._id}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  {downloadingInvoice === selectedPayment._id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Download Invoice
                    </>
                  )}
                </button>
              )}
              {selectedPayment.status !== 'completed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedPayment._id, 'completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Mark Completed
                </button>
              )}
              {selectedPayment.status !== 'refunded' && selectedPayment.status === 'completed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedPayment._id, 'refunded')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Process Refund
                </button>
              )}
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Payment History</h2>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <input
                type="text"
                placeholder="Search payments..."
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
            <button 
              onClick={fetchPayments}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-indigo-500 text-xl font-bold">{paymentStats.total}</div>
            <div className="text-gray-500 text-sm">Total Payments</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-500 text-xl font-bold">{paymentStats.completed}</div>
            <div className="text-gray-500 text-sm">Completed</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-500 text-xl font-bold">{paymentStats.pending}</div>
            <div className="text-gray-500 text-sm">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-500 text-xl font-bold">{paymentStats.refunded}</div>
            <div className="text-gray-500 text-sm">Refunded</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-500 text-xl font-bold">{paymentStats.failed}</div>
            <div className="text-gray-500 text-sm">Failed</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-500 text-xl font-bold">₹{paymentStats.totalAmount.toFixed(2)}</div>
            <div className="text-gray-500 text-sm">Total Revenue</div>
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
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search criteria.' : 'There are no payment records in the system yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        Date/Time
                        {sortConfig.key === 'createdAt' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('patientName')}
                      >
                        Patient
                        {sortConfig.key === 'patientName' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('doctorName')}
                      >
                        Doctor
                        {sortConfig.key === 'doctorName' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                        {sortConfig.key === 'amount' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(payment.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-0">
                              <div className="text-sm font-medium text-gray-900">{payment.userId?.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{payment.userId?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.doctorId ? `Dr. ${payment.doctorId.name}` : 'N/A'}</div>
                          <div className="text-sm text-gray-500">{payment.doctorId?.specialization || payment.doctorId?.speciality}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{payment.amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">ID: {payment.paymentId ? payment.paymentId.substring(0, 8) + '...' : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">{payment.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={payment.status}
                            onChange={(e) => handleUpdateStatus(payment._id, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.status)}`}
                          >
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="refunded">Refunded</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleViewPayment(payment)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            {payment.status === 'completed' && (
                              <button
                                onClick={() => downloadInvoice(payment._id)}
                                disabled={downloadingInvoice === payment._id}
                                className={`${downloadingInvoice === payment._id ? 'text-gray-400' : 'text-green-600 hover:text-green-900'}`}
                              >
                                {downloadingInvoice === payment._id ? 'Downloading...' : 'Invoice'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredPayments.length > 0 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedPayments.length)} of {sortedPayments.length} payments
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {showModal && <ViewPaymentModal />}
    </Layout>
  );
};

export default PaymentHistoryPage; 