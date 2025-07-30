import React, { useContext, useEffect, useState, useCallback } from "react";
import { AdminContext } from "../context/AdminContextDefinition";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { 
  FaUserMd, 
  FaUsers, 
  FaCalendarCheck, 
  FaMoneyBillWave,
  FaFileAlt, 
  FaPlus, 
  FaCog,
  FaChevronRight
} from "react-icons/fa";

const AdminDashboard = () => {
  const { admin, token } = useContext(AdminContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    appointmentsToday: 0,
    monthlyRevenue: 0,
    revenueGrowth: "N/A",
    doctorsGrowth: "N/A",
    patientsGrowth: "N/A",
    appointmentsGrowth: "N/A"
  });

  const API_URL = import.meta.env.VITE_BACKEND_URI || 'http://localhost:4000';

  // Define dashboard stats cards with icons from React Icons
  const getStats = () => [
    { 
      id: 1, 
      name: "Total Doctors", 
      value: dashboardStats.totalDoctors.toString(), 
      icon: <FaUserMd size={24} className="text-white" />, 
      color: "bg-blue-600", 
      path: '/manage-doctors',
      growth: dashboardStats.doctorsGrowth
    },
    { 
      id: 2, 
      name: "Total Patients", 
      value: dashboardStats.totalPatients.toString(), 
      icon: <FaUsers size={24} className="text-white" />, 
      color: "bg-emerald-600", 
      path: '/manage-patients',
      growth: dashboardStats.patientsGrowth
    },
    { 
      id: 3, 
      name: "Appointments Today", 
      value: dashboardStats.appointmentsToday.toString(), 
      icon: <FaCalendarCheck size={24} className="text-white" />, 
      color: "bg-violet-600", 
      path: '/appointments',
      growth: dashboardStats.appointmentsGrowth
    },
    { 
      id: 4, 
      name: "Monthly Revenue", 
      value: `₹${dashboardStats.monthlyRevenue.toFixed(2)}`, 
      icon: <FaMoneyBillWave size={24} className="text-white" />, 
      color: "bg-amber-500", 
      path: '/payment-history',
      growth: dashboardStats.revenueGrowth
    }
  ];

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    
    setAppointmentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/appointment/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Get today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysAppointments = data.appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === today.getTime();
        });
        
        // Format appointments for display
        const formattedAppointments = todaysAppointments.map(appointment => ({
          id: appointment._id,
          appointmentId: appointment.appointmentId || 'N/A',
          patient: appointment.userId.name,
          doctor: appointment.doctorId.name,
          time: appointment.appointmentTime,
          status: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
        }));
        
        setRecentAppointments(formattedAppointments.slice(0, 5)); // Show only 5 recent appointments
      } else {
        setAppointmentsError(data.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointmentsError('Failed to connect to server. Please try again later.');
    } finally {
      setAppointmentsLoading(false);
    }
  }, [token, API_URL]);

  // Fetch recent doctors
  const fetchRecentDoctors = useCallback(async () => {
    if (!token) return;
    
    setDoctorsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Ensure all doctors have valid joinedDate
        const validDoctors = data.doctors.filter(doctor => doctor.joinedDate);
        
        // Parse dates properly - DD-MM-YYYY format to Date objects
        validDoctors.forEach(doctor => {
          try {
            if (doctor.joinedDate && doctor.joinedDate.includes('-')) {
              const [day, month, year] = doctor.joinedDate.split('-').map(Number);
              doctor._joinedDateObj = new Date(year, month - 1, day);
            } else {
              doctor._joinedDateObj = new Date(doctor.createdAt || Date.now());
            }
          } catch {
            doctor._joinedDateObj = new Date(doctor.createdAt || Date.now());
          }
        });
        
        // Sort doctors by joined date (most recent first)
        const sortedDoctors = [...validDoctors].sort((a, b) => {
          return b._joinedDateObj - a._joinedDateObj;
        });
        
        // Format doctors for display
        const formattedDoctors = sortedDoctors.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.speciality || 'General',
          status: doctor.available ? "Active" : "Inactive",
          joinedDate: doctor.joinedDate || 'Unknown'
        }));
        
        setRecentDoctors(formattedDoctors.slice(0, 5)); // Show only 5 recent doctors
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setDoctorsLoading(false);
    }
  }, [token, API_URL]);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    
    try {
      // Fetch doctors count
      const doctorsResponse = await fetch(`${API_URL}/api/admin/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const doctorsData = await doctorsResponse.json();
      
      // Fetch patients count
      const patientsResponse = await fetch(`${API_URL}/api/admin/patients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const patientsData = await patientsResponse.json();
      
      // Fetch all appointments for today's count and historical comparisons
      const appointmentsResponse = await fetch(`${API_URL}/api/appointment/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const appointmentsData = await appointmentsResponse.json();
      
      // Fetch payment stats for revenue
      const paymentStatsResponse = await fetch(`${API_URL}/api/payment/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const paymentStatsData = await paymentStatsResponse.json();
      
      if (doctorsData.success && patientsData.success && appointmentsData.success) {
        // Calculate today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysAppointments = appointmentsData.appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === today.getTime();
        });
        
        // Calculate yesterday's appointments for growth
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdaysAppointments = appointmentsData.appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === yesterday.getTime();
        });
        
        // Calculate monthly revenue
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate previous month for doctor and patient growth
        const previousMonth = new Date(today);
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        const prevMonth = previousMonth.getMonth();
        const prevYear = previousMonth.getFullYear();
        
        // Get monthly revenue from payment stats if available
        let monthlyRevenue = 0;
        let lastMonthRevenue = 0;
        
        if (paymentStatsData && paymentStatsData.success) {
          // Use total revenue from payment stats
          monthlyRevenue = paymentStatsData.stats.totalRevenue || 0;
          
          // Get current month revenue
          const currentMonthData = paymentStatsData.stats.monthlyRevenue.find(
            item => item._id === currentMonth + 1
          );
          const currentMonthRevenue = currentMonthData ? currentMonthData.total : 0;
          
          // Get last month revenue
          const lastMonth = currentMonth === 0 ? 12 : currentMonth;
          const lastMonthData = paymentStatsData.stats.monthlyRevenue.find(
            item => item._id === lastMonth
          );
          lastMonthRevenue = lastMonthData ? lastMonthData.total : 0;
          
          // If we have current month data, use that instead of total
          if (currentMonthRevenue > 0) {
            monthlyRevenue = currentMonthRevenue;
          }
        } else {
          // Fallback to appointment data if payment stats not available
          const monthlyAppointments = appointmentsData.appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.appointmentDate);
            return (
              appointmentDate.getMonth() === currentMonth && 
              appointmentDate.getFullYear() === currentYear && 
              appointment.paymentStatus === 'completed'
            );
          });
          
          monthlyRevenue = monthlyAppointments.reduce((total, appointment) => {
            return total + (appointment.fees || 0);
          }, 0);
          
          // Calculate last month revenue for comparison
          const lastMonthAppointments = appointmentsData.appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.appointmentDate);
            return (
              appointmentDate.getMonth() === prevMonth && 
              appointmentDate.getFullYear() === prevYear && 
              appointment.paymentStatus === 'completed'
            );
          });
          
          lastMonthRevenue = lastMonthAppointments.reduce((total, appointment) => {
            return total + (appointment.fees || 0);
          }, 0);
        }
        
        // Calculate doctor growth - find doctors who joined this month vs last month
        const currentMonthDoctors = doctorsData.doctors.filter(doctor => {
          if (!doctor.joinedDate) return false;
          const joinDate = new Date(doctor.joinedDate.split('-').reverse().join('-'));
          return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
        });
        
        const lastMonthDoctors = doctorsData.doctors.filter(doctor => {
          if (!doctor.joinedDate) return false;
          const joinDate = new Date(doctor.joinedDate.split('-').reverse().join('-'));
          return joinDate.getMonth() === prevMonth && joinDate.getFullYear() === prevYear;
        });
        
        // Calculate patient growth - we'd need to check registration dates
        // Since we don't have that data readily available, we'll use a more accurate estimate
        const currentMonthPatients = patientsData.patients.filter(patient => {
          if (!patient.joinedDate) return false;
          const joinDate = new Date(patient.joinedDate.split('-').reverse().join('-'));
          return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
        });
        
        const lastMonthPatients = patientsData.patients.filter(patient => {
          if (!patient.joinedDate) return false;
          const joinDate = new Date(patient.joinedDate.split('-').reverse().join('-'));
          return joinDate.getMonth() === prevMonth && joinDate.getFullYear() === prevYear;
        });
        
        // Calculate growth percentages with proper handling of edge cases
        let appointmentsGrowth = "N/A";
        if (yesterdaysAppointments.length > 0) {
          const growthRate = ((todaysAppointments.length - yesterdaysAppointments.length) / yesterdaysAppointments.length) * 100;
          const sign = growthRate >= 0 ? "+" : "";
          appointmentsGrowth = `${sign}${Math.round(growthRate)}% from yesterday`;
        } else if (todaysAppointments.length > 0) {
          appointmentsGrowth = "+100% from yesterday";
        }
        
        let revenueGrowth = "N/A";
        if (lastMonthRevenue > 0) {
          const growthRate = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
          const sign = growthRate >= 0 ? "+" : "";
          revenueGrowth = `${sign}${Math.round(growthRate)}% from last month`;
        } else if (monthlyRevenue > 0) {
          revenueGrowth = "+100% from last month";
        }
        
        let doctorsGrowth = "N/A";
        if (lastMonthDoctors.length > 0) {
          const growthRate = ((currentMonthDoctors.length - lastMonthDoctors.length) / lastMonthDoctors.length) * 100;
          const sign = growthRate >= 0 ? "+" : "";
          doctorsGrowth = `${sign}${Math.round(growthRate)}% from last month`;
        } else if (currentMonthDoctors.length > 0) {
          doctorsGrowth = "+100% from last month";
        }
        
        let patientsGrowth = "N/A";
        if (lastMonthPatients.length > 0) {
          const growthRate = ((currentMonthPatients.length - lastMonthPatients.length) / lastMonthPatients.length) * 100;
          const sign = growthRate >= 0 ? "+" : "";
          patientsGrowth = `${sign}${Math.round(growthRate)}% from last month`;
        } else if (currentMonthPatients.length > 0) {
          patientsGrowth = "+100% from last month";
        }
        
        setDashboardStats({
          totalDoctors: doctorsData.doctors.length,
          totalPatients: patientsData.patients.length,
          appointmentsToday: todaysAppointments.length,
          monthlyRevenue: monthlyRevenue,
          revenueGrowth,
          doctorsGrowth,
          patientsGrowth,
          appointmentsGrowth
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [token, API_URL]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/");
    } else {
      fetchAppointments();
      fetchDashboardStats();
      fetchRecentDoctors();
    }
  }, [token, navigate, fetchAppointments, fetchDashboardStats, fetchRecentDoctors]);

  // Handle tab changes
  useEffect(() => {
    if (activeTab === "doctors") {
      navigate("/manage-doctors");
    }
  }, [activeTab, navigate]);

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

  // Welcome section component
  const WelcomeSection = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {admin.name}</h2>
          <p className="text-gray-500 mt-1">Here's what's happening with your clinic today.</p>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <WelcomeSection />
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {getStats().map((stat) => (
                <div 
                  key={stat.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(stat.path)}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`${stat.color} rounded-xl p-3 mr-4`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                      {stat.growth && stat.growth !== "N/A" ? (
                        <span className={`text-xs font-medium ${stat.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.growth}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-500">No change</span>
                      )}
                    </div>
                  </div>
                  <div className={`h-1 w-full ${stat.color}`}></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Doctors */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center">
                    <FaUserMd className="h-5 w-5 mr-3 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-800">Recent Doctors</h3>
                  </div>
                  <button 
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    onClick={() => navigate('/manage-doctors')}
                  >
                    View All
                    <FaChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  {doctorsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading doctors...</p>
                    </div>
                  ) : recentDoctors.length === 0 ? (
                    <div className="text-center py-12">
                      <FaUserMd className="h-16 w-16 mx-auto text-gray-300" />
                      <p className="mt-4 text-gray-500">No doctors found.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {recentDoctors.map((doctor) => (
                          <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <span className="text-indigo-600 font-medium">{doctor.name.charAt(0)}</span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">Dr. {doctor.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{doctor.specialty}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${doctor.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                  doctor.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {doctor.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {doctor.joinedDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center">
                    <FaCalendarCheck className="h-5 w-5 mr-3 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-800">Today's Appointments</h3>
                  </div>
                  <button 
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    onClick={() => navigate('/appointments')}
                  >
                    View All
                    <FaChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  {appointmentsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading appointments...</p>
                    </div>
                  ) : appointmentsError ? (
                    <div className="text-center py-12 text-red-500">
                      {appointmentsError}
                    </div>
                  ) : recentAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <FaCalendarCheck className="h-16 w-16 mx-auto text-gray-300" />
                      <p className="mt-4 text-gray-500">No appointments scheduled for today.</p>
                      <button 
                        onClick={() => navigate('/appointments')}
                        className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                      >
                        View All Appointments
                      </button>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {recentAppointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{appointment.patient}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{appointment.doctor}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{appointment.appointmentId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{appointment.time}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                                  appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  appointment.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'}`}>
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case "patients":
        navigate('/manage-patients');
        return null;
      case "appointments":
        navigate('/appointments');
        return null;
      default:
        return null;
    }
  };

  return (
    <Layout 
      user={admin} 
      userType="admin" 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderTabContent()}
    </Layout>
  );
};

export default AdminDashboard; 