import { useContext, useEffect, useState } from "react";
import AppContext from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import StarRating from "./StarRating";

const RelatedDoctors = ({ speciality, currentDoctorId }) => {
  const { doctors, loading, error } = useContext(AppContext);
  const navigate = useNavigate();

  const [relDocs, setRelDocs] = useState([]);

  useEffect(() => {
    if (doctors && doctors.length > 0 && speciality) {
      const doctorsData = doctors.filter(
        (doc) => doc.speciality === speciality && doc._id !== currentDoctorId
      );
      setRelDocs(doctorsData);
    }
  }, [doctors, speciality, currentDoctorId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Related Doctors</h2>
        <div className="w-full flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Related Doctors</h2>
        <p className="text-red-500 py-4">Error loading doctors. Please try again later.</p>
      </div>
    );
  }

  if (!relDocs || relDocs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Related Doctors</h2>
        <p className="text-gray-500 py-4">No related doctors available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Related Doctors</h2>
        <p className="text-gray-600 text-sm mt-2">
          Other doctors specializing in {speciality}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {relDocs.slice(0, 4).map((doctor, index) => (
          <div
            onClick={() => {
              navigate(`/appointment/${doctor._id}`);
              scrollTo(0, 0);
            }}
            key={doctor._id || index}
            className="bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300"
          >
            <div className="relative">
              <div className="relative pb-[75%]">
                <img 
                  src={doctor.image} 
                  alt={`Dr. ${doctor.name}`}
                  className="absolute inset-0 w-full h-full object-contain bg-gray-50" 
                />
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>Available</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-gray-900 font-medium">{doctor.name}</h3>
              <p className="text-gray-500 text-xs mt-1">{doctor.speciality}</p>
              <div className="mt-2 flex items-center">
                <StarRating rating={doctor.averageRating || 0} />
                <span className="text-xs text-gray-500 ml-1">
                  ({doctor.reviewsCount || 0})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {relDocs.length > 4 && (
        <div className="text-center mt-2">
          <button
            onClick={() => {
              navigate(`/doctors/${speciality}`);
              scrollTo(0, 0);
            }}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-full text-sm font-medium transition-colors"
          >
            View All {speciality} Doctors
          </button>
        </div>
      )}
    </div>
  );
};

RelatedDoctors.propTypes = {
  speciality: PropTypes.string,
  currentDoctorId: PropTypes.string
};

export default RelatedDoctors;
