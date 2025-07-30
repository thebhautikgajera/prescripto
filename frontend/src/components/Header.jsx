import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col md:flex-row flex-wrap my-5 bg-gradient-to-r from-primary to-blue-400 rounded-2xl shadow-xl overflow-hidden">
      {/* left side */}
      <div className="md:w-1/2 flex flex-col items-start justify-center gap-6 p-10 md:p-16 lg:p-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight">
          Book Appointment <br />
          With Trusted Doctors
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 text-white text-sm">
          <img className="w-28 drop-shadow-md" src={assets.group_profiles} alt="" />
          <p className="font-light leading-relaxed">
            Simply browse through our extensive list of trusted doctors,
            <br className="hidden sm:block" />
            schedule your appointment hassle-free.
          </p>
        </div>
        <button
          onClick={() => {
            const element = document.getElementById("speciality");
            element.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 bg-white px-8 py-3.5 rounded-full text-gray-700 text-sm font-medium m-auto md:m-0 hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          Book Appointment{" "}
          <img className="w-3" src={assets.arrow_icon} alt="" />
        </button>
      </div>

      {/* right side */}
      <div className="md:w-1/2 relative">
        <img
          src={assets.header_img}
          className="w-full md:absolute bottom-0 h-auto object-cover"
          alt=""
        />
      </div>
    </div>
  );
};

export default Header;
