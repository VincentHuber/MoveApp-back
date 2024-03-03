const mongoose = require('mongoose');


const chatSchema = mongoose.Schema({
  user: [ { type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  message:[ { type: mongoose.Schema.Types.ObjectId, ref: 'message' }],
});

const Chat = mongoose.model('chats', chatSchema);

module.exports = Chat;