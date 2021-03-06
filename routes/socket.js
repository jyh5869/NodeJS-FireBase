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
        res.render('socket/chatting' ,  { user : user} );
    }
});


/*
    채팅 이력 가져오기
*/
router.post('/getChtHistory', async function(req, res, next) {

    //채팅 히스토리 가져오기(기본 10개를 가져오고 이후 날짜기준으로 10개씩 추가 호출)
    var startDate = req.query.startDate == "" ? Date.now() : Number(req.query.startDate);
    var rows = [];

    const chtRef = db.collection('chatting').orderBy("regDate", "desc").startAfter(startDate).limit(10)
    const chtDoc = await chtRef.get();      
           
    chtDoc.forEach((doc) => {
        var childData = doc.data();
        childData.regDateFormat = dateFormat(childData.regDate,"yyyy-mm-dd");//날짜 세팅

        rows.push(childData);
    });

    /*
        채팅 히스토리와 유저의 닉네임 매칭(유저 컬렉션 사용)
        
        ※ for문 대신 foreach를 쓰게 되면 
        1. foreach를 횟수만큼 호출만 하면 역할을 다함( 호출후 처리 안함 )
        2. foreach는 병렬 처리 반복문이므로 반복문 이후 다른작업이 있다면 반복문을 병렬처리(닉네임 매칭)하면서 다음 작업(response)을 동시에 진행
        3. 아래 소스에서는 닉네임을 매칭하는 병렬처리 도중 response가 되므로 실제 응답값에서 닉네임 매칭부분이 누락 됨.
        4. 그러므로 for문(순차 실행) 을 이용하여 순차적으로 실행 되도록 수정하였음.
    */
    for(var i = 0 ; i < rows.length; i++ ){
       
        const userRef = db.collection('userInfo').where('userEmail', '==', rows[i].sendId);
        const userDoc = await userRef.get();      

        userDoc.forEach((doc) => {
            //1. 등록된 사용자일경우 -> 닉네임  2. 등록된 사용자가 아닐경우 -> 닉네임 없음
            var userNickName = doc.data().nickName;
            if(userNickName != null && userNickName != ""){
                
                rows[i].receiveId = rows[i].receiveId+"|"+userNickName;
            }
            else{
                
                rows[i].receiveId = rows[i].receiveId+"|(닉네임 없음)";
            }   
        });
    };

    res.json({rows: rows});
});

/* 채팅 리스트 가져오기 */
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

/* 유저 네임 변경 ajax */
router.post('/setUserName', async function(req, res, next) {

    chkidentify(res, 'loginFormForChatting');

    var userEmail   = req.query.userEmail;
    var setUserName = req.query.setName;

    const user = firebase.auth().currentUser;
    
    //닉네임 설정 1. Authentication
    user.updateProfile({
        displayName: setUserName
    });

    //닉네임 설정 2. userInfo(컬렉션).where
    const userRef =  db.collection('userInfo').where('userEmail', '==', userEmail).get()
    .then( async snapshot =>  {

        if(snapshot.size == 0 ){//최초 닉네임 설정
            var userDoc = db.collection("userInfo").doc();
    
            var postDataUser = {
                userId     : userDoc.id,
                userEmail  : userEmail,
                nickName   : setUserName,
                regDate    : Date.now(),
                modifyDate : null,
            };
    
            userDoc.set(postDataUser);
        }
        else {//닉네임 수정
            
            setUserRef = db.collection('userInfo').where('userEmail', '==', userEmail);
            const userDoc = await setUserRef.get();   
                
            userDoc.forEach((doc) => {
    
                boardDoc = db.collection("userInfo").doc(doc.id);
                boardDoc.update({
                    nickName    : setUserName,
                    modifyDate  : Date.now()
                });      
            }); 
        }
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