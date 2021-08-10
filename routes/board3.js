var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var dateFormat = require('dateformat');
 
router.get('/',function(req, res, next) {
    res.redirect('boardList');
});


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
firebase.initializeApp(config);
var db = firebase.firestore();
/* firebase-tool 명령어
    1. firebase login
    2. firebase init   - 호스팅 하기 위한 프로젝트를 생성(초기화)하기 위해 사용
    3. firebase deploy - 작성한 프로젝트를 서버에 배포할 때 사용.

    ctrl shift p  - 명령 팔렛트
*/
router.get('/boardList', async function(req, res, currentPage) {
    chkidentify(res, 'loginForm');

    var user = firebase.auth().currentUser;
    /*
    db.collection('board').orderBy("brddate","desc").get()
        .then((snapshot) => {
            var rows = [];
            snapshot.forEach((doc) => {
                var childData = doc.data();
                childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
                rows.push(childData);
            });
            res.render('board3/boardList', {rows: rows, user : user});
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
        */   
        /*
        const first  = db.collection('board').orderBy("brddate","desc").get().limit(3)
        .then((snapshot) => {
            const last = snapshot.docs[snapshot.docs.length - 1];

        })

        */      

        /*
        const snapshot = await citiesRef.get();
        if (snapshot.empty) {
        console.log('No matching documents.');
        return;
        }

        snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
        });
        */
        
        /* 첫번째 페이지  */

        var pagingSie = 3;
        var field = "brddate";
        var type  = "";
        
        if(req.query.type == null){
            type = "first";
        }
        else{
            type = req.query.type;
        }

        const first  = db.collection('board').orderBy("brddate","desc").limit(pagingSie).get()
        const snapshot = await first
        const last = snapshot.docs[snapshot.docs.length - 1];

        

        console.log("★★★★★type = "+type);
        if(type == "first"){
            console.log("★★★★★first");
            db.collection('board').orderBy(field, "desc").limit(pagingSie).get()
                .then((snapshot) => {
                    var rows = [];
                    snapshot.forEach((doc) => {
                        var childData = doc.data();
                        childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
                        rows.push(childData);
                    });
                    res.render('board3/boardList', {rows: rows, user : user});
                })
                .catch((err) => {
                    console.log('Error getting documents', err);
                });
        }
        else if (type == "last"){
            console.log("★★★★★last");
            const last = snapshot.docs[snapshot.docs.length - 1];

            db.collection('board').orderBy("brddate","desc").limitToLast(pagingSie).get()
                .then((snapshot) => {
                    var rows = [];
                    snapshot.forEach((doc) => {
                        var childData = doc.data();
                        childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
                        rows.push(childData);
                    });
                    res.render('board3/boardList', {rows: rows, user : user});
                })
                .catch((err) => {
                    console.log('Error getting documents', err);
                });
        }
        else{
            console.log("★★★★★more");

            const last = snapshot.docs[snapshot.docs.length - 1];
            
            db.collection('board').orderBy(field, "desc").startAfter(last.data().brddate).limit(pagingSie).get()
                .then((snapshot) => {
                    var rows = [];
                    snapshot.forEach((doc) => {
                        var childData = doc.data();
                        childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
                        rows.push(childData);
                    });
                    res.render('board3/boardList', {rows: rows, user : user});
                })
                .catch((err) => {
                    console.log('Error getting documents', err);
                });
        }
});
 
router.get('/boardRead',function(req, res, next) {
    chkidentify(res, 'loginForm');
    
    var user = firebase.auth().currentUser;

    db.collection('board').doc(req.query.brdno).get()
        .then((doc) => {
            var childData = doc.data();
             
            childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd hh:mm");
            res.render('board3/boardRead', {row: childData, userEmail : user.email});
        })
});
 
router.get('/boardForm',function(req,res,next){
    
    
    chkidentify(res, 'loginForm');

    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }

    if (!req.query.brdno) {// new
        
        var user = firebase.auth().currentUser;

        console.log("게시물 작성"+user);

        res.render('board3/boardForm', {
            row       : "",
            userEmail : user.email
        });
        return;
    }
     
    // update
    db.collection('board').doc(req.query.brdno).get()
          .then((doc) => {
              var childData = doc.data();
              var user = firebase.auth().currentUser;
              res.render('board3/boardForm', {
                  row: childData,
                  userEmail : user.email
            });
          })
});
 
router.post('/boardSave',function(req,res,next){
    var user = firebase.auth().currentUser;
    
    chkidentify(res, 'loginForm');
    
    var postData = req.body;
    if (!postData.brdno) { // new
        postData.brddate = Date.now(); 

        var doc = db.collection("board").doc();
        postData.brdno = doc.id;
        postData.brdwriter = user.email;
        doc.set(postData);
    }else {               // update
        var doc = db.collection("board").doc(postData.brdno);
        postData.brddate = parseInt(postData.brddate);
        doc.update(postData);
    }
     
    res.redirect('boardList');
});
 
router.get('/boardDelete',function(req,res,next){
    chkidentify(res, 'loginForm');

    db.collection('board').doc(req.query.brdno).delete()
 
    res.redirect('boardList');
});
 

router.get('/loginForm', function(req, res, next) {
    res.render('board3/loginForm');
});

router.post('/loginChk', function(req, res, next) {
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.passwd)
       .then(function(firebaseUser) {
           res.redirect('boardList');
       })
      .catch(function(error) {
          res.redirect('loginForm');
      });   
});

function chkidentify(response, returnUrl){
    if (!firebase.auth().currentUser) {
        response.redirect(returnUrl);
        return;
    }
}
module.exports = router;