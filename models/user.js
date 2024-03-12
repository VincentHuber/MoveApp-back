const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
  nickname: String,
  email:String,
  password : String,
  adress: String,
  description:String,
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
});

const User = mongoose.model('users', userSchema);

module.exports = User;