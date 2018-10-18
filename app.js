var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var appLogger = require('./logger/appLogger')

var apiRouter = require('./routes/api');
var usersRouter = require('./routes/users');
var fileRouter = require('./routes/file');

var app = express();

app.use(session({
    secret :  'secret', // 对session id 相关的cookie 进行签名
    resave : true,
    saveUninitialized: false, // 是否保存未初始化的会话
    cookie : {
        maxAge : 1000 * 60 * 1000 // 设置 session 的有效时间，单位毫秒
    }
}));

appLogger.stream = {
    write: function (message, encoding) {
        appLogger.info(message)
    }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(morgan("dev", { "stream": appLogger.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);
app.use('/users', usersRouter);
app.use('/file', fileRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  return next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  var errMsg = ''
  if (typeof err !== 'string') {
      errMsg = err.message
  } else {
      errMsg = err
  }
  res.json({
      success: false,
      data: null,
      errMsg: errMsg
  })
});

module.exports = app;
