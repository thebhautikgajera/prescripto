import React from "react";

const StarRating = ({ rating, size = "small", showNumber = false }) => {
  // Determine star size based on the size prop
  const starSizeClass = size === "large" ? "h-6 w-6" : size === "medium" ? "h-5 w-5" : "h-4 w-4";

  // Render stars based on rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Full stars
    for (let i = 1; i <= fullStars; i++) {
      stars.push(
        <svg 
          key={`full-${i}`} 
          xmlns="http://www.w3.org/2000/svg" 
          className={`${starSizeClass} text-yellow-400`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <svg 
          key="half" 
          xmlns="http://www.w3.org/2000/svg" 
          className={`${starSizeClass} text-yellow-400`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path 
            fill="url(#halfGradient)" 
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
          />
        </svg>
      );
    }

    // Empty stars
    const emptyStarsCount = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStarsCount; i++) {
      stars.push(
        <svg 
          key={`empty-${i}`} 
          xmlns="http://www.w3.org/2000/svg" 
          className={`${starSizeClass} text-gray-300`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div className="flex items-center">
      <div className="flex">{renderStars()}</div>
      {showNumber && (
        <span className={`ml-1 font-medium ${size === "large" ? "text-lg" : ""}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating; 