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
 
router.get('/boardList',function(req, res, next) {
    db.collection('board').orderBy("brddate","desc").get()
        .then((snapshot) => {
            var rows = [];
            snapshot.forEach((doc) => {
                var childData = doc.data();
                childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
                rows.push(childData);
            });
            res.render('board2/boardList', {rows: rows});
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
});

router.get('/boardRead',function(req, res, next) {
    db.collection('board').doc(req.query.brdno).get()
        .then((doc) => {
            var childData = doc.data();
             
            childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd hh:mm");
            res.render('board2/boardRead', {row: childData});
        })
});

router.get('/boardForm',function(req,res,next){
    if (!req.query.brdno) {// new
        res.render('board2/boardForm', {row:""});
        return;
    }
     
    // update
    db.collection('board').doc(req.query.brdno).get()
          .then((doc) => {
              var childData = doc.data();
              res.render('board2/boardForm', {row: childData});
          })
});
 
router.post('/boardSave',function(req,res,next){
    var postData = req.body;
    if (!postData.brdno) { // new
        postData.brddate = Date.now(); 

        var doc = db.collection("board").doc();
        postData.brdno = doc.id;
        doc.set(postData);
    }else {               // update
        var doc = db.collection("board").doc(postData.brdno);
        postData.brddate = parseInt(postData.brddate);
        doc.update(postData);
    }
     
    res.redirect('boardList');
});
 
router.get('/boardDelete',function(req,res,next){
    db.collection('board').doc(req.query.brdno).delete()
 
    res.redirect('boardList');
});
 
module.exports = router;