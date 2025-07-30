import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ReviewForm = ({ doctorId, appointmentId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // API URL fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    // Check if user has already reviewed this doctor
    const checkExistingReview = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/review/user/doctor/${doctorId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success && response.data.hasReview) {
          setExistingReview(response.data.review);
          setRating(response.data.review.rating);
          setComment(response.data.review.comment);
        }
      } catch (error) {
        // If 404, no review exists, which is fine
        if (error.response && error.response.status !== 404) {
          console.error("Error checking existing review:", error);
        }
      }
    };

    if (doctorId) {
      checkExistingReview();
    }
  }, [doctorId, API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to submit a review");
      return;
    }

    try {
      setLoading(true);

      if (existingReview && isEditing) {
        // Update existing review
        const response = await axios.put(
          `${API_URL}/api/review/${existingReview._id}`,
          { rating, comment },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          toast.success("Review updated successfully");
          setExistingReview(response.data.review);
          setIsEditing(false);
          if (onReviewSubmitted) onReviewSubmitted(response.data);
        }
      } else {
        // Create new review
        const response = await axios.post(
          `${API_URL}/api/review/create`,
          {
            doctorId,
            appointmentId,
            rating,
            comment
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          toast.success("Review submitted successfully");
          setExistingReview(response.data.review);
          if (onReviewSubmitted) onReviewSubmitted(response.data);
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to delete a review");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_URL}/api/review/${existingReview._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success("Review deleted successfully");
        setExistingReview(null);
        setRating(0);
        setComment("");
        if (onReviewSubmitted) onReviewSubmitted(response.data);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  // Render stars for rating selection
  const renderRatingStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className="focus:outline-none"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-8 w-8 ${
              i <= (hoveredRating || rating) ? "text-yellow-400" : "text-gray-300"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    }
    return stars;
  };

  // If there's an existing review and not in edit mode, show the review
  if (existingReview && !isEditing) {
    return (
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Your Review</h3>
        <div className="flex mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${
                i < existingReview.rating ? "text-yellow-400" : "text-gray-300"
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-gray-700 mb-4">{existingReview.comment}</p>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Review
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Review"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">
        {isEditing ? "Edit Your Review" : "Write a Review"}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Rating</label>
          <div className="flex">
            {renderRatingStars()}
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="comment" className="block text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            id="comment"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this doctor..."
            required
          ></textarea>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Submitting..." : isEditing ? "Update Review" : "Submit Review"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm; 