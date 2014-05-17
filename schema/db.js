/*
######## MongoDB schemas ############
*/

var mongoose = require('mongoose');

//var db = mongoose.connection;
var userSchema = mongoose.Schema({
  username: String,
  password: String,
}, {
	collection: 'users'
});

module.exports = mongoose.model('users', userSchema);

var chatSchema = mongoose.Schema({
  sender: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  receiver: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  time: Date 
}, {
      collection: 'chats'
});

module.exports = mongoose.model('chats', chatSchema);

var msgSchema = mongoose.Schema({
  msg: String,
  user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  chat: [{ type: mongoose.Schema.Types.ObjectId, ref: 'chats' }],
  time: Date 
}, {
      collection: 'msgs'
});

module.exports = mongoose.model('msgs', msgSchema);
