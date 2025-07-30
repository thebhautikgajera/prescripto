import { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppContext from "../context/AppContext";
import StarRating from "../components/StarRating";

const Doctors = () => {
  const { speciality } = useParams();

  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  const { doctors, loading, error } = useContext(AppContext);

  useEffect(() => {
    if (doctors && doctors.length > 0) {
      if (speciality) {
        setFilterDoc(doctors.filter((doc) => doc.speciality === speciality));
      } else {
        setFilterDoc(doctors);
      }
    }
  }, [doctors, speciality]);

  if (loading) {
    return (
      <div className="md:mx-10 my-10 flex flex-col items-center">
        <p className="text-2xl text-gray-600 font-medium mb-8">
          Loading doctors...
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="md:mx-10 my-10">
        <p className="text-2xl text-gray-600 font-medium mb-8">
          Error loading doctors
        </p>
        <p className="text-red-500">
          There was an error loading the doctors. Please try again later.
        </p>
      </div>
    );
  }

  if (!filterDoc || filterDoc.length === 0) {
    return (
      <div className="md:mx-10 my-10">
        <p className="text-2xl text-gray-600 font-medium mb-8">
          No doctors found
        </p>
        <p>
          {speciality 
            ? `No doctors found for speciality: ${speciality}` 
            : "No doctors available at the moment. Please check back later."}
        </p>
      </div>
    );
  }

  return (
    <div className="md:mx-10 my-10">
      <p className="text-2xl text-gray-600 font-medium mb-8">
        Browse through the doctors specialist.
      </p>
      <div className="flex flex-col sm:flex-row items-start mt-5 gap-5">
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${
            showFilter ? "bg-primary text-white" : ""
          }`}
        >
          Filters
        </button>
        <div
          className={`flex-col gap-4 text-gray-600 ${
            showFilter ? "flex" : "hidden sm:flex"
          }`}
        >
          <p
            onClick={() =>
              speciality === "General Physician"
                ? navigate("/doctors")
                : navigate("/doctors/General Physician")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "General physician"
                ? "bg-indigo-100 font-semibold text-black"
                : ""
            }`}
          >
            General physician
          </p>
          <p
            onClick={() =>
              speciality === "Gynecologist"
                ? navigate("/doctors")
                : navigate("/doctors/Gynecologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Gynecologist"
                ? "bg-indigo-100 font-semibold text-black"
                : ""
            }`}
          >
            Gynecologist
          </p>
          <p
            onClick={() =>
              speciality === "Dermatologist"
                ? navigate("/doctors")
                : navigate("/doctors/Dermatologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Dermatologist"
                ? "bg-indigo-100 font-semibold text-black"
                : ""
            }`}
          >
            Dermatologist
          </p>
          <p
            onClick={() =>
              speciality === "Pediatricians"
                ? navigate("/doctors")
                : navigate("/doctors/Pediatricians")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Pediatricians"
                ? "bg-indigo-100 font-semibold text-black"
                : ""
            }`}
          >
            Pediatricians
          </p>
          <p
            onClick={() =>
              speciality === "Neurologist"
                ? navigate("/doctors")
                : navigate("/doctors/Neurologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Neurologist"
                ? "bg-indigo-100 font-semibold text-black"
                : ""
            }`}
          >
            Neurologist
          </p>
          <p
            onClick={() =>
              speciality === "Gastroenterologist"
                ? navigate("/doctors")
                : navigate("/doctors/Gastroenterologist")
            }
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              speciality === "Gastroenterologist"
                ? "bg-indigo-100 font-semibold text-black"
                : ""
            }`}
          >
            Gastroenterologist
          </p>
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filterDoc.map((doctor, index) => (
            <div
              onClick={() => {
                navigate(`/appointment/${doctor._id}`);
                scrollTo(0, 0);
              }}
              key={doctor._id || index}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="relative">
                <div className="relative pb-[100%]">
                  <img 
                    src={doctor.image} 
                    alt={`Dr. ${doctor.name}`} 
                    className="absolute inset-0 w-full h-full object-contain bg-gray-50" 
                  />
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  <span>Available</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-gray-900 text-lg font-medium">{doctor.name}</h3>
                <p className="text-gray-600 text-sm">{doctor.speciality}</p>
                <div className="mt-2 flex items-center">
                  <StarRating rating={doctor.averageRating || 0} />
                  <span className="text-sm text-gray-500 ml-1">
                    ({doctor.reviewsCount || 0} reviews)
                  </span>
                </div>
                <button className="w-full mt-3 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
