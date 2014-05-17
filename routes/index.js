var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var authPath = path.normalize(__dirname + "../../auth");
var passport = require(authPath);
var crypto = require('crypto');
var socketIO = require('socket.io');

// mongoose connection and calling schemas
mongoose.connect('mongodb://localhost/chatSys');
var SchemaPath = path.normalize(__dirname + '../../schema/db');
var models = require(SchemaPath);
var chats = mongoose.model('chats');
var userInfo = mongoose.model('users');
var msgs = mongoose.model('msgs');

// build login page
exports.login = function(req, res){
  res.render('login', { title: 'login' });
};

//Build register page
exports.register = function(req, res){
  res.render('register', { msg: '' });
};

//Add registered user
exports.makeRegister = function(req, res){
    var user = userInfo.findOne({username: req.body.password},
    function(err, users) {
      if (!users) {
        var hashPass = crypto.createHash("sha1").update(req.body.password).digest("hex");
          var registerUser = new userInfo({
            username: req.body.username,
            password: hashPass
          });
          registerUser.save(function(err, thor) {
            if (err) return console.error(err);
            console.dir(thor);
            req.login(registerUser, function (error) {
              if (error) { throw error; }
              res.redirect('/chat');
            });
          });
      }
      else {
        res.render('register', { msg: 'username is already taken' });
      }
    });
};

// build users page page
exports.users = function(req, res){
  if (req.session.passport.user === undefined) {
    res.redirect('/login');
  } else {
    var user = userInfo.find({username: req.session.passport.user},
    function(err, users) {
      users.forEach(function(userSignedIn) {
        userInfo.find({_id : {'$ne':userSignedIn._id }} ,function (err, userTbl) {
        if (err) return console.error(err);
          var sentData = {data: userTbl};
          res.render('users', sentData);
        });
      });
    });
  }
};

exports.chats = function(req, res){
  if (req.session.passport.user === undefined) {
    res.redirect('/login');
  } else {
    // get the signed in userID  
    var user = userInfo.find({username: req.session.passport.user},
    function(err, users) {
        var userSignedIn = users[0];
        // find if there is a previous chat opened with the other user
        chats.find({ $and: [
          { $or : [ { sender : userSignedIn._id }, { receiver : userSignedIn._id } ] },
          { $or : [ { sender : req.param("id") }, { receiver : req.param("id") } ] }
        ]}
         )
        .populate('sender')
        .populate('receiver')
        .exec( function (err, chatTbl) {
          if (err) return console.error(err);
          // check if there is a record returned 
          if (chatTbl.length > 0) {
            // trick through the sender and receiver from the actual signed in user 
            // so to bypass which user has actually started the chat log 
            if (req.param("id") == chatTbl[0].receiver[0]._id) {
              var receiver = chatTbl[0].receiver[0];
              var sender = chatTbl[0].sender[0];
            } else {
              var receiver = chatTbl[0].sender[0];
              var sender = chatTbl[0].receiver[0];
            }

            ////// CHECK CHAT MESSAGES //////////
             msgs.find( {chat: chatTbl[0]._id } )
            .populate('user')
            .populate('chat')
            .exec( function (err, msgsTbl) { 
              var sentData = { sender:  { id: sender._id , username: sender.username} ,
              receiver: {id: receiver._id, username: receiver.username} ,
              chatID: chatTbl[0]._id, data: msgsTbl };

              res.render('chats', sentData);
            });
            ////// CHECK CHAT MESSAGES //////////
            // if there is no chat started just add new chat
          } else {
              var chatsSent = new chats({
              sender: userSignedIn._id,
              receiver: req.param("id"),
              time: new Date()
            });
            chatsSent.save(function(err, thor) {
              if (err) return console.error(err);
              console.log(thor);
              // and redirect to the same page to start the actuall chat
              res.redirect('/chat/' + req.param("id"));
            });

          }
        });
    });
  }
};