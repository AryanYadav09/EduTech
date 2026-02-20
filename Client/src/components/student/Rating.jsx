import React, {useEffect, useState} from 'react'

const Rating = ({ initialRating = 0, onRate, readonly = false, className = "text-xl sm:text-2xl" }) => {

  const [rating, setRating] = useState(Number(initialRating) || 0);

  const handleRating = (value) => {
    if (readonly) return;
    setRating(value);
    if (onRate) onRate(value)
  }

  useEffect(() => {
    setRating(Number(initialRating) || 0);
  }, [initialRating])
  return (
    <div className='inline-flex items-center'>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        return (
          <span key={index} className={`${className} transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'} ${starValue <= rating ? 'text-yellow-500' : 'text-gray-400'}`}
          onClick={() => handleRating(starValue)} >
            &#9733;
          </span>
        )
      })}
    </div>
  )
}

export default Rating
