import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-gradient-to-r from-primary to-blue-500 rounded-2xl shadow-xl overflow-hidden my-20">
      {/* Container */}
      <div className="flex flex-col md:flex-row items-center">
        {/* Left side */}
        <div className="w-full md:w-1/2 p-10 md:p-16 lg:p-20">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4">
              Book Appointment
            </h2>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-medium mb-6">
              With 100+ Trusted Doctors
            </h3>
            <p className="text-white/90 mb-8 max-w-md">
              Get access to the best healthcare professionals with just a few clicks. 
              Our platform makes it easy to find and book appointments with specialists.
            </p>
            <button 
              onClick={() => {
                navigate('/login'); 
                scrollTo(0,0);
              }} 
              className="bg-white text-primary hover:bg-blue-50 px-8 py-3 rounded-full text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="hidden md:block md:w-1/2 relative h-full">
          <img 
            className="w-full max-w-lg ml-auto" 
            src={assets.appointment_img} 
            alt="Doctor appointment illustration" 
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;
