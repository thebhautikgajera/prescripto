import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ManageDoctors from './pages/ManageDoctors.jsx';
import AddDoctor from './pages/AddDoctor.jsx';
import EditDoctor from './pages/EditDoctor.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import ManagePatients from './pages/ManagePatients.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import PaymentHistoryPage from './pages/PaymentHistoryPage.jsx';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage.jsx';
import DoctorPatientsPage from './pages/DoctorPatientsPage.jsx';
import DoctorProfilePage from './pages/DoctorProfilePage.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
import DoctorSettingsPage from './pages/DoctorSettingsPage.jsx';
import { AdminProtectedRoute, AdminAuthRoute, DoctorProtectedRoute } from './components/ProtectedRoutes.jsx';
import { AdminContextStore } from './context/AdminContextStore.jsx';
import { DoctorContextStore } from './context/DoctorContextStore.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminContextStore>
        <DoctorContextStore>
          <Routes>
            <Route path="/" element={<App />} />
            
            {/* Auth routes - not accessible when logged in */}
            <Route element={<AdminAuthRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            
            {/* Admin protected routes */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/manage-doctors" element={<ManageDoctors />} />
              <Route path="/add-doctor" element={<AddDoctor />} />
              <Route path="/edit-doctor/:id" element={<EditDoctor />} />
              <Route path="/manage-patients" element={<ManagePatients />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/payment-history" element={<PaymentHistoryPage />} />
              <Route path="/admin-settings" element={<AdminSettingsPage />} />
            </Route>
            
            {/* Doctor protected routes */}
            <Route element={<DoctorProtectedRoute />}>
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor-appointments" element={<DoctorAppointmentsPage />} />
              <Route path="/doctor-patients" element={<DoctorPatientsPage />} />
              <Route path="/doctor-profile" element={<DoctorProfilePage />} />
              <Route path="/doctor-settings" element={<DoctorSettingsPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </DoctorContextStore>
      </AdminContextStore>
    </BrowserRouter>
  </React.StrictMode>,
);
