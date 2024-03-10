const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  date: Date,
  stars: Number,
  review: String,
});

const Review = mongoose.model('reviews', reviewSchema);

module.exports = Review;