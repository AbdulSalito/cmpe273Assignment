var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require("express-session");
var passport = require('./auth');
var socketIO = require('socket.io');


var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('port',  process.env.PORT || 3000 || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//HTML indention
app.locals.pretty = true;

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ 
    secret: 'ChatSystem', 
    maxAge: new Date(Date.now() + 3600000*60*60),
    cookie: { secure: false,
              maxAge: new Date(Date.now() + 3600000*60*60) }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


app.get('*', function(req, res, next) {
  // put user into res.locals for easy access from templates
  res.locals.user = req.user;

  next();
});

app.get('/', routes.users);
app.get('/login', routes.login);
app.post('/login', passport.authenticate('local', 
    { successRedirect: '/',
    failureRedirect: '/login'}
));

app.get('/chat/:id', routes.chats);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/register', routes.register);
app.post('/register', routes.makeRegister);


/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

var models = require('./schema/db');
var chats = mongoose.model('chats');
var userInfo = mongoose.model('users');
var msgs = mongoose.model('msgs');


var server = http.createServer(app);
var io = require('socket.io').listen(server);
var ObjectId = require('mongoose').Types.ObjectId; 

server.listen(app.get('port'));

io.sockets.on('connection', function (socket) {
  socket.on('openChat', function (RoomData) {
      //console.log(RoomData);
      socket.join(RoomData.chat);
      socket.on('send', function (data) {
        /////////////////////
        var msgSent = new msgs({
          msg: data.data.msg,
          user: data.data.SndUserID,
          chat: data.data.chatID,
          time: new Date()
        });
        msgSent.save(function(err, thor) {
          if (err) return console.error(err);
          console.dir(thor);
          io.sockets.in(RoomData.chat).emit('message', data);
          console.log(data);
        });

        /////////////////////
        //console.log(data);
    });
  });

});



/*http.createServer(app).listen(app.get('port'), function (){
    console.log('express is listening at ' + app.get('port'));
});*/