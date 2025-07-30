import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import PaymentHistory from './pages/PaymentHistory'
import Appointment from './pages/Appointment'
import BookAppointment from './pages/BookAppointment'
import SymptomChecker from './pages/SymptomChecker'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ProtectedRoute, AuthRoute } from './components/ProtectedRoutes'

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
      <div className="pt-20 px-4 sm:px-[10%]">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          
          {/* Auth routes - not accessible when logged in */}
          <Route element={<AuthRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          
          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/appointment/:docId" element={<Appointment />} />
            <Route path="/book-appointment/:docId" element={<BookAppointment />} />
            <Route path="/symptom-checker" element={<SymptomChecker />} />
          </Route>
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App