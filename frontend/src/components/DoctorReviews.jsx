import { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from 'prop-types';

const DoctorReviews = ({ doctorId }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/review/doctor/${doctorId}`);
        
        if (response.data.success) {
          setReviews(response.data.reviews);
          setAverageRating(response.data.averageRating);
        } else {
          setError("Failed to load reviews");
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchReviews();
    }
  }, [doctorId, API_URL]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        // Full star
        stars.push(
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        // Empty star
        stars.push(
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Patient Reviews</h3>
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Patient Reviews</h3>
        <p className="text-red-500 py-4">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold">Patient Reviews</h3>
        <div className="flex items-center">
          <div className="flex mr-2">
            {renderStars(Math.round(averageRating))}
          </div>
          <span className="text-base font-medium">{averageRating} Star</span>
          <span className="text-gray-500 text-sm ml-1">({reviews.length} reviews)</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                  <img 
                    src={review.userId.image} 
                    alt={review.userId.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/40?text=User";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-medium text-sm truncate">{review.userId.name}</h4>
                    <span className="text-xs text-gray-500 mt-1 sm:mt-0">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="flex mt-1">
                    {renderStars(review.rating)}
                  </div>
                  <p className="mt-2 text-gray-700 text-sm">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Add PropTypes validation
DoctorReviews.propTypes = {
  doctorId: PropTypes.string.isRequired
};

export default DoctorReviews; 