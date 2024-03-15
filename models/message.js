const mongoose = require('mongoose');


const messageSchema = mongoose.Schema({
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  receiver:  { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  message: String,
  date: Date,
});

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;