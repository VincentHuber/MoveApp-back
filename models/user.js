const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
  nickname: String,
  mail:String,
  password : String,
  adress: String,
  description:String,
  isLog: Boolean,
  sports:[String],
  ambition:String,
  coverPicture:String,
  profilePicture:String,
  token: String,
});

const User = mongoose.model('users', userSchema);

module.exports = User;