import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext";
import StarRating from "./StarRating";

const TopDoctors = () => {
  const navigate = useNavigate();
  const { doctors, loading, error } = useContext(AppContext);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 my-16 text-gray-900">
        <h2 className="text-3xl font-semibold">Top Doctors to Book</h2>
        <div className="w-full flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 my-16 text-gray-900">
        <h2 className="text-3xl font-semibold">Top Doctors to Book</h2>
        <p className="text-red-500 py-5">Error loading doctors. Please try again later.</p>
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 my-16 text-gray-900">
        <h2 className="text-3xl font-semibold">Top Doctors to Book</h2>
        <p className="py-5">No doctors available at the moment. Please check back later.</p>
      </div>
    );
  }

  // Sort doctors by average rating (if available)
  const sortedDoctors = [...doctors].sort((a, b) => {
    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;
    return ratingB - ratingA;
  });

  return (
    <div className="flex flex-col items-center gap-6 my-20 text-gray-900">
      <h2 className="text-3xl font-semibold">Top Doctors to Book</h2>
      <p className="max-w-lg text-center text-gray-600">
        Simply browse through our extensive list of trusted doctors and schedule your appointment hassle-free.
      </p>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-8">
        {sortedDoctors.slice(0, 5).map((doctor, index) => (
          <div
            onClick={() => {
              navigate(`/appointment/${doctor._id}`);
              scrollTo(0, 0);
            }}
            key={doctor._id || index}
            className="bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300"
          >
            <div className="relative">
              <div className="relative pb-[100%]">
                <img 
                  src={doctor.image} 
                  alt={`Dr. ${doctor.name}`} 
                  className="absolute inset-0 w-full h-full object-contain bg-gray-50" 
                />
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>Available</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-gray-900 text-lg font-medium">{doctor.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{doctor.speciality}</p>
              <div className="mt-2 flex items-center">
                <StarRating rating={doctor.averageRating || 0} />
                <span className="text-sm text-gray-500 ml-2">
                  ({doctor.reviewsCount || 0} reviews)
                </span>
              </div>
              <button className="w-full mt-3 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
                Book Appointment
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          navigate("/doctors");
          scrollTo(0, 0);
        }}
        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-10 py-3 rounded-full mt-10 font-medium transition-colors duration-300 shadow-sm"
      >
        View All Doctors
      </button>
    </div>
  );
};

export default TopDoctors;
