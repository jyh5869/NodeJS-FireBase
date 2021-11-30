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
app.use('/socket', require('./routes/socket'));
app.use('/common', require('./routes/common'));

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



/*
  * 참고 URL1 = https://berkbach.com/node-js%EC%99%80-socket-io%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-%EC%B1%84%ED%8C%85-%EA%B5%AC%ED%98%84-1-cb215954847b
  * 참고 URL2 = https://geundung.dev/61?category=719250
*/
/*
const http = require('http').createServer(app);
const io = require('socket.io')(http);


const http = require('http').createServer(app);
const io = require('socket.io')(http);
*/
/*
app.get('/chatting', (req, res) => {
  res.sendFile('socket/chatting2');

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => {
  console.log('user disconnected');
  });
});
*/

/*

io.on('connection', function(socket){
    console.log("유저 접속 됨");

    socket.on('send', function(data){
        console.log("전달된 메시지"+data.msg);
    });
    
    socket.on('disconnect', function(){
        console.log("접속 종료"+data.msg);
    })
});




http.listen(8080, () => {
  console.log('Connected at 3000');
});

*/

//make sure you keep this order


//... 


app.io = require('socket.io')();

app.io.on('connection',(socket) => {
  console.log('유저가 들어왔다');

  socket.on('disconnect', () => {
      console.log('유저 나갔다');
  });

  socket.on('chat-msg', (msg) => {
    app.io.emit('chat-msg', msg);
  });

});

module.exports = app;