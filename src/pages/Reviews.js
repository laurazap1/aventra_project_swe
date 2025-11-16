import React, { useEffect, useState } from 'react';

// Import local images
import newyorkImg from '../assets/newyork.jpg';
import londonImg from '../assets/london.jpg';
import tokyoImg from '../assets/tokyo.jpg';
import parisImg from '../assets/paris.jpg';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    username: '',
    destination_name: '',
    rating: '',
    review_text: '',
    image: null
  });

  // Map destination names → images + country
  const DESTINATIONS = {
    'new york': { name: 'New York', country: 'USA', image: newyorkImg },
    'london': { name: 'London', country: 'United Kingdom', image: londonImg },
    'tokyo': { name: 'Tokyo', country: 'Japan', image: tokyoImg },
    'paris': { name: 'Paris', country: 'France', image: parisImg }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/reviews/101');
      const data = await response.json();

      setReviews(data.length > 0 ? data : demoReviews());
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews(demoReviews());
    }
  };

  // Demo reviews now use destination_name
  const demoReviews = () => {
    return [
      { username: 'Alice', rating: 5, review_text: 'Amazing!', destination_name: 'New York' },
      { username: 'Bob', rating: 4, review_text: 'Great time!', destination_name: 'London' },
      { username: 'Charlie', rating: 3, review_text: 'Okay.', destination_name: 'Tokyo' },
      { username: 'Diana', rating: 5, review_text: 'Loved it!', destination_name: 'Paris' }
    ];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewReview({ ...newReview, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", newReview.username);
    formData.append("destination_name", newReview.destination_name);
    formData.append("rating", newReview.rating);
    formData.append("review_text", newReview.review_text);

    if (newReview.image) {
      formData.append("image", newReview.image);
    }

    await fetch("http://127.0.0.1:5000/reviews", {
      method: "POST",
      body: formData
    });

    fetchReviews();

    setNewReview({
      username: '',
      destination_name: '',
      rating: '',
      review_text: '',
      image: null
    });
  };

  return (
    <div className="container mx-auto text-center mt-20 px-4">
      <h2 className="text-4xl font-bold mb-4">Traveler Reviews</h2>
      <p className="text-gray-700 mb-8">See and share experiences from other travelers.</p>

      {/* Submit Review Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-10 max-w-xl mx-auto">
        <h3 className="text-2xl font-semibold mb-4">Submit a Review</h3>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">

          {/* Name */}
          <input
            type="text"
            name="username"
            placeholder="Your Name"
            value={newReview.username}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Destination Name (TEXT BOX) */}
          <input
            type="text"
            name="destination_name"
            placeholder="Destination Name (e.g., Paris)"
            value={newReview.destination_name}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Rating (DROPDOWN) */}
          <select
            name="rating"
            value={newReview.rating}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Rating (1–5)</option>
            <option value="1">⭐ 1</option>
            <option value="2">⭐⭐ 2</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
          </select>

          {/* Review */}
          <textarea
            name="review_text"
            placeholder="Your Review"
            value={newReview.review_text}
            onChange={handleChange}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Upload Image */}
          <div className="text-left">
            <label className="block mb-1 font-medium">Upload a Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setNewReview({ ...newReview, image: e.target.files[0] })
              }
              className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
          >
            Submit Review
          </button>
        </form>
      </div>

      {/* Existing Reviews */}
      <div>
        <h3 className="text-2xl font-semibold mb-6">Existing Reviews</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {reviews.map((review, index) => {
            const key = review.destination_name?.toLowerCase();
            const dest = DESTINATIONS[key] || {
              name: review.destination_name,
              country: "Unknown",
              image: "https://source.unsplash.com/600x400/?travel"
            };

            return (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">

                <div className="relative">
                  <img
                    src={dest.image}
                    className="w-full h-48 object-cover"
                    alt={dest.name}
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    {review.username}
                  </div>
                </div>

                <div className="px-5 py-3 text-left">
                  <h4 className="text-lg font-semibold">{dest.name}</h4>
                  <p className="text-gray-500 text-sm">{dest.country}</p>
                </div>

                <div className="px-5 pb-5 text-left">
                  <p className="text-yellow-500 font-bold mb-2">⭐ {review.rating}/5</p>
                  <p className="text-gray-700">{review.review_text}</p>
                </div>

              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
