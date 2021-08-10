var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var bodyParser = require('body-parser')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
//1. /board1 = RealTIme DataBase 
//2. /board2 = Cloud FireStore
//3. /board3 = Cloud FireStroe + login
//app.use('/board1', require('./routes/board1'));
//app.use('/board2', require('./routes/board2'));
app.use('/board3', require('./routes/board3'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error'); error.jade
  res.render("error", {
    message: err.message,
    error: {status: err.status, stack: err.stack}
 });
  console.log( res.render('error'));
});

module.exports = app;

/* 
 - firebase setting 확인
https://github.com/settings/connections/applications/89cf50f02ac6aaed3484


-유의사항 1

firebaseHosting폴더는 Node.js의 기본 폴더 구조와 비슷해 보이는데, node_modules폴더의 위치가 다르다.
firebaseExample에서는 firebaseExample 폴더 아래에 있지만,
firebaseHosting에서는 firebaseHosting폴더 하위의 functions 폴더하위에 있다.

이 차이로 인해 각종 라이브러리 설치시  (npm ~~)

firebaseExample에서는 firebaseExample 폴더에서 실행하고,
firebaseHosting에서는 firebaseHosting폴더 하위의 functions 폴더에서 실행해야 한다.
라이브러리가 설치되는 node_modules 폴더와 설치된 라이브러리 정보가 저장되는 package.json가 functions 폴더에 생성되어 있다.

실행
1.firebase serve - http://localhost:5000/를 입력해서 그림가 같이 출력되면 firebase 호스팅을 위한 Node.js 프로젝트가 제대로 설정된 것이다.

*/
