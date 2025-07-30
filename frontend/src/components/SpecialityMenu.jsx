import { specialityData } from "../assets/assets";
import { Link } from "react-router-dom";

const SpecialityMenu = () => {
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-gray-800"
      id="speciality"
    >
      <h1 className="text-3xl font-medium">Find by Speciality</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through our extensive list of trusted doctors, schedule
        your appointment hassle-free.
      </p>
      <div className="flex sm:justify-center gap-4 pt-5 overflow-scroll w-full">
        {specialityData.map((speciality, index) => (
          <Link
            to={`/doctors/${speciality.speciality}`}
            onClick={() => scrollTo(0, 0)}
            key={index}
            className="flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500"
          >
            <img
              src={speciality.image}
              alt="doctor_img"
              className="w-16 sm:w-24 mb-2"
            />
            <p>{speciality.speciality} doctors</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SpecialityMenu;
