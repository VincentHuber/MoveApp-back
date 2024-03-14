const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  sender: String, 
  date: Date,
  stars: Number,
  review: String,
});


const userSchema = mongoose.Schema({
  nickname: String,
  email:String,
  password : String,
  adress: String,
  description:String,
  averageStar:Number,
  isLog: Boolean,
  sports:{
    Football: Boolean,
    Basketball: Boolean,
    Running: Boolean,
    Tennis: Boolean
  },
  ambition:String,
  coverPicture:String,
  profilePicture:String,
  token: String,
  match:[],
  reviews: [reviewSchema]
});

const User = mongoose.model('users', userSchema);

module.exports = User;