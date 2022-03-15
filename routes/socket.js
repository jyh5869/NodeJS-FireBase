var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var dateFormat = require('dateformat');
 

var config = {
    apiKey: "AIzaSyD_tg-m8Y77Q7K_w2lyY68igE4RWy-63DY",
    authDomain: "nodejs-54f7b.firebaseapp.com",
    databaseURL: "https://nodejs-54f7b-default-rtdb.firebaseio.com",
    projectId: "nodejs-54f7b",
    storageBucket: "nodejs-54f7b.appspot.com",
    messagingSenderId: "647841088954",
    appId: "1:647841088954:web:03a1abd6bf64a363d7c983",
    measurementId: "G-4LBL09LTYG"
};
if (!firebase.apps.length) {

    firebase.initializeApp(config);
} 
else {

    firebase.app();
}

var db = firebase.firestore();

router.get('/chatting', async function(req, res, next) {

    chkidentify(res, 'loginFormForChatting');
    
    const user = firebase.auth().currentUser;
    if(user == null){//로그인 체크 중복 (이유모를 원인으로 로그인 체크 동작 안함 ※추후 조치 예정)
        res.render("board3/loginForm",  { menuType : 'chatting'});
    }
    else {
        console.log(user.displayName);
        res.render('socket/chatting' ,  { userEmail : user.email, userName : user.displayName} );
    }
});


/*
    채팅 이력 가져오기
*/
router.post('/getChtHistory', async function(req, res, next) {
    db.collection('chatting').orderBy("regDate", "asc").get()//.startAt(last.data().brddate).limit(pagingSize).get()
        .then((snapshot) => {
            var rows = [];
            snapshot.forEach((doc) => {
                var childData = doc.data();
                childData.regDate = dateFormat(childData.regDate,"yyyy-mm-dd");
                //childData.receiveId = firebase.auth().doc(childData.receiveId).displayName;

                rows.push(childData);
            });
            res.json({rows: rows, user: "하이하이"});
            //res.json({rows: rows, user : user, currentPage : currentPage});
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
});

const formidable = require('formidable')
var fs = require('fs')
var filePath = "C:/service/"
router.post('/setChattingText', function(req, res, next) {

    chkidentify(res, 'loginFormForChatting');

    var form = new formidable.IncomingForm();

    form.uploadDir = filePath 
    form.keepExtension =true
    form.multiples =true
    
    form.parse(req, function(err, fields, files) {
        console.log(fields);

        var postData = fields;
        var chtDoc = db.collection("chatting").doc();

        var postDataCht = {
            textId    : chtDoc.id,
            sendId    : postData.sender,
            receiveId : postData.receiver,
            message   : postData.message,
            regDate   : Date.now()
        };

        chtDoc.set(postDataCht);     
    });

    res.json({userEmail: "userEmail", setUserName: "setUserName"});
});

/* 로그인 페이지로 이동 */
router.get('/loginFormForChatting', function(req, res, next) {
    
    res.render('board3/loginForm', { menuType : 'chatting'});
});

/* 로그인 Action*/
router.post('/loginChk', function(req, res, next) {
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.passwd)
        .then(function(firebaseUser) {
            /* -- displayName 설정
            firebaseUser.user.updateProfile({
                displayName: ""
            })
            */
            res.redirect('chatting');
        })
        .catch(function(error) {
            res.redirect('loginForm', error);
        });   
});

router.post('/setUserName', function(req, res, next) {

    chkidentify(res, 'loginFormForChatting');

    var userEmail = req.query.userEmail;
    var setUserName = req.query.setName;

    const user = firebase.auth().currentUser;
    
    user.updateProfile({
        displayName: setUserName
    });
    res.json({userEmail: userEmail, setUserName: setUserName});
});

/* 로그인 여부 체크 */
function chkidentify(response, returnUrl){
    if (!firebase.auth().currentUser) {
        response.redirect(returnUrl);
        return false;
    }
}

module.exports = router;

