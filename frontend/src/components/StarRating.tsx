import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onChange,
  showValue = false,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= (hoverRating || rating);
        const halfFilled = !filled && starValue - 0.5 <= rating && rating < starValue;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-all duration-150`}
            onClick={() => {
              if (interactive && onChange) {
                onChange(starValue);
              }
            }}
            onMouseEnter={() => {
              if (interactive) setHoverRating(starValue);
            }}
            onMouseLeave={() => {
              if (interactive) setHoverRating(0);
            }}
          >
            <Star
              size={size}
              className={`transition-all duration-150 ${
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : halfFilled
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
              } ${interactive ? 'hover:drop-shadow-md' : ''}`}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
